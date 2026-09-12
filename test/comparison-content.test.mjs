import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';
import { comparisonConfigs } from '../src/lib/comparison-content.ts';

test('comparison index and routes consume one shared editorial definition', () => {
  for (const file of ['index.astro', '[...slugs].astro']) {
    const source = fs.readFileSync(new URL(`../src/pages/compare/${file}`, import.meta.url), 'utf8');
    assert.ok(source.includes("from '../../lib/comparison-content'"));
    assert.doesNotMatch(source, /slugs:\s*\[/);
  }
  assert.equal(comparisonConfigs.length, 8);
  assert.equal(new Set(comparisonConfigs.map(({ slugs }) => slugs.join('-vs-'))).size, 8);
  for (const field of ['title', 'description', 'angle', 'guidance']) {
    assert.equal(new Set(comparisonConfigs.map((entry) => entry[field])).size, 8);
    assert.ok(comparisonConfigs.every((entry) => entry[field].trim().length > 30));
  }
});

test('comparison decision links reuse explicit guide relationships, not category guesses', () => {
  const layout = fs.readFileSync(new URL('../src/layouts/CompareLayout.astro', import.meta.url), 'utf8');
  assert.match(layout, /getCollection\('best-of'\)/);
  assert.match(layout, /guide\.data\.comparisonSlug === comparisonSlug/);
  assert.match(layout, /products\.map\(\(product\) => product\.slug\)\.join\('-vs-'\)/);
  assert.match(layout, /decisionGuides\.length > 0/);
  assert.match(layout, /href=\{`\/best\/\$\{guide\.data\.slug\}\/`\}/);
  assert.match(layout, /aria-label="Buying guides for this comparison"/);
  assert.match(layout, /Read the buying guide: \{guide\.data\.title\}/);
  assert.ok(layout.indexOf('Decision guidance:') < layout.indexOf('Buying guides for this comparison'));
  const directory = new URL('../src/content/best-of/', import.meta.url);
  const guides = fs.readdirSync(directory).filter((file) => file.endsWith('.yaml')).map((file) => parse(fs.readFileSync(new URL(file, directory), 'utf8')));
  const related = (slugs) => guides.filter((guide) => guide.comparisonSlug === slugs.join('-vs-'));
  const hubs = ['aqara-hub-m2', 'switchbot-hub-2', 'aeotec-smartthings-hub'];
  assert.deepEqual(related(hubs).map((guide) => guide.slug), ['best-smart-hubs-for-matter-zigbee']);
  assert.deepEqual(related(['unknown-model']), []);
  assert.deepEqual(related(['aqara-hub-m2']), []);
  for (const guide of guides.filter((entry) => entry.comparisonSlug)) {
    const comparison = comparisonConfigs.find((entry) => entry.slugs.join('-vs-') === guide.comparisonSlug);
    assert.ok(comparison, `Guide ${guide.slug} must target an existing comparison`);
    assert.ok(comparison.slugs.every((slug) => guide.productSlugs.includes(slug)));
  }
  assert.ok(comparisonConfigs.some((entry) => related(entry.slugs).length === 0), 'Unrelated comparisons keep no guide navigation');
});

test('hub decisions distinguish documented roles without ranking or certifying a pairing', () => {
  const hubs = comparisonConfigs.find((entry) => entry.slugs[0] === 'aqara-hub-m2');
  assert.match(hubs.angle, /supported Aqara Zigbee accessories/);
  assert.match(hubs.angle, /supported SwitchBot and infrared devices/);
  assert.match(hubs.angle, /Aeotec documents a SmartThings controller/);
  assert.match(hubs.angle, /side by side rather than ranked/);
  assert.match(hubs.angle, /Matter labels do not make them interchangeable/);
  assert.match(hubs.guidance, /desired actions and the receiving app/);
  assert.match(hubs.guidance, /pause the purchase/);
  assert.match(hubs.guidance, /Protocol flags do not certify an accessory pairing/);
  assert.doesNotMatch(`${hubs.angle} ${hubs.guidance}`, /cheapest|best value|works with every|guaranteed|\$\d/i);
  for (const slug of hubs.slugs) {
    const review = fs.readFileSync(new URL(`../src/content/reviews/${slug}-review.md`, import.meta.url), 'utf8');
    assert.match(review, /document-based/i);
    assert.match(review, /bridge|controller/i);
  }
});

test('comparison guidance distinguishes catalog flags and unmeasured advantages', () => {
  const guidance = comparisonConfigs.map((entry) => entry.guidance).join('\n');
  assert.match(guidance, /Catalog platform flags do not certify/);
  assert.match(guidance, /Protocol flags do not certify/);
  assert.match(guidance, /no comfort, savings, interface or price advantage/);
  assert.match(guidance, /sound quality and convenience have not been measured/);
  assert.doesNotMatch(guidance, /choose.*(?:lowest price|highest rating)|best value|guaranteed/i);
});
