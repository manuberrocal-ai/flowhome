import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const profile = await readFile(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');

test('guide shortcuts precede the product grid and target existing conditional sections', async () => {
  const guide = await readFile(new URL('../src/pages/best/[slug].astro', import.meta.url), 'utf8');
  assert.ok(guide.indexOf('data-guide-decision-shortcuts') < guide.indexOf('selected.map((product) => <ProductCard'));
  assert.match(guide, /\(list\.data\.buyingConsiderations\?\.length \?\? 0\) > 0 && <a href="#buying-considerations"/);
  assert.match(guide, /id="buying-considerations" class="scroll-mt-24/);
  assert.match(guide, /list\.data\.comparisonSlug && <a href=\{`\/compare\/\$\{list\.data\.comparisonSlug\}\/`\}/);
});

test('product reading links use exact editorial membership, not category or inferred compatibility', () => {
  assert.match(profile, /review\.data\.productSlug === data\.slug/);
  assert.match(profile, /guide\.data\.productSlugs\.includes\(data\.slug\)/);
  assert.match(profile, /productReviews\.length > 0 \|\| productGuides\.length > 0/);
});

test('product reading links match generated routes and remain keyboard accessible', async () => {
  assert.match(profile, /href=\{`\/review\/\$\{review\.id\}\/`\}/);
  assert.match(profile, /href=\{`\/best\/\$\{guide\.data\.slug\}\/`\}/);
  assert.match(profile, /<nav aria-labelledby="product-reading-title"/);
  assert.match(profile, /not a compatibility guarantee or a hands-on test/);
  const section = profile.match(/<nav aria-labelledby="product-reading-title"[\s\S]*?<\/nav>/)?.[0];
  assert.equal((section.match(/min-h-11/g) ?? []).length, 2);
  assert.equal((section.match(/focus-visible:outline-2/g) ?? []).length, 2);
  const reviewRoute = await readFile(new URL('../src/pages/review/[slug].astro', import.meta.url), 'utf8');
  assert.match(reviewRoute, /params: \{ slug: review\.id \}/);
});
