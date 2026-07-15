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
