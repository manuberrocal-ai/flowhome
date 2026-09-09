// Editorial illustration policy: external/stored URLs are not image permissions.
// Catalog identity mappings are checked against YAML by product-image-labels.test.mjs.
export const illustrationCategories = Object.freeze([
  "smart-speaker",
  "smart-thermostat",
  "security-camera",
  "video-doorbell",
  "smart-lock",
  "robot-vacuum",
  "smart-lighting",
  "smart-plug",
  "smart-display",
  "smart-hub",
  "motion-sensor",
  "air-purifier",
  "garage-door-opener",
  "smart-blinds",
  "smart-home-device"
]);
export const catalogIllustrationCategories = Object.freeze({
  "aeotec-smartthings-hub": "smart-hub",
  "amazon-smart-thermostat": "smart-thermostat",
  "aqara-hub-m2": "smart-hub",
  "aqara-motion-sensor-p1": "motion-sensor",
  "arlo-essential-outdoor-camera": "security-camera",
  "august-wifi-smart-lock": "smart-lock",
  "blink-outdoor-4": "security-camera",
  "echo-dot-5th-gen": "smart-speaker",
  "echo-show-8-3rd-gen": "smart-display",
  "ecobee-smart-thermostat-premium": "smart-thermostat",
  "eufy-security-indoor-cam-c120": "security-camera",
  "google-nest-hub-2nd-gen": "smart-display",
  "govee-rgbic-led-strip-lights": "smart-lighting",
  "irobot-roomba-j7-plus": "robot-vacuum",
  "levoit-core-300s-air-purifier": "air-purifier",
  "meross-smart-garage-door-opener": "garage-door-opener",
  "philips-hue-white-color-starter-kit": "smart-lighting",
  "ring-video-doorbell-wired": "video-doorbell",
  "roborock-q5-plus": "robot-vacuum",
  "schlage-encode-smart-wifi-deadbolt": "smart-lock",
  "switchbot-blind-tilt": "smart-blinds",
  "switchbot-hub-2": "smart-hub",
  "tapo-c120-security-camera": "security-camera",
  "tp-link-kasa-smart-dimmer-hs220": "smart-lighting",
  "tp-link-kasa-smart-light-switch-hs200": "smart-lighting",
  "tp-link-kasa-smart-plug-mini": "smart-plug",
  "wyze-bulb-color": "smart-lighting",
  "yale-assure-lock-2-wifi": "smart-lock"
});
const asinCategories = Object.freeze({
  "B08TWDNQ5Q": "smart-hub",
  "B08J4C8871": "smart-thermostat",
  "B08Y1PJZZH": "smart-hub",
  "B09QKVMMTB": "motion-sensor",
  "B0DVNSQSD7": "security-camera",
  "B082VXK9CK": "smart-lock",
  "B0B1N5HW22": "security-camera",
  "B09B8V1LZ3": "smart-speaker",
  "B0BLS3Y632": "smart-display",
  "B09XXTQP3B": "smart-thermostat",
  "B08571VZ3Q": "security-camera",
  "B08R8N3Q7C": "smart-display",
  "B099S9DXT7": "smart-lighting",
  "B094NYHTMF": "robot-vacuum",
  "B09BJMY8HL": "air-purifier",
  "B084Z5QZR2": "garage-door-opener",
  "B096YFWVVS": "smart-lighting",
  "B08CKHPP52": "video-doorbell",
  "B09NM56KJM": "robot-vacuum",
  "B07HXMLCBT": "smart-lock",
  "B0B4D95FZW": "smart-blinds",
  "B0BM8VS13P": "smart-hub",
  "B0CH45HPZT": "security-camera",
  "B079775ZZQ": "smart-lighting",
  "B01EZV35QU": "smart-lighting",
  "B091FXQQMQ": "smart-plug",
  "B08WZN4JW2": "smart-lighting",
  "B0CPLS7F28": "smart-lock"
});
const directory = '/images/product-art/illustrations-v1/';
// Original editorial artwork, visually checked against the manufacturer's reference.
// This identifies the illustrated model, not an official photo or ASIN bundle certification.
export const modelIllustrations = Object.freeze([
  Object.freeze({
    slug: 'switchbot-blind-tilt', asin: 'B0B4D95FZW', category: 'smart-blinds',
    image: '/images/product-art/models-v1/switchbot-blind-tilt.webp',
    caption: 'SwitchBot Blind Tilt illustration — actuator only, not a photo or full kit',
    alt: 'Illustration of the slim white SwitchBot Blind Tilt actuator with side coupling housing; not a product photo, blind wand, solar panel, hub and installation accessories omitted',
  }),
  Object.freeze({
    slug: 'meross-smart-garage-door-opener', asin: 'B084Z5QZR2', category: 'garage-door-opener',
    image: '/images/product-art/models-v1/meross-msg100.webp',
    caption: 'Meross MSG100 illustration — controller only, not a photo or full kit',
    alt: 'Illustration of the white tapered Meross MSG100 add-on controller with paired signal wire; not a product photo or wiring diagram, markings simplified, door sensor, power supply and mounting accessories omitted',
  }),
  Object.freeze({
    slug: 'levoit-core-300s-air-purifier', asin: 'B09BJMY8HL', category: 'air-purifier',
    image: '/images/product-art/models-v1/levoit-core-300s.webp',
    caption: 'Levoit Core 300S illustration — not a photo; controls simplified',
    alt: 'Illustration of the white cylindrical Levoit Core 300S with perforated lower intake and spiral top outlet; not a product photo, controls simplified, cord and internal filter out of view',
  }),
  Object.freeze({
    slug: 'aqara-motion-sensor-p1', asin: 'B09QKVMMTB', category: 'motion-sensor',
    image: '/images/product-art/models-v1/aqara-motion-p1.webp',
    caption: 'Aqara P1 and holder illustration — not a photo; hub not shown',
    alt: 'Illustration of the white cylindrical Aqara Motion Sensor P1 MS-S02 with frosted PIR window and articulated holder; not a product photo, required hub and mounting sticker not shown',
  }),
  Object.freeze({
    slug: 'yale-assure-lock-2-wifi', asin: 'B0CPLS7F28', category: 'smart-lock',
    image: '/images/product-art/models-v1/yale-assure-lock-2-keyed.webp',
    caption: 'Yale Assure Lock 2 illustration — keyed exterior, not a photo or full kit',
    alt: 'Illustration of the satin-nickel Yale Assure Lock 2 YRD420-WF1-619 keyed exterior with circular touchscreen digits; not a product photo, no fingerprint reader, interior unit, DoorSense and installation accessories omitted',
  }),
  Object.freeze({
    slug: 'schlage-encode-smart-wifi-deadbolt', asin: 'B07HXMLCBT', category: 'smart-lock',
    image: '/images/product-art/models-v1/schlage-encode-century.webp',
    caption: 'Schlage Encode Century illustration — exterior only, not a photo or full kit',
    alt: 'Illustration of the matte-black Schlage Encode BE489WB CEN 622 exterior with rectangular keypad and mechanical key cylinder; not a product photo, interior unit, bolt, batteries and installation hardware omitted',
  }),
  Object.freeze({
    slug: 'august-wifi-smart-lock', asin: 'B082VXK9CK', category: 'smart-lock',
    image: '/images/product-art/models-v1/august-wifi-smart-lock.webp',
    caption: 'August Wi-Fi lock illustration — interior unit, not a photo or full kit',
    alt: 'Illustration of one silver circular August Wi-Fi Smart Lock interior retrofit unit with a fluted grip; not a product photo, seller finish unverified, DoorSense, batteries and mounting hardware omitted',
  }),
  Object.freeze({
    slug: 'aeotec-smartthings-hub', asin: 'B08TWDNQ5Q', category: 'smart-hub',
    image: '/images/product-art/models-v1/aeotec-v3.webp',
    caption: 'Aeotec V3 hub illustration — not a product photo or full kit',
    alt: 'Illustration of the white low-profile rounded-square Aeotec GP-AEOHUBV3 Smart Home Hub; not a product photo, rear ports out of view and cables and power adapter omitted',
  }),
  Object.freeze({
    slug: 'switchbot-hub-2', asin: 'B0BM8VS13P', category: 'smart-hub',
    image: '/images/product-art/models-v1/switchbot-hub-2.webp',
    caption: 'SwitchBot Hub 2 illustration — not a photo; sample readings',
    alt: 'Illustration of the white SwitchBot Hub 2 with off-on touch buttons, rear stand and inline cable sensor; not a product photo, readings are illustrative and power adapter is omitted',
  }),
  Object.freeze({
    slug: 'irobot-roomba-j7-plus', asin: 'B094NYHTMF', category: 'robot-vacuum',
    image: '/images/product-art/models-v1/roomba-j7-plus.webp',
    caption: 'Roomba j7+ and Clean Base illustration — not a product photo',
    alt: 'Illustration of the original flat-top Roomba j7+ vacuum with a front camera and black Clean Base; not a product photo, no mop, cables and spare accessories omitted',
  }),
  Object.freeze({
    slug: 'ecobee-smart-thermostat-premium', asin: 'B09XXTQP3B', category: 'smart-thermostat',
    image: '/images/product-art/models-v1/ecobee-premium.webp',
    caption: 'ecobee Premium illustration — not a photo; sample screen, accessories omitted',
    alt: 'Illustration of the black ecobee Smart Thermostat Premium with one white room SmartSensor and a sample 72 display; not a product photo or complete installation kit',
  }),
  Object.freeze({
    slug: 'arlo-essential-outdoor-camera', asin: 'B0DVNSQSD7', category: 'security-camera',
    image: '/images/product-art/models-v1/arlo-essential-2nd-gen.webp',
    caption: 'Arlo Essential 2nd Gen illustration — one camera, not a photo or full kit',
    alt: 'Illustration of one white Arlo Essential Outdoor second-generation camera with a black oblong face and spotlight below the lens; not a product photo, mount and charging accessories omitted, seller pack quantity unverified',
  }),
  Object.freeze({
    slug: 'blink-outdoor-4', asin: 'B0B1N5HW22', category: 'security-camera',
    image: '/images/product-art/models-v1/blink-outdoor-4.webp',
    caption: 'Blink Outdoor 4 illustration — one camera, not a photo or full kit',
    alt: 'Illustration of one black rounded-square Blink Outdoor 4 with an offset upper lens; not a product photo, required Sync Module, mount and batteries not shown',
  }),
  Object.freeze({
    slug: 'tapo-c120-security-camera', asin: 'B0CH45HPZT', category: 'security-camera',
    image: '/images/product-art/models-v1/tapo-c120.webp',
    caption: 'Tapo C120 illustration — not a product photo or full kit',
    alt: 'Illustration of the white Tapo C120 with a round black face, two lateral spotlights and a round magnetic base; not a product photo, power adapter and installation accessories omitted',
  }),
  Object.freeze({
    slug: 'wyze-bulb-color', asin: 'B08WZN4JW2', category: 'smart-lighting',
    image: '/images/product-art/models-v1/wyze-bulb-color.webp',
    caption: 'Wyze Bulb Color illustration — one unit, not a photo or full pack',
    alt: 'Illustration of one unlit Wyze Bulb Color A19 bulb with a white diffuser and E26 screw base; not a product photo or the complete seller multipack',
  }),
  Object.freeze({
    slug: 'tp-link-kasa-smart-dimmer-hs220', asin: 'B079775ZZQ', category: 'smart-lighting',
    image: '/images/product-art/models-v1/kasa-hs220.webp',
    caption: 'Kasa HS220 illustration — not a product photo or full kit',
    alt: 'Illustration of one white Kasa HS220 dimmer with two upper brightness buttons, a main paddle and wall plate; not a product photo, wiring and installation accessories omitted',
  }),
  Object.freeze({
    slug: 'tp-link-kasa-smart-light-switch-hs200', asin: 'B01EZV35QU', category: 'smart-lighting',
    image: '/images/product-art/models-v1/kasa-hs200.webp',
    caption: 'Kasa HS200 illustration — not a product photo or full kit',
    alt: 'Illustration of one white Kasa HS200 on-off light switch with a single paddle and wall plate; not a product photo, wiring and installation accessories omitted',
  }),
  Object.freeze({
    slug: 'google-nest-hub-2nd-gen', asin: 'B08R8N3Q7C', category: 'smart-display',
    image: '/images/product-art/models-v1/nest-hub-2nd-gen.webp',
    caption: 'Nest Hub 2nd Gen illustration — not a photo; sample screen',
    alt: 'Illustration of the white Nest Hub second-generation family with a low fabric speaker base and no camera; not a product photo, screen artwork is illustrative and accessories are omitted',
  }),
  Object.freeze({
    slug: 'echo-show-8-3rd-gen', asin: 'B0BLS3Y632', category: 'smart-display',
    image: '/images/product-art/models-v1/echo-show-8-3rd-gen.webp',
    caption: 'Echo Show 8 3rd Gen illustration — not a photo; sample screen',
    alt: 'Illustration of the white Echo Show 8 third-generation family with a centered camera and rounded rear speaker; not a product photo, screen artwork is illustrative and accessories are omitted',
  }),
  Object.freeze({
    slug: 'eufy-security-indoor-cam-c120', asin: 'B08571VZ3Q', category: 'security-camera',
    image: '/images/product-art/models-v1/eufy-c120.webp',
    caption: 'eufy Indoor Cam C120 illustration — not a product photo',
    alt: 'Illustration of the fixed eufy Indoor Cam C120 family with a black rounded-square camera face and white pedestal; not a product photo, cables and accessories omitted',
  }),
  Object.freeze({
    slug: 'roborock-q5-plus', asin: 'B09NM56KJM', category: 'robot-vacuum',
    image: '/images/product-art/models-v1/roborock-q5-plus.webp',
    caption: 'Roborock Q5+ and dock illustration — not a product photo',
    alt: 'Illustration of the black Roborock Q5+ LiDAR robot vacuum with Auto-Empty Dock Pure; not a product photo, cables and spare accessories omitted',
  }),
  Object.freeze({
    slug: 'aqara-hub-m2', asin: 'B08Y1PJZZH', category: 'smart-hub',
    image: '/images/product-art/models-v1/aqara-m2.webp',
    caption: 'Aqara Hub M2 illustration — not a product photo',
    alt: 'Illustration of the low black circular Aqara Hub M2 with a front button and small blue indicator; not a product photo, cables and accessories omitted',
  }),
  Object.freeze({
    slug: 'philips-hue-white-color-starter-kit', asin: 'B096YFWVVS', category: 'smart-lighting',
    image: '/images/product-art/models-v1/hue-562918.webp',
    caption: 'Hue 562918 device illustration — not a photo; accessories omitted',
    alt: 'Illustration of two E26 color bulbs and a white square Hue Bridge from kit 562918; illustrative colors, not a product photo, cables and accessories omitted',
  }),
  Object.freeze({
    slug: 'amazon-smart-thermostat', asin: 'B08J4C8871', category: 'smart-thermostat',
    image: '/images/product-art/models-v1/amazon-smart-thermostat.webp',
    caption: 'Amazon Smart Thermostat illustration — not a product photo',
    alt: 'Illustration of the white rounded-square Amazon Smart Thermostat with a sample 68 display and three lower controls; not a product photo or installation kit',
  }),
  Object.freeze({
    slug: 'tp-link-kasa-smart-plug-mini', asin: 'B091FXQQMQ', category: 'smart-plug',
    image: '/images/product-art/models-v1/kasa-ep10.webp',
    caption: 'Kasa EP10 illustration — one unit, not a product photo',
    alt: 'Illustration of one white rectangular Kasa EP10 US smart plug with a grounded front outlet and side button; not a product photo or the complete EP10P2 two-pack',
  }),
  Object.freeze({
    slug: 'ring-video-doorbell-wired', asin: 'B08CKHPP52', category: 'video-doorbell',
    image: '/images/product-art/models-v1/ring-video-doorbell-wired.webp',
    caption: 'Ring Video Doorbell Wired illustration — not a product photo',
    alt: 'Illustration of the original black Ring Video Doorbell Wired with an upper camera and blue-ringed round button; not a product photo or full installation kit',
  }),
  Object.freeze({
    slug: 'govee-rgbic-led-strip-lights', asin: 'B099S9DXT7', category: 'smart-lighting',
    image: '/images/product-art/models-v1/govee-h617c.webp',
    caption: 'Govee H617C strip illustration — not a product photo or full kit',
    alt: 'Illustration of a coiled section of the Govee H617C white RGBIC LED strip with separate colored LEDs; not a product photo or full kit',
  }),
  Object.freeze({
    slug: 'echo-dot-5th-gen', asin: 'B09B8V1LZ3', category: 'smart-speaker',
    image: '/images/product-art/models-v1/echo-dot-5th-gen.webp',
    caption: 'Echo Dot 5th Gen illustration — not a product photo',
    alt: 'Illustration of the spherical Echo Dot 5th Gen without clock, in charcoal, with a blue light ring at the base; not a product photo',
  }),
]);
export function getModelIllustration(product = {}) {
  return modelIllustrations.find(item =>
    (product.slug === item.slug || product.asin === item.asin)
    && (!product.slug || product.slug === item.slug)
    && (!product.asin || product.asin === item.asin)
    && (!product.category || product.category === item.category));
}
export function getIllustrationCaption(product = {}) {
  return getModelIllustration(product)?.caption ?? illustrationCaption;
}
export function getIllustrationAlt(product = {}) {
  return getModelIllustration(product)?.alt ?? illustrationAlt;
}
export function getArtworkCaption(image) {
  return modelIllustrations.find(item => item.image === image)?.caption ?? illustrationCaption;
}
export const illustrationCaption = 'Category illustration — not a product photo';
export const illustrationAlt = 'Representative category illustration; not a product photo';
export function getCategoryIllustration(category) {
  return directory + (illustrationCategories.includes(category) ? category : 'smart-home-device') + '.webp';
}
export function getLocalProductIllustration(product = {}) {
  const model = getModelIllustration(product);
  if (model) return model.image;
  const slugCategory = Object.hasOwn(catalogIllustrationCategories, product.slug ?? '') ? catalogIllustrationCategories[product.slug] : undefined;
  const asinCategory = Object.hasOwn(asinCategories, product.asin ?? '') ? asinCategories[product.asin] : undefined;
  if (slugCategory || asinCategory || illustrationCategories.includes(product.category)) return getCategoryIllustration(slugCategory || asinCategory || product.category);
  // Only exact shipped artwork paths may be reused; reject query, traversal and remote URLs.
  const shippedCategory = illustrationCategories.find(category => product.image === getCategoryIllustration(category) || product.image === directory + category + '.png');
  if (shippedCategory) return getCategoryIllustration(shippedCategory);
  return getCategoryIllustration();
}
