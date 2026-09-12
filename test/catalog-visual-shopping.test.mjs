import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const catalog = read('src/pages/products/index.astro');
const card = read('src/components/ProductCard.astro');
const css = read('src/styles/global.css');

test('catalog progressive enhancement keeps content available and exposes honest setup filters', () => {
  assert.match(catalog, /data-catalog-controls hidden/);
  assert.match(catalog, /getInstallationEvidence\(product.data\)\?\.assessment \?\? ''/);
  assert.match(catalog, /id="catalog-installation"/);
  assert.match(catalog, /All categories<\/button>/);
  assert.match(catalog, /not compatibility guarantees/);
  assert.match(catalog, /window.addEventListener\('popstate'/);
  assert.match(catalog, /readCatalogFilters\(location.search, allowedCategories\)/);
  assert.match(catalog, /id="catalog-empty-reset"/);
  assert.match(catalog, /search.focus\(\)/);
  assert.match(catalog, /@media \(max-width: 380px\)\s*\{\s*\.catalog-filter-bar \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.doesNotMatch(catalog, /\.innerHTML\s*=|price-low|most-popular/);
});

test('motion acknowledges actions without delays and controls retain robust focus', () => {
  assert.match(catalog, /prefers-reduced-motion: reduce/);
  assert.match(catalog, /count.getAnimations\(\).forEach\(animation => animation.cancel\(\)\)/);
  assert.match(catalog, /duration: 150/);
  assert.match(css, /@keyframes bookmark-confirm/);
  assert.match(css, /:where\(a, button, input, select, textarea\):focus-visible \{ outline: 3px solid #12304f/);
  assert.match(css, /prefers-reduced-motion/);
});

test('commerce cards show complete names and only render financial numbers through the existing gate', () => {
  assert.match(card, /getCommerceData\(data\)/);
  assert.match(card, /const hasDeal = commerce.showPromotion/);
  assert.match(card, /commerce.displayPrice !== undefined && <div/);
  assert.match(card, /data-image-source-caption>\{getProductImageSourceLabel\(data\)\}/);
  assert.match(card, /<h2[^>]*product-card-title[^>]*>/);
  assert.doesNotMatch(card.match(/<h2[^>]*>/)?.[0] ?? '', /line-clamp|truncate/);
  assert.match(card, /rel="nofollow sponsored noopener noreferrer"/);
  assert.match(card, /data-fh-amazon-cta/);
});

test('primary and saved control colors provide normal-text contrast even with the bounded sheen', () => {
  const linear = byte => { const s = byte / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; };
  const contrast = rgb => 1.05 / (rgb.map(linear).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0) + .05);
  for (const hex of ['c2410c', '9a3412', '065f46']) {
    const rgb = hex.match(/../g).map(pair => parseInt(pair, 16));
    assert.ok(contrast(rgb) >= 4.5, hex);
    const sheen = rgb.map(channel => channel * (1 - .7 * .08) + 255 * .7 * .08);
    assert.ok(contrast(sheen) >= 4.5, hex + ' with sheen');
    assert.ok(css.includes('#' + hex));
  }
  assert.match(css, /\.premium-action, \.amazon-cta-button \{ background: #c2410c;/);
  assert.match(css, /\.premium-action:hover::after, \.premium-action:focus-within::after \{ opacity: \.08;/);
});
