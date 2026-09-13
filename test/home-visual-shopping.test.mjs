import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const renderedSource = home.slice(home.indexOf('<BaseLayout'));

test('hero SSR uses catalog category keys without changing the visible label', () => {
  assert.match(home, /categorySlug: showcaseProducts\[index\]\.data\.category/);
  assert.match(home, /data-category=\{heroProducts\[0\]\.categorySlug\}/);
  assert.match(home, /data-hero-field="category"[^>]*>\{heroProducts\[0\]\.category\}/);
});

test('home presents the product before the three editorial paths in DOM and focus order', () => {
  const showcase = renderedSource.indexOf('data-hero-showcase');
  const controls = renderedSource.indexOf('data-hero-controls');
  const paths = renderedSource.indexOf('data-home-guide-paths');
  assert.ok(showcase >= 0 && controls > showcase && paths > controls);
  assert.ok(renderedSource.slice(controls, paths).includes('</section>'), 'guides follow the completed hero section');
  const guides = renderedSource.slice(paths, renderedSource.indexOf('</section>', paths));
  assert.equal((guides.match(/href="\/best\/best-/g) ?? []).length, 3);
  assert.doesNotMatch(guides, /\shidden(?:\s|>|=)|line-clamp|truncate|\border-/);
});

test('hero shopping panel is outside the image stage and cannot cover its image with absolute positioning', () => {
  const photo = renderedSource.indexOf('data-hero-photo-link');
  const caption = renderedSource.indexOf('data-image-source-caption', photo);
  const amazon = renderedSource.indexOf('<a data-hero-amazon', caption);
  assert.ok(photo > 0 && caption > photo && amazon > caption);
  assert.match(renderedSource.slice(caption, amazon), /<\/div>/, 'image stage closes before the affiliate link');
  const amazonOpening = renderedSource.slice(amazon, renderedSource.indexOf('>', amazon));
  assert.doesNotMatch(amazonOpening, /\babsolute\b|top-\[|right-\d/);
  assert.match(amazonOpening, /rel="nofollow sponsored noopener noreferrer"/);
  assert.match(home, /\.home-hero-commerce\s*\{[^}]*position: relative;[^}]*display: grid;/);
  assert.doesNotMatch(home, /\.hero-product-image[^}]*transform:\s*scale/);
});

test('recomposed hero retains source, fallback, price gates, and accessible carousel controls', () => {
  for (const hook of ['data-hero-image', 'data-hero-photo-link', 'data-hero-checks', 'data-hero-amazon', 'data-hero-details', 'data-hero-playback', 'data-hero-live']) {
    assert.equal((renderedSource.match(new RegExp(`\\b${hook}\\b`, 'g')) ?? []).length, 1, hook);
  }
  for (const field of ['category', 'title', 'image-caption', 'price', 'original-price', 'rating', 'rating-count', 'rating-source', 'discount', 'quote', 'badges']) {
    assert.match(renderedSource, new RegExp(`data-hero-field="${field}"`));
  }
  assert.match(home, /getCommerceData\(data, now\)/);
  assert.match(home, /getInstallationSummary\(getInstallationEvidence\(data, now\)\)/);
  assert.match(home, /preloadImageSizes=\{heroProducts\[0\]\?\.imageSizes\}/);
  assert.match(home, /sizes=\{heroProducts\[0\]\.imageSizes\}/);
  assert.match(home, /hidden=\{heroProducts\[0\]\.discountPct === undefined \|\| heroProducts\[0\]\.discountPct <= 0\}/);
  assert.match(home, /data-fallback-src=\{heroProducts\[0\]\.fallbackImage\}/);
  assert.match(home, /aria-live="polite"/);
  assert.match(home, /prefers-reduced-motion: reduce/);
  assert.match(home, /setupHeroCarousel\(\{ root, products:/);
});
