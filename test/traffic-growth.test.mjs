import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('syndication canonical is slug-based and URL-safe', () => {
  const source = read('scripts/expansion/syndicate.mjs');
  assert.match(source, /review\.data\.slug/);
  assert.match(source, /encodeURIComponent\(canonicalSlug\(review\)\)/);
  assert.doesNotMatch(source, /canonical:.*replace\(\/\\\.md\$\/\)/);
});

test('RSS includes dated reviews, guides and deals with deterministic ordering', () => {
  const source = read('src/pages/rss.xml.js');
  assert.match(source, /getCollection\('reviews'\)/);
  assert.match(source, /getCollection\('best-of'\)/);
  assert.match(source, /getCollection\('deals'\)/);
  assert.match(source, /pubDate: item\.data\.(pubDate|startDate)/);
  assert.match(source, /sort\(\(a, b\) => b\.pubDate\.valueOf\(\) - a\.pubDate\.valueOf\(\)/);
  assert.doesNotMatch(source, /items:[\s\S]*affiliateUrl/);
});

test('internal-link loops are present in both directions', () => {
  const contracts = {
    'src/layouts/ReviewLayout.astro': ['/product/', '/category/', '/best/'],
    'src/pages/best/[slug].astro': ['/category/', '/review/'],
    'src/pages/category/[slug].astro': ['/best/', '/review/'],
    'src/pages/reviews/index.astro': ['/product/', '/category/', '/best/'],
  };
  for (const [file, links] of Object.entries(contracts)) {
    const source = read(file);
    for (const link of links) assert.match(source, new RegExp(link.replaceAll('/', '\\/')), `${file}: ${link}`);
  }
});

test('curated comparison cluster contains exactly eight valid comparison definitions', () => {
  const source = read('src/pages/compare/[...slugs].astro');
  const expected = [
    'amazon-smart-thermostat-vs-ecobee-smart-thermostat-premium',
    'roborock-q5-plus-vs-irobot-roomba-j7-plus',
    'august-wifi-smart-lock-vs-schlage-encode-smart-wifi-deadbolt-vs-yale-assure-lock-2-wifi',
    'blink-outdoor-4-vs-arlo-essential-outdoor-camera',
    'eufy-security-indoor-cam-c120-vs-tapo-c120-security-camera',
    'echo-dot-5th-gen-vs-echo-show-8-3rd-gen',
    'aqara-hub-m2-vs-switchbot-hub-2-vs-aeotec-smartthings-hub',
    'philips-hue-white-color-starter-kit-vs-govee-rgbic-led-strip-lights-vs-wyze-bulb-color',
  ];
  assert.equal((source.match(/slugs: \[/g) ?? []).length, expected.length);
  for (const slug of expected) assert.match(source, new RegExp(slug.split('-vs-').map((part) => `'${part}'`).join('[\\s\\S]*')));
  assert.match(source, /return comparisonConfigs\s*\.filter\(\(comparison\) => comparison\.slugs\.every/);
});

test('comparison pages have unique SEO guidance and substantive safe content contracts', () => {
  const page = read('src/pages/compare/[...slugs].astro');
  const layout = read('src/layouts/CompareLayout.astro');
  const titles = [...page.matchAll(/title: '([^']+)'/g)].map((match) => match[1]);
  const descriptions = [...page.matchAll(/description: '([^']+)'/g)].map((match) => match[1]);
  const guidance = [...page.matchAll(/guidance: '([^']+)'/g)].map((match) => match[1]);
  assert.equal(new Set(titles).size, 8);
  assert.equal(new Set(descriptions).size, 8);
  assert.equal(new Set(guidance).size, 8);
  assert.match(layout, /Quick decision framework/);
  assert.match(layout, /href=\{`\/product\/\$\{product\.slug\}/);
  assert.match(layout, /href=\{`\/category\/\$\{product\.category\}/);
  assert.match(layout, /href=\{`\/compare\/\$\{comparison\.slugs\.join\('-vs-'\)\}/);
  assert.doesNotMatch(`${page}\n${layout}`, /hands-on|live price|shipping|returns|Canada availability|guaranteed winner|we tested/i);
});

test('comparison data and table semantics stay consistent', () => {
  const page = read('src/pages/compare/[...slugs].astro');
  const table = read('src/components/CompareTable.astro');
  const q5 = read('src/content/products/roborock-q5-plus.yaml');
  const roomba = read('src/content/products/irobot-roomba-j7-plus.yaml');
  assert.match(q5, /^lidarMapping: true$/m);
  assert.match(roomba, /^lidarMapping: true$/m);
  assert.match(page, /Both product profiles mark LiDAR mapping as available/);
  assert.doesNotMatch(page, /Roomba j7\+ profile does not|Roomba j7\+[^\n]*lacks LiDAR/i);
  assert.match(table, /<th scope="row" class="font-bold text-slate-700">\{label\}<\/th>/);
  assert.match(table, /<th scope="row" class="font-bold text-slate-700">Listing link<\/th>/);
});

test('robot vacuum editorial cluster has optional guide fields and exact links', () => {
  const schema = read('src/content.config.ts');
  const guide = read('src/content/best-of/best-robot-vacuums-for-smart-homes.yaml');
  const bestPage = read('src/pages/best/[slug].astro');
  const products = read('src/pages/products/index.astro');
  const q5 = read('src/content/reviews/roborock-q5-plus-review.md');
  const roomba = read('src/content/reviews/irobot-roomba-j7-plus-review.md');
  assert.match(schema, /buyingConsiderations: z\.array/);
  assert.match(schema, /comparisonSlug: z\.string\(\)\.optional\(\)/);
  assert.match(bestPage, /list\.data\.buyingConsiderations/);
  assert.match(bestPage, /list\.data\.comparisonSlug/);
  for (const source of [guide, products, q5, roomba]) {
    assert.match(source, /roborock-q5-plus-vs-irobot-roomba-j7-plus/);
  }
  assert.match(bestPage, /`\/compare\/\$\{list\.data\.comparisonSlug\}\//);
  assert.match(products, /irobot-roomba-j7-plus-review/);
  assert.match(q5, /irobot-roomba-j7-plus-review/);
  assert.match(roomba, /best-robot-vacuums-for-smart-homes/);
  assert.match(roomba, /productSlug: irobot-roomba-j7-plus/);
  assert.match(roomba, /## (Key specifications|Setup and compatibility|Strengths and tradeoffs|FAQ)/g);
  assert.ok(roomba.split(/\s+/).length >= 500, 'Roomba review should remain substantive');
  assert.doesNotMatch(`${guide}\n${q5}\n${roomba}`, /hands-on|live price|shipping|returns|Canada availability|obstacle avoidance/i);
  assert.match(`${guide}\n${roomba}`, /LiDAR mapping/);
  assert.doesNotMatch(`${guide}\n${roomba}`, /Roomba[^\n]*(?:lacks|without) LiDAR/i);
});

test('smart-hub editorial cluster has exact products, reviews, comparison, and honest claims', () => {
  const guide = read('src/content/best-of/best-smart-hubs-for-matter-zigbee.yaml');
  const reviews = [
    read('src/content/reviews/aqara-hub-m2-review.md'),
    read('src/content/reviews/switchbot-hub-2-review.md'),
    read('src/content/reviews/aeotec-smartthings-hub-review.md'),
  ];
  const comparison = read('src/pages/compare/[...slugs].astro');
  const all = `${guide}\n${reviews.join('\n')}`;
  const slugs = ['aqara-hub-m2', 'switchbot-hub-2', 'aeotec-smartthings-hub'];
  const productBlock = guide.match(/productSlugs:\n([\s\S]*?)pubDate:/)?.[1] ?? '';
  assert.deepEqual([...productBlock.matchAll(/^  - ([\w-]+)$/gm)].map((match) => match[1]), slugs);
  assert.match(guide, /comparisonSlug: "aqara-hub-m2-vs-switchbot-hub-2-vs-aeotec-smartthings-hub"/);
  assert.deepEqual(reviews.map((review) => review.match(/^productSlug: ([\w-]+)$/m)?.[1]), slugs);
  assert.match(comparison, /'aqara-hub-m2', 'switchbot-hub-2', 'aeotec-smartthings-hub'/);
  for (const review of reviews) {
    assert.ok(review.split(/\s+/).length >= 350, 'Each smart-hub review should be substantive');
    assert.match(review, /## (Key specifications and features|Strengths and tradeoffs|Comparison context|FAQ)/g);
    assert.match(review, /\/best\/best-smart-hubs-for-matter-zigbee/);
    assert.match(review, /\/compare\/aqara-hub-m2-vs-switchbot-hub-2-vs-aeotec-smartthings-hub/);
    assert.match(review, /As an Amazon Associate/);
  }
  assert.match(guide, /aqara-hub-m2-review[\s\S]*switchbot-hub-2-review[\s\S]*aeotec-smartthings-hub-review/);
  assert.doesNotMatch(all, /hands-on|live price|shipping|returns|we tested|guaranteed winner/i);
});

test('smart-lighting room-control guide has exact editorial links and source-backed claims', () => {
  const guide = read('src/content/best-of/best-smart-lighting-for-room-control.yaml');
  const products = [
    read('src/content/products/philips-hue-white-color-starter-kit.yaml'),
    read('src/content/products/govee-rgbic-led-strip-lights.yaml'),
    read('src/content/products/wyze-bulb-color.yaml'),
  ];
  const review = read('src/content/reviews/philips-hue-white-color-starter-kit-review.md');
  const comparison = read('src/pages/compare/[...slugs].astro');
  const bestPage = read('src/pages/best/[slug].astro');
  const rss = read('src/pages/rss.xml.js');
  const productBlock = guide.match(/productSlugs:\n([\s\S]*?)pubDate:/)?.[1] ?? '';
  assert.deepEqual([...productBlock.matchAll(/^  - ([\w-]+)$/gm)].map((match) => match[1]), [
    'philips-hue-white-color-starter-kit',
    'govee-rgbic-led-strip-lights',
    'wyze-bulb-color',
  ]);
  assert.match(guide, /comparisonSlug: "philips-hue-white-color-starter-kit-vs-govee-rgbic-led-strip-lights-vs-wyze-bulb-color"/);
  assert.deepEqual([...guide.matchAll(/^  - ([\w-]+-review)$/gm)].map((match) => match[1]), ['philips-hue-white-color-starter-kit-review']);
  assert.ok((guide.match(/^  - label:/gm) ?? []).length >= 3, 'Guide should have substantive buying considerations');
  assert.match(guide, /Bulb or strip installation/);
  assert.match(guide, /Wall-switch and always-powered behavior/);
  assert.match(guide, /Ecosystem and app control/);
  assert.match(guide, /Catalog price context/);
  assert.match(guide, /time-sensitive catalog snapshots/);
  assert.match(guide, /wall switches should usually stay on/);
  assert.match(guide, /current listing before buying/);
  assert.match(review, /wall switches should usually stay on/);
  assert.match(comparison, /'philips-hue-white-color-starter-kit', 'govee-rgbic-led-strip-lights', 'wyze-bulb-color'/);
  for (const product of products) {
    assert.match(product, /^category: smart-lighting$/m);
    assert.match(product, /^rgb: true$/m);
    assert.match(product, /^dimmable: true$/m);
  }
  assert.match(bestPage, /canonicalURL={`https:\/\/flowhome\.dev\/best\/\$\{list\.data\.slug\}\//);
  assert.match(bestPage, /`\/category\/\$\{list\.data\.category\}\//);
  assert.match(bestPage, /`\/review\/\$\{review\.id\}\//);
  assert.match(bestPage, /`\/compare\/\$\{list\.data\.comparisonSlug\}\//);
  assert.match(rss, /link: `\/best\/\$\{item\.data\.slug\}\//);
  assert.doesNotMatch(guide, /hands-on|live price|shipping|returns|guaranteed winner|we tested/i);
});
