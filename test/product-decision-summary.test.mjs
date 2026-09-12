import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { getProductDecision } from '../src/lib/product-decision.ts';

const now = new Date('2026-09-12T12:00:00Z');
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, directory), 'utf8')));
const profile = readFileSync(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');

test('all fifteen researched models have exact identity and decision sources already in their reviews', () => {
  const reviewDirectory = new URL('../src/content/reviews/', import.meta.url);
  const reviewedSlugs = readdirSync(reviewDirectory).filter(file => file.endsWith('.md'))
    .map(file => parse(readFileSync(new URL(file, reviewDirectory), 'utf8').split('---')[1]).productSlug);
  const covered = products.filter(product => reviewedSlugs.includes(product.slug) && getProductDecision(product, now));
  assert.equal(covered.length, 15);
  assert.deepEqual(covered.map(product => product.slug).sort(), reviewedSlugs.sort());
  assert.equal(new Set(covered.map(product => product.decisionSummary.useCase)).size, covered.length);
  assert.equal(new Set(covered.map(product => product.decisionSummary.reconsiderIf)).size, covered.length);
  for (const product of covered) {
    const decision = getProductDecision(product, now);
    assert.equal(decision.model, product.model);
    assert.equal(product.dateUpdated, '2026-09-12');
    const commerceDate = ['roborock-q5-plus', 'irobot-roomba-j7-plus'].includes(product.slug) ? '2026-07-18'
      : product.slug === 'switchbot-hub-2' ? '2026-06-29' : '2026-06-28';
    assert.equal(product.priceLastChecked, commerceDate);
    assert.equal(product.ratingLastChecked, commerceDate);
    const review = readFileSync(new URL(`../src/content/reviews/${product.slug}-review.md`, import.meta.url), 'utf8');
    const metadata = parse(review.split('---')[1]);
    assert.ok(metadata.sources.every(source => source.accessedAt <= metadata.updatedDate), `${product.slug}: editorial record cannot predate its recorded sources`);
    for (const source of decision.sources) assert.ok(metadata.sources.some(item => item.url === source.url && item.accessedAt === source.accessedAt), source.url);
    assert.doesNotMatch(decision.useCase + decision.reconsiderIf, /best|cheapest|guaranteed|tested by us|works with all/i);
  }
});

test('buyer-fit text preserves model-specific exclusions and regional evidence limits', () => {
  const decision = (slug) => getProductDecision(products.find(product => product.slug === slug), now);
  assert.match(decision('tp-link-kasa-smart-plug-mini').reconsiderIf, /documents conflict.*runtime is not measured consumption/);
  assert.match(decision('ring-video-doorbell-wired').reconsiderIf, /existing chime.*subscription.*newer Wired 2K/);
  assert.match(decision('eufy-security-indoor-cam-c120').useCase, /US hardware.*European/);
  assert.match(decision('eufy-security-indoor-cam-c120').reconsiderIf, /outdoor-rated.*not.*free cloud/);
  assert.match(decision('aeotec-smartthings-hub').reconsiderIf, /offline support.*Smart Home Hub 2.*V3/);
  assert.match(decision('switchbot-hub-2').reconsiderIf, /Zigbee coordinator.*sensor-equipped cable/);
  assert.match(decision('ecobee-smart-thermostat-premium').reconsiderIf, /does not establish independent HVAC zoning/);
  assert.match(decision('amazon-smart-thermostat').useCase, /HVAC system.*C-wire/);
  assert.match(decision('august-wifi-smart-lock').reconsiderIf, /misaligned door.*keypad.*permission/);
  assert.match(decision('philips-hue-white-color-starter-kit').useCase, /562918.*two.*E26.*both bulbs and the Bridge/);
  for (const slug of ['roborock-q5-plus', 'irobot-roomba-j7-plus']) assert.match(decision(slug).reconsiderIf, /wet floor care.*vacuum-only/);
  assert.equal(products.filter(product => !getProductDecision(product, now)).length, 0);
});

test('five lighting and blind profiles gain distinct documented decisions without fabricated reviews or refreshed commerce', () => {
  const slugs = ['govee-rgbic-led-strip-lights', 'wyze-bulb-color', 'tp-link-kasa-smart-dimmer-hs220', 'tp-link-kasa-smart-light-switch-hs200', 'switchbot-blind-tilt'];
  const reviews = readdirSync(new URL('../src/content/reviews/', import.meta.url));
  const covered = products.filter(product => getProductDecision(product, now));
  assert.equal(covered.length, 28);
  assert.equal(new Set(covered.map(product => product.decisionSummary.useCase)).size, covered.length);
  assert.equal(new Set(covered.map(product => product.decisionSummary.reconsiderIf)).size, covered.length);
  for (const slug of slugs) {
    const product = products.find(product => product.slug === slug);
    const decision = getProductDecision(product, now);
    assert.ok(decision, slug);
    assert.equal(decision.model, product.model);
    assert.equal(product.dateUpdated, '2026-09-12');
    const commerceDate = slug.startsWith('tp-link-kasa-') ? '2026-06-29' : '2026-06-28';
    assert.equal(product.priceLastChecked, commerceDate);
    assert.equal(product.ratingLastChecked, commerceDate);
    assert.ok(!reviews.includes(`${slug}-review.md`));
    assert.ok(product.installation.sources.every(source => source.accessedAt === '2026-09-05' || source.accessedAt === '2026-09-06'));
    for (const source of decision.sources) {
      assert.equal(source.accessedAt, '2026-09-12');
      assert.ok(product.installation.sources.some(item => item.url === source.url), source.url);
    }
    assert.doesNotMatch(decision.useCase + decision.reconsiderIf, /best|cheapest|guaranteed|tested by us|works with all/i);
  }
});

test('lighting decisions distinguish controls, fixture exclusions and additional hardware', () => {
  const decision = slug => getProductDecision(products.find(product => product.slug === slug), now);
  assert.match(decision('govee-rgbic-led-strip-lights').useCase, /10 m H617C.*Bluetooth.*not the Wi-Fi H618C/);
  assert.match(decision('govee-rgbic-led-strip-lights').reconsiderIf, /cut-to-length.*Alexa.*native Matter.*none/);
  assert.match(decision('wyze-bulb-color').useCase, /E26.*WLPA19C.*2.4 GHz/);
  assert.match(decision('wyze-bulb-color').reconsiderIf, /Do not pair.*external dimmer.*fully enclosed.*water.*emergency lighting/);
  assert.match(decision('tp-link-kasa-smart-dimmer-hs220').useCase, /leading-edge \(TRIAC phase-cut\).*neutral wire/);
  assert.match(decision('tp-link-kasa-smart-dimmer-hs220').reconsiderIf, /dimmable is not enough.*electrical installation.*qualified installer/);
  assert.match(decision('tp-link-kasa-smart-light-switch-hs200').useCase, /on\/off.*neutral wire.*not adjusting brightness/);
  assert.match(decision('tp-link-kasa-smart-light-switch-hs200').reconsiderIf, /need dimming.*not a bulb or plug-in adapter.*qualified installer/);
  assert.match(decision('switchbot-blind-tilt').useCase, /horizontal blinds.*6.2-10.2 mm or 12 mm/);
  assert.match(decision('switchbot-blind-tilt').reconsiderIf, /not for vertical blinds or roller shades.*separate compatible hub.*rather than relying.*unlimited solar power/);
});

test('missing or mismatched summaries never become category-derived buyer recommendations', () => {
  for (const product of products) assert.equal(getProductDecision({ ...product, decisionSummary: undefined }, now), null);
  const product = products.find(product => product.decisionSummary);
  for (const model of [undefined, '', 'another generation']) assert.equal(getProductDecision({ ...product, model }, now), null);
  assert.equal(getProductDecision({ model: product.model, category: product.category }, now), null);
});

test('remaining eight profiles use exact-model documentary guidance without inventing reviews or renewing historical observations', () => {
  const slugs = ['aqara-motion-sensor-p1', 'arlo-essential-outdoor-camera', 'echo-show-8-3rd-gen', 'levoit-core-300s-air-purifier', 'meross-smart-garage-door-opener', 'schlage-encode-smart-wifi-deadbolt', 'tapo-c120-security-camera', 'yale-assure-lock-2-wifi'];
  const reviews = readdirSync(new URL('../src/content/reviews/', import.meta.url));
  for (const slug of slugs) {
    const product = products.find(product => product.slug === slug);
    const decision = getProductDecision(product, now);
    assert.ok(decision, slug);
    assert.equal(decision.model, product.model);
    assert.equal(product.dateUpdated, '2026-09-12');
    const commerceDate = ['arlo-essential-outdoor-camera', 'levoit-core-300s-air-purifier', 'meross-smart-garage-door-opener'].includes(slug) ? '2026-06-28' : '2026-06-29';
    assert.equal(product.priceLastChecked, commerceDate);
    assert.equal(product.ratingLastChecked, commerceDate);
    assert.ok(!reviews.includes(`${slug}-review.md`));
    assert.ok(product.installation.sources.every(source => source.accessedAt < '2026-09-12'));
    for (const source of decision.sources) {
      const historicalListing = slug === 'arlo-essential-outdoor-camera' && source.url === 'https://www.amazon.com/dp/B0DVNSQSD7';
      assert.equal(source.accessedAt, historicalListing ? '2026-09-05' : '2026-09-12');
      const originalSources = [...product.installation.sources, ...(product.sources || [])];
      assert.ok(originalSources.some(item => item.url === source.url), source.url);
    }
    assert.doesNotMatch(decision.useCase + decision.reconsiderIf, /best|cheapest|guaranteed|tested by us|works with all/i);
  }
});

test('remaining decisions preserve camera power, lock fit, privacy and evidence boundaries', () => {
  const decision = slug => getProductDecision(products.find(product => product.slug === slug), now);
  assert.match(decision('aqara-motion-sensor-p1').useCase, /Aqara Zigbee 3.0 hub.*MS-S02/);
  assert.match(decision('aqara-motion-sensor-p1').reconsiderIf, /outdoor or damp.*P1, not the P2.*continuous occupancy.*button-battery/);
  assert.match(decision('arlo-essential-outdoor-camera').useCase, /HD version, not a 2K, XL or newer model/);
  assert.match(decision('arlo-essential-outdoor-camera').reconsiderIf, /battery cannot be removed.*indoor use only.*conflicting package quantities/);
  assert.match(decision('echo-show-8-3rd-gen').reconsiderIf, /camera-free.*cloud-free.*not proof of offline operation/);
  assert.match(decision('levoit-core-300s-air-purifier').useCase, /on-device controls.*optional VeSync.*15 inches/);
  assert.match(decision('levoit-core-300s-air-purifier').reconsiderIf, /does not establish whole-home performance, health outcomes/);
  assert.match(decision('meross-smart-garage-door-opener').useCase, /exact-model compatibility.*add-on controller, not a replacement motor/);
  assert.match(decision('meross-smart-garage-door-opener').reconsiderIf, /do not attempt a terminal-bridging test.*cannot establish safe unattended operation/);
  assert.match(decision('schlage-encode-smart-wifi-deadbolt').reconsiderIf, /retain the existing exterior lock.*not Encode Plus.*mechanical fit/);
  assert.match(decision('tapo-c120-security-camera').reconsiderIf, /not a battery-powered camera.*adapter.*indoors.*does not establish free cloud storage/);
  assert.match(decision('yale-assure-lock-2-wifi').useCase, /YRD420-WF1-619/);
  assert.match(decision('yale-assure-lock-2-wifi').reconsiderIf, /not Touch, Plus or key-free.*requires drilling.*does not verify.*satin-nickel/);
});

test('malformed sources, future dates, incomplete text and unsupported markets fail closed', () => {
  const product = products.find(product => product.decisionSummary);
  const valid = product.decisionSummary;
  const source = valid.sources[0];
  const variants = [null, {}, 'summary', { ...valid, market: 'CA' }, { ...valid, useCase: '' }, { ...valid, reconsiderIf: ' ' }, { ...valid, sources: [] }, ...[
    { ...source, label: '' }, { ...source, url: 'javascript:alert(1)' }, { ...source, url: 'https://user:password@example.com' },
    { ...source, accessedAt: '2026-02-30' }, { ...source, accessedAt: '2099-01-01' }, { ...source, accessedAt: '' },
  ].map(source => ({ ...valid, sources: [source] }))];
  for (const decisionSummary of variants) assert.equal(getProductDecision({ ...product, decisionSummary }, now), null);
  assert.equal(getProductDecision(product, new Date('invalid')), null);
});

test('buying context has honest fallback, adjacent sources and accessible next steps', () => {
  const section = profile.match(/<section id="buying-context"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  assert.match(profile, /const decision = getProductDecision\(data\)/);
  assert.match(section, /decision\.useCase/);
  assert.match(section, /decision\.reconsiderIf/);
  assert.match(section, /decision\.sources\.map/);
  assert.match(section, /model-specific buyer-fit summary is not yet available/);
  assert.match(section, /not hands-on testing/);
  assert.match(section, /href="#installation-checks"/);
  assert.match(section, /href="#product-reading-title"/);
  assert.match(section, /min-h-11/);
  assert.match(section, /focus-visible:outline-2/);
  assert.doesNotMatch(profile, /<h2>Pros and cons<\/h2>|<h2>Who should buy it\?<\/h2>|Useful checks/);
});
