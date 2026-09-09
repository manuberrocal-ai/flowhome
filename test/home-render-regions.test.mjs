import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
test('home defers only distant independent regions without removing cards or print content', () => {
  assert.match(source, /\.featured-products \.product-card\s*\{\s*content-visibility: auto;\s*contain-intrinsic-block-size: auto 36rem;/);
  assert.match(source, /\.home-review-notes\s*\{\s*content-visibility: auto;\s*contain-intrinsic-block-size: auto 96rem;/);
  assert.match(source, /@media print\s*\{\s*\.featured-products \.product-card, \.home-review-notes\s*\{ content-visibility: visible;/);
  assert.match(source, /featuredProducts\.map\(\(product\) => <ProductCard/);
  assert.doesNotMatch(source, /content-visibility:\s*hidden/);
  assert.doesNotMatch(source, /\.hero-surface\s*\{[^}]*content-visibility/);
});
