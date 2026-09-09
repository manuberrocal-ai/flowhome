import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { getLocalProductIllustration, catalogIllustrationCategories, illustrationCategories, getModelIllustration, modelIllustrations, getIllustrationCaption } from '../src/lib/product-image-policy.js';
import { generateProductSchema } from '../src/lib/seo.ts';
import { getProductImage, getProductImageAlt, getProductImageSourceLabel } from '../src/lib/product-art.ts';

test('unapproved remote catalog images are replaced, never treated as permission', () => {
  const product = { name: 'Example model', category: 'smart-hub', image: 'https://images.example/catalog.jpg' };
  assert.equal(getProductImage(product), '/images/product-art/illustrations-v1/smart-hub.webp');
  assert.equal(getProductImageSourceLabel(product), 'Category illustration — not a product photo');
  assert.equal(getProductImageAlt(product), 'Smart Hub category illustration; not a photo of Example model');
});

test('missing image and category artwork retain representative labeling', () => {
  for (const image of [undefined, '/images/product-placeholder.svg', '/images/product-art/smart-hub.svg']) {
    const product = { category: 'smart-hub', image };
    assert.equal(getProductImageSourceLabel(product), 'Category illustration — not a product photo');
    assert.equal(getProductImageAlt(product), 'Smart Hub category illustration; not a photo of the product');
    assert.equal(getProductImage(product), '/images/product-art/illustrations-v1/smart-hub.webp');
  }
});

test('every catalog identity maps to shipped category artwork, including old saved URLs', () => {
  const files = readdirSync('src/content/products').filter(file => file.endsWith('.yaml'));
  assert.equal(files.length, Object.keys(catalogIllustrationCategories).length);
  for (const file of files) {
    const source = readFileSync(`src/content/products/${file}`, 'utf8');
    const value = key => source.match(new RegExp(`^${key}: *(.+)$`, 'm'))[1].trim().replaceAll('"', '');
    const slug = value('slug'), asin = value('asin'), category = value('category'), image = value('image');
    assert.equal(catalogIllustrationCategories[slug], category, slug);
    assert.equal(image, `/images/product-art/illustrations-v1/${category}.png`);
    assert.ok(existsSync(`public${image}`), image);
    const optimized = getModelIllustration({ slug, asin, category })?.image ?? image.replace(/\.png$/, '.webp');
    assert.ok(existsSync(`public${optimized}`));
    assert.equal(getLocalProductIllustration({ slug, image: 'https://old.example/photo.jpg' }), optimized);
    assert.equal(getLocalProductIllustration({ asin, image: '/old-local.jpg' }), optimized);
  }
});

test('model illustration is selected by consistent identity, never by a stored path alone', () => {
  const model = modelIllustrations.find(item => item.slug === 'echo-dot-5th-gen');
  for (const identity of [{ slug: model.slug }, { asin: model.asin }, { slug: model.slug, asin: model.asin, category: model.category }]) {
    assert.equal(getLocalProductIllustration(identity), model.image);
    assert.equal(getIllustrationCaption(identity), model.caption);
    assert.equal(getProductImageAlt(identity), model.alt);
  }
  for (const identity of [{ image: model.image }, { slug: model.slug, asin: 'WRONG' }, { asin: model.asin, slug: 'echo-dot-with-clock' }, { slug: model.slug, category: 'smart-lock' }]) {
    assert.equal(getModelIllustration(identity), undefined);
    assert.notEqual(getLocalProductIllustration(identity), model.image);
  }
});

test('model artwork preserves illustration disclosure in structured data', () => {
  const model = modelIllustrations.find(item => item.slug === 'echo-dot-5th-gen');
  const schema = generateProductSchema({ ...model, name: 'Echo Dot 5th Gen' });
  assert.equal(schema.image.url, 'https://flowhome.dev' + model.image);
  assert.equal(schema.image.caption, model.alt);
  assert.match(getProductImageSourceLabel(model), /not a product photo/);
});

test('stored paths cannot authorize remote, traversal, or unlisted artwork', () => {
  for (const image of ['https://old.example/x.png', '//old.example/x.png', '/images/product-art/illustrations-v1/../x.png', '/images/product-art/illustrations-v1/smart-hub.png?old=1', '/images/product-art/fake.svg']) {
    assert.equal(getLocalProductIllustration({ image }), '/images/product-art/illustrations-v1/smart-home-device.webp');
  }
  for (const category of illustrationCategories) {
    const image = `/images/product-art/illustrations-v1/${category}.png`;
    assert.equal(getLocalProductIllustration({ image }), image.replace(/\.png$/, '.webp'));
    assert.equal(getLocalProductIllustration({ image: image.replace(/\.png$/, '.webp') }), image.replace(/\.png$/, '.webp'));
  }
});

test('Govee strip artwork is isolated from other lighting models and kit claims', () => {
  const model = modelIllustrations.find(item => item.slug === 'govee-rgbic-led-strip-lights');
  assert.equal(getLocalProductIllustration({ slug: model.slug, asin: model.asin }), model.image);
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageSourceLabel(model), /not a product photo or full kit/);
  assert.match(getProductImageAlt(model), /coiled section/);
  assert.notEqual(getLocalProductIllustration({ slug: 'wyze-bulb-color', category: 'smart-lighting' }), model.image);
  assert.equal(getModelIllustration({ slug: model.slug, asin: 'B096YFWVVS' }), undefined);
  assert.equal(getModelIllustration({ image: model.image }), undefined);
});

test('original Ring Wired artwork requires consistent identity and excludes newer models', () => {
  const model = modelIllustrations.find(item => item.slug === 'ring-video-doorbell-wired');
  assert.equal(getLocalProductIllustration({ slug: model.slug, asin: model.asin }), model.image);
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /original black Ring/);
  assert.match(getProductImageAlt(model), /not a product photo or full installation kit/);
  assert.equal(getModelIllustration({ slug: 'ring-wired-pro', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ slug: model.slug, category: 'security-camera' }), undefined);
  assert.equal(getModelIllustration({ image: model.image }), undefined);
});

test('Kasa EP10 illustration discloses one unit and excludes KP125 identity', () => {
  const model = modelIllustrations.find(item => item.slug === 'tp-link-kasa-smart-plug-mini');
  assert.equal(getLocalProductIllustration({ slug: model.slug, asin: model.asin }), model.image);
  assert.match(getProductImageSourceLabel(model), /one unit, not a product photo/);
  assert.match(getProductImageAlt(model), /not a product photo or the complete EP10P2 two-pack/);
  assert.equal(getModelIllustration({ slug: 'kasa-kp125', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ image: model.image }), undefined);
});

test('Amazon thermostat illustration does not replace other thermostat models', () => {
  const model = modelIllustrations.find(item => item.slug === 'amazon-smart-thermostat');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /sample 68 display/);
  assert.notEqual(getLocalProductIllustration({ slug: 'ecobee-smart-thermostat-premium', category: 'smart-thermostat' }), model.image);
  assert.equal(getModelIllustration({ slug: model.slug, asin: 'B09XXTQP3B' }), undefined);
});

test('Hue kit identifies two bulbs and Bridge without implying complete accessories', () => {
  const model = modelIllustrations.find(item => item.slug === 'philips-hue-white-color-starter-kit');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /two E26 color bulbs and a white square Hue Bridge/);
  assert.match(getProductImageSourceLabel(model), /accessories omitted/);
  assert.equal(getModelIllustration({ slug: 'hue-bridge-pro', asin: model.asin }), undefined);
});

test('Aqara M2 illustration stays separate from other hub identities', () => {
  const model = modelIllustrations.find(item => item.slug === 'aqara-hub-m2');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /low black circular Aqara Hub M2/);
  assert.equal(getModelIllustration({ slug: 'aqara-hub-m3', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'aeotec-smartthings-hub', category: 'smart-hub' }), model.image);
});

test('Q5+ artwork includes the dry auto-empty dock and excludes Q5 Pro identity', () => {
  const model = modelIllustrations.find(item => item.slug === 'roborock-q5-plus');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /Auto-Empty Dock Pure/);
  assert.equal(getModelIllustration({ slug: 'roborock-q5-pro', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'irobot-roomba-j7-plus', category: 'robot-vacuum' }), model.image);
});

test('eufy C120 family artwork excludes pan-tilt and Tapo camera identities', () => {
  const model = modelIllustrations.find(item => item.slug === 'eufy-security-indoor-cam-c120');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /fixed eufy Indoor Cam C120 family/);
  assert.equal(getModelIllustration({ slug: 'eufy-e220', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'tapo-c120-security-camera', category: 'security-camera' }), model.image);
});

test('Echo Show third-generation illustration isolates its identity and labels the sample display', () => {
  const model = modelIllustrations.find(item => item.slug === 'echo-show-8-3rd-gen');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /centered camera and rounded rear speaker/);
  assert.match(getProductImageSourceLabel(model), /sample screen/);
  assert.equal(getModelIllustration({ slug: 'echo-show-8-4th-gen', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'google-nest-hub-2nd-gen', category: 'smart-display' }), model.image);
});

test('Nest Hub illustration is camera-free and cannot label Max or Echo Show identities', () => {
  const model = modelIllustrations.find(item => item.slug === 'google-nest-hub-2nd-gen');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /no camera/);
  assert.match(getProductImageSourceLabel(model), /sample screen/);
  assert.equal(getModelIllustration({ slug: 'google-nest-hub-max', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'echo-show-8-3rd-gen', category: 'smart-display' }), model.image);
});

test('HS200 switch artwork does not imply a bulb, dimmer, or full installation kit', () => {
  const model = modelIllustrations.find(item => item.slug === 'tp-link-kasa-smart-light-switch-hs200');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /single paddle and wall plate/);
  assert.match(getProductImageSourceLabel(model), /not a product photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'tp-link-kasa-smart-dimmer-hs220', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'tp-link-kasa-smart-dimmer-hs220', category: 'smart-lighting' }), model.image);
});

test('HS220 dimmer artwork preserves separate brightness controls and excludes HS200 identity', () => {
  const model = modelIllustrations.find(item => item.slug === 'tp-link-kasa-smart-dimmer-hs220');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /two upper brightness buttons/);
  assert.match(getProductImageSourceLabel(model), /not a product photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'tp-link-kasa-smart-light-switch-hs200', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'tp-link-kasa-smart-light-switch-hs200', category: 'smart-lighting' }), model.image);
});

test('Wyze represents one unlit bulb and all lighting models now have distinct artwork', () => {
  const model = modelIllustrations.find(item => item.slug === 'wyze-bulb-color');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /one unlit Wyze Bulb Color A19 bulb/);
  assert.match(getProductImageSourceLabel(model), /one unit, not a photo or full pack/);
  assert.equal(getModelIllustration({ slug: 'wyze-bulb-white', asin: model.asin }), undefined);
  const lighting = Object.entries(catalogIllustrationCategories).filter(([, category]) => category === 'smart-lighting');
  assert.equal(lighting.length, 5);
  const images = lighting.map(([slug, category]) => getModelIllustration({ slug, category })?.image);
  assert.ok(images.every(Boolean));
  assert.equal(new Set(images).size, lighting.length);
});

test('Tapo C120 illustration isolates its round face and spotlights from eufy C120', () => {
  const model = modelIllustrations.find(item => item.slug === 'tapo-c120-security-camera');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /round black face, two lateral spotlights/);
  assert.match(getProductImageSourceLabel(model), /not a product photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'eufy-security-indoor-cam-c120', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'eufy-security-indoor-cam-c120', category: 'security-camera' }), model.image);
});

test('Blink Outdoor 4 depicts one camera without implying a complete working system', () => {
  const model = modelIllustrations.find(item => item.slug === 'blink-outdoor-4');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /offset upper lens/);
  assert.match(getProductImageAlt(model), /required Sync Module, mount and batteries not shown/);
  assert.match(getProductImageSourceLabel(model), /one camera, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'blink-outdoor-2k-plus', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'tapo-c120-security-camera', category: 'security-camera' }), model.image);
});

test('Arlo artwork isolates second-generation identity and discloses uncertain package quantity', () => {
  const model = modelIllustrations.find(item => item.slug === 'arlo-essential-outdoor-camera');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /spotlight below the lens/);
  assert.match(getProductImageAlt(model), /seller pack quantity unverified/);
  assert.match(getProductImageSourceLabel(model), /one camera, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'arlo-essential-3rd-gen', asin: model.asin }), undefined);
  const cameras = Object.entries(catalogIllustrationCategories).filter(([, category]) => category === 'security-camera');
  assert.equal(cameras.length, 4);
  const images = cameras.map(([slug, category]) => getModelIllustration({ slug, category })?.image);
  assert.ok(images.every(Boolean));
  assert.equal(new Set(images).size, cameras.length);
});

test('ecobee Premium illustration labels the room sensor and sample screen without kit claims', () => {
  const model = modelIllustrations.find(item => item.slug === 'ecobee-smart-thermostat-premium');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /one white room SmartSensor and a sample 72 display/);
  assert.match(getProductImageSourceLabel(model), /sample screen, accessories omitted/);
  assert.equal(getModelIllustration({ slug: 'ecobee-smart-thermostat-enhanced', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'amazon-smart-thermostat', category: 'smart-thermostat' }), model.image);
});

test('original Roomba j7+ illustration excludes Combo and distinguishes its Clean Base from Q5+', () => {
  const model = modelIllustrations.find(item => item.slug === 'irobot-roomba-j7-plus');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /flat-top Roomba j7\+ vacuum with a front camera/);
  assert.match(getProductImageAlt(model), /no mop, cables and spare accessories omitted/);
  assert.match(getProductImageSourceLabel(model), /Clean Base illustration/);
  assert.equal(getModelIllustration({ slug: 'irobot-roomba-combo-j7-plus', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'roborock-q5-plus', category: 'robot-vacuum' }), model.image);
});

test('SwitchBot Hub 2 artwork labels example readings and isolates Mini and Hub 3 identities', () => {
  const model = modelIllustrations.find(item => item.slug === 'switchbot-hub-2');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /off-on touch buttons, rear stand and inline cable sensor/);
  assert.match(getProductImageSourceLabel(model), /sample readings/);
  assert.equal(getModelIllustration({ slug: 'switchbot-hub-mini', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ slug: 'switchbot-hub-3', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'aqara-hub-m2', category: 'smart-hub' }), model.image);
});

test('Aeotec V3 illustration excludes Hub 2 and all three hub identities have distinct images', () => {
  const model = modelIllustrations.find(item => item.slug === 'aeotec-smartthings-hub');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /Aeotec GP-AEOHUBV3/);
  assert.match(getProductImageSourceLabel(model), /not a product photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'aeotec-smart-home-hub-2', asin: model.asin }), undefined);
  const hubs = Object.entries(catalogIllustrationCategories).filter(([, category]) => category === 'smart-hub');
  assert.equal(hubs.length, 3);
  const images = hubs.map(([slug, category]) => getModelIllustration({ slug, category })?.image);
  assert.ok(images.every(Boolean));
  assert.equal(new Set(images).size, hubs.length);
});

test('August Wi-Fi illustration distinguishes the interior retrofit from keypad deadbolts', () => {
  const model = modelIllustrations.find(item => item.slug === 'august-wifi-smart-lock');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /circular August Wi-Fi Smart Lock interior retrofit unit/);
  assert.match(getProductImageAlt(model), /seller finish unverified/);
  assert.match(getProductImageSourceLabel(model), /interior unit, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'august-smart-lock-pro', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'schlage-encode-smart-wifi-deadbolt', category: 'smart-lock' }), model.image);
  assert.notEqual(getLocalProductIllustration({ slug: 'yale-assure-lock-2-wifi', category: 'smart-lock' }), model.image);
});

test('Schlage Century artwork excludes Encode Plus and discloses exterior-only representation', () => {
  const model = modelIllustrations.find(item => item.slug === 'schlage-encode-smart-wifi-deadbolt');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /BE489WB CEN 622 exterior/);
  assert.match(getProductImageSourceLabel(model), /exterior only, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'schlage-encode-plus', asin: model.asin }), undefined);
  assert.notEqual(getLocalProductIllustration({ slug: 'august-wifi-smart-lock', category: 'smart-lock' }), model.image);
  assert.notEqual(getLocalProductIllustration({ slug: 'yale-assure-lock-2-wifi', category: 'smart-lock' }), model.image);
});

test('Yale keyed artwork excludes Touch and Plus and all three locks have distinct images', () => {
  const model = modelIllustrations.find(item => item.slug === 'yale-assure-lock-2-wifi');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /YRD420-WF1-619 keyed exterior/);
  assert.match(getProductImageAlt(model), /no fingerprint reader/);
  assert.match(getProductImageSourceLabel(model), /keyed exterior, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'yale-assure-lock-2-touch', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ slug: 'yale-assure-lock-2-plus', asin: model.asin }), undefined);
  const locks = Object.entries(catalogIllustrationCategories).filter(([, category]) => category === 'smart-lock');
  assert.equal(locks.length, 3);
  const images = locks.map(([slug, category]) => getModelIllustration({ slug, category })?.image);
  assert.ok(images.every(Boolean));
  assert.equal(new Set(images).size, locks.length);
});

test('Aqara P1 artwork discloses hub dependency and excludes P2 and presence sensors', () => {
  const model = modelIllustrations.find(item => item.slug === 'aqara-motion-sensor-p1');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /P1 MS-S02 with frosted PIR window and articulated holder/);
  assert.match(getProductImageAlt(model), /required hub and mounting sticker not shown/);
  assert.match(getProductImageSourceLabel(model), /hub not shown/);
  assert.equal(getModelIllustration({ slug: 'aqara-motion-sensor-p2', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ slug: 'aqara-presence-sensor-fp2', asin: model.asin }), undefined);
});

test('Levoit Core 300S artwork excludes humidifier and labels simplified controls', () => {
  const model = modelIllustrations.find(item => item.slug === 'levoit-core-300s-air-purifier');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /perforated lower intake and spiral top outlet/);
  assert.match(getProductImageAlt(model), /cord and internal filter out of view/);
  assert.match(getProductImageSourceLabel(model), /controls simplified/);
  assert.equal(getModelIllustration({ slug: 'levoit-classic-300s-humidifier', asin: model.asin }), undefined);
  assert.equal(getModelIllustration({ slug: 'levoit-core-400s', asin: model.asin }), undefined);
});

test('Meross MSG100 artwork represents a controller only and excludes other families', () => {
  const model = modelIllustrations.find(item => item.slug === 'meross-smart-garage-door-opener');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /MSG100 add-on controller/);
  assert.match(getProductImageAlt(model), /not a product photo or wiring diagram/);
  assert.match(getProductImageAlt(model), /door sensor, power supply and mounting accessories omitted/);
  assert.match(getProductImageSourceLabel(model), /controller only, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'meross-msg200', asin: model.asin }), undefined);
});

test('Blind Tilt artwork excludes curtain robots and completes distinct catalog model artwork', () => {
  const model = modelIllustrations.find(item => item.slug === 'switchbot-blind-tilt');
  assert.equal(getLocalProductIllustration({ asin: model.asin }), model.image);
  assert.match(getProductImageAlt(model), /Blind Tilt actuator with side coupling housing/);
  assert.match(getProductImageAlt(model), /blind wand, solar panel, hub and installation accessories omitted/);
  assert.match(getProductImageSourceLabel(model), /actuator only, not a photo or full kit/);
  assert.equal(getModelIllustration({ slug: 'switchbot-curtain-3', asin: model.asin }), undefined);
  const catalog = Object.entries(catalogIllustrationCategories);
  assert.equal(catalog.length, 28);
  const images = catalog.map(([slug, category]) => getModelIllustration({ slug, category })?.image);
  assert.ok(images.every(Boolean));
  assert.equal(new Set(images).size, catalog.length);
});

test('structured product images retain representative caption and no external source', () => {
  const schema = generateProductSchema({ name: 'Example', category: 'smart-hub', image: 'https://old.example/photo.jpg' });
  assert.equal(schema.image['@type'], 'ImageObject');
  assert.equal(schema.image.url, 'https://flowhome.dev/images/product-art/illustrations-v1/smart-hub.webp');
  assert.match(schema.image.caption, /not a photo of Example/);
});
