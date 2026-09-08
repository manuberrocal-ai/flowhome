import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const reviewFiles = readdirSync(new URL('src/content/reviews/', root)).filter((name) => /\.mdx?$/.test(name));
const guideFiles = readdirSync(new URL('src/content/best-of/', root)).filter((name) => /\.ya?ml$/.test(name));
function reviewRecord(file) {
  const [, metadata, body] = read(`src/content/reviews/${file}`).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return { file, data: parse(metadata), body };
}
const reviews = reviewFiles.map(reviewRecord);
const guides = guideFiles.map((file) => ({ file, data: parse(read(`src/content/best-of/${file}`)) }));
const patterns = {
  embeddedPrice: /(?:[$€£]\s*\d|\b(?:USD|EUR|GBP)\s*\d|\b\d+(?:\.\d+)?\s*(?:dollars|euros|pounds)\b)/i,
  embeddedRating: /\b\d(?:\.\d+)?\s*(?:[-– ]star\b|out of\s*5\b|\/\s*5\b)/i,
  embeddedRatingCount: /\b\d[\d,.]*\s*(?:customer\s+|owner\s+)?(?:ratings|reviews)\b/i,
  embeddedDiscount: /\b\d+(?:\.\d+)?\s*%\s*(?:off|discount|saving)/i,
  staleDealAdvice: /near or below the deal snapshot|strong customer adoption|better hardware, better interface/i,
};
function unsupportedCommercialCopy(text) {
  return Object.entries(patterns).filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}
const prose = ({ data, body = '' }) => [data.title, data.description, data.intro, ...(data.buyingConsiderations ?? []).flatMap((item) => [item.label, item.detail]), body].filter(Boolean).join('\n');

test('commercial-prose guard detects prices, ratings, counts, discount claims and stale advice', () => {
  for (const sample of ['$79.99', 'USD 42.99', '42 dollars', '4.2-star owner rating', '4.3 out of 5', '4.4/5', '22,000 ratings', '78000 customer reviews', '14% discount', 'Buy near or below the deal snapshot']) {
    assert.ok(unsupportedCommercialCopy(sample).length, sample);
  }
  assert.deepEqual(unsupportedCommercialCopy('Q5+ uses LiDAR; verify a 24V thermostat and a seven-inch screen.'), []);
});

test('all review and buying-guide prose keeps commercial numbers in the governed data layer', () => {
  for (const record of [...reviews, ...guides]) assert.deepEqual(unsupportedCommercialCopy(prose(record)), [], record.file);
});

test('reviewed content records sources and access dates without fabricating human review metadata', () => {
  assert.equal(reviews.length, 15);
  assert.equal(guides.length, 8);
  for (const { file, data } of [...reviews, ...guides]) {
    assert.ok(data.sources?.length, `${file}: missing source record`);
    assert.equal(data.reviewedBy, undefined, file);
    assert.equal(data.humanReviewedDate, undefined, file);
    for (const source of data.sources) {
      assert.equal(new URL(source.url).protocol, 'https:', file);
      assert.ok(source.label.length > 10, file);
      assert.match(source.accessedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(Date.parse(source.accessedAt) <= Date.now(), file);
    }
  }
});

test('hubs distinguish documented Matter bridges from controllers and remove the M2 false negative', () => {
  const product = parse(read('src/content/products/aqara-hub-m2.yaml'));
  assert.equal(product.matter, true);
  assert.match(product.compatibilityNotes.join(' '), /bridges supported Zigbee/);
  assert.match(product.compatibilityNotes.join(' '), /firmware/);
  assert.ok(product.sources.some((source) => source.url.includes('aqara-hub-m2-matter-update')));
  const aqara = prose(reviews.find(({ data }) => data.productSlug === 'aqara-hub-m2'));
  const switchbot = prose(reviews.find(({ data }) => data.productSlug === 'switchbot-hub-2'));
  const aeotec = prose(reviews.find(({ data }) => data.productSlug === 'aeotec-smartthings-hub'));
  assert.match(aqara, /Matter bridging|Matter bridge/);
  assert.match(aqara, /firmware/);
  assert.doesNotMatch(aqara, /Matter as false|does not list Matter support|profile lists Matter as false/);
  assert.match(switchbot, /Matter bridge/);
  assert.match(switchbot, /receiving platform/);
  assert.match(aeotec, /SmartThings controller/);
  assert.match(aeotec, /exact hardware generation/);
});

test('product model, recording and physical-evaluation limits remain explicit', () => {
  const bySlug = (slug) => prose(reviews.find(({ data }) => data.productSlug === slug));
  assert.match(bySlug('tp-link-kasa-smart-plug-mini'), /EP10P2 two-pack/);
  assert.match(bySlug('tp-link-kasa-smart-plug-mini'), /Hardware revision, generation and installed firmware remain unverified/);
  assert.match(bySlug('ring-video-doorbell-wired'), /newer Wired Doorbell 2K/);
  assert.match(bySlug('ring-video-doorbell-wired'), /existing doorbell chime/);
  assert.match(bySlug('eufy-security-indoor-cam-c120'), /1080p in HomeKit/);
  for (const record of reviews) assert.match(record.body, /not an? physical|not an? .*test|not an? .*evaluation|not an? physical installation/i, record.file);
});

test('claim ledger covers all audited articles and catalog records and states evidence limits', () => {
  const ledger = read('docs/content/claim-ledger-v3.md');
  for (const file of [...reviewFiles, ...guideFiles, ...readdirSync(new URL('src/content/products/', root)).filter((name) => name.endsWith('.yaml'))]) assert.ok(ledger.includes(file), file);
  assert.match(ledger, /NO LISTO PARA PUBLICAR/);
  assert.match(ledger, /28\/28/);
  assert.match(ledger, /ASIN/);
});

test('Q5 advice does not promote mapping into universal compatibility or obstacle performance', () => {
  const q5 = reviews.find(({ data }) => data.productSlug === 'roborock-q5-plus');
  assert.doesNotMatch(q5.body, /broad smart-home compatibility|better fit the kinds of objects|supervise the routine enough/i);
  assert.match(q5.body, /supervise the entire first cleaning route/);
  assert.match(q5.body, /not proof of better obstacle handling/);
  assert.match(q5.body, /#identity-evidence/);
  assert.match(q5.body, /#installation-checks/);
  assert.ok(q5.data.sources.some(({ url }) => url.endsWith('/5983654392089')));
});

test('review purchase guidance distinguishes manufacturer evidence from the current seller offer', () => {
  const layout = read('src/layouts/ReviewLayout.astro');
  assert.match(layout, /Confirm the exact model, included package, price, and availability/);
  assert.match(layout, /current seller offer is not verified by this review/);
  assert.match(layout, /#identity-evidence/);
  assert.match(layout, /model-specific manufacturer documentation for compatibility and installation/);
});

test('hub buying guidance keeps distinct installation and identity limitations', () => {
  const bySlug = slug => reviews.find(({ data }) => data.productSlug === slug);
  for (const slug of ['aqara-hub-m2', 'switchbot-hub-2', 'aeotec-smartthings-hub']) {
    const record = bySlug(slug);
    assert.match(record.body, /#identity-evidence/);
    assert.match(record.body, /#installation-checks/);
    assert.ok(record.data.sources.some(({ accessedAt }) => accessedAt === '2026-09-05'));
    assert.doesNotMatch(record.body, /##[^\n]+\r?\n\s*##/, 'no empty section');
  }
  assert.match(bySlug('aqara-hub-m2').body, /adapter, purchased separately/);
  assert.match(bySlug('switchbot-hub-2').body, /ordinary replacement cable is not equivalent/);
  assert.match(bySlug('aeotec-smartthings-hub').body, /GP-AEOHUBV3US, not Smart Home Hub 2/);
  const guide = prose(guides.find(({ data }) => data.slug === 'best-smart-hubs-for-matter-zigbee'));
  assert.match(guide, /sensor-equipped USB-C cable/);
  assert.match(guide, /separately purchased power adapter/);
  assert.match(guide, /do not independently match their catalog Amazon ASINs/);
});

test('thermostat and access-monitoring advice avoids unmeasured superiority and exposes buying checks', () => {
  const slugs = ['amazon-smart-thermostat', 'ecobee-smart-thermostat-premium', 'august-wifi-smart-lock', 'blink-outdoor-4', 'eufy-security-indoor-cam-c120', 'ring-video-doorbell-wired'];
  for (const slug of slugs) {
    const record = reviews.find(({ data }) => data.productSlug === slug);
    assert.match(record.body, /#identity-evidence/, slug);
    assert.match(record.body, /#installation-checks/, slug);
    assert.doesNotMatch(prose(record), /higher-end thermostat experience|most familiar Google-first|broad ecosystem support|Eufy can be easier to start|works best as a flexible perimeter|are the practical wins/, slug);
  }
  const ecobee = reviews.find(({ data }) => data.productSlug === 'ecobee-smart-thermostat-premium');
  assert.match(ecobee.data.title, /Room Sensors and HVAC Checks/);
  assert.match(ecobee.body, /does not establish a superior interface/);
});

test('remaining device reviews use specific needs and model checks instead of generic value promises', () => {
  for (const slug of ['echo-dot-5th-gen', 'google-nest-hub-2nd-gen', 'philips-hue-white-color-starter-kit', 'tp-link-kasa-smart-plug-mini']) {
    const record = reviews.find(({ data }) => data.productSlug === slug);
    assert.match(record.body, /#identity-evidence/, slug);
    assert.match(record.body, /#installation-checks/, slug);
    assert.doesNotMatch(record.data.title, /Smart Home Value/, slug);
    assert.doesNotMatch(record.body, /setup should feel natural|privacy matters more than|A lamp usually works well/, slug);
  }
});

test('Google shortlist excludes H617C while renters and lighting guides preserve exact identity limits', () => {
  const google = guides.find(({ data }) => data.slug === 'best-google-home-starter-devices').data;
  assert.ok(!google.productSlugs.includes('govee-rgbic-led-strip-lights'));
  assert.match(prose({ data: google }), /No Google Home integration is established/);
  const renters = guides.find(({ data }) => data.slug === 'best-smart-home-devices-for-renters');
  assert.match(prose(renters), /EP10P2 two-pack/);
  assert.match(prose(renters), /not cuttable/);
  const lighting = guides.find(({ data }) => data.slug === 'best-smart-lighting-for-room-control').data;
  assert.ok(lighting.sources.some(({ url }) => url.endsWith('/046677562915')));
});
