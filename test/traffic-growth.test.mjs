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
