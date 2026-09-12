import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('profile metadata describes the documentary page without promising a tested review or an on-page price', () => {
  const profile = read('../src/layouts/ProductLayout.astro');
  assert.ok(profile.includes('title={`${product.name} - Specs & Setup | FlowHome`}'));
  assert.ok(profile.includes('description={`${product.name}: buying considerations, setup requirements and model-specific sources. Check current pricing on Amazon.`}'));
  assert.doesNotMatch(profile, /Review, Price & Specs/);
  assert.ok(profile.includes('canonicalURL={`https://flowhome.dev/product/${product.slug}/`}'));
  assert.ok(profile.includes('type="product"'));
  assert.ok(profile.includes('generateProductSchema({ ...product, image: productImage })'));
});

test('search and sharing reuse the same metadata while review pages retain their editorial titles', () => {
  const base = read('../src/layouts/BaseLayout.astro');
  assert.ok(base.includes('<title>{title}</title>'));
  for (const attribute of ['property="og:title"', 'name="twitter:title"']) assert.ok(base.includes(`${attribute} content={title}`));
  for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) assert.ok(base.includes(`${attribute} content={description}`));
  const review = read('../src/layouts/ReviewLayout.astro');
  assert.ok(review.includes('title={`${review.title} | FlowHome`}'));
  assert.ok(review.includes('description={review.description || review.title}'));
  assert.ok(review.includes('canonicalURL={`https://flowhome.dev/review/${review.slug}/`}'));
});
