import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src/', import.meta.url));

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

test('removes legacy commercial fields and centralizes availability schema mapping', async () => {
  const sourceFiles = (await files(src)).filter((file) => /\.(astro|ts|js)$/.test(file));
  for (const file of sourceFiles) {
    const text = await readFile(file, 'utf8');
    assert.doesNotMatch(text, /\b(?:product|data)\.(?:rating|reviewCount|available)\b/);
    if (!file.endsWith('commerce-data.ts')) assert.doesNotMatch(text, /InStock/);
  }
  const index = await readFile(path.join(src, 'pages', 'index.astro'), 'utf8');
  assert.doesNotMatch(index, /heroProducts\[0\]\.(?:rating|ratingCount)\b/);
  assert.match(index, /heroProducts\[0\]\.ownerRating\b/);
  assert.match(index, /heroProducts\[0\]\.ownerRatingCount\b/);
  const productDirectory = fileURLToPath(new URL('../src/content/products/', import.meta.url));
  for (const file of await readdir(productDirectory)) {
    const text = await readFile(path.join(productDirectory, file), 'utf8');
    assert.doesNotMatch(text, /^(?:rating|reviewCount|available):/m, file);
    assert.match(text, /^ownerRating:/m, file);
    assert.match(text, /^catalogActive:/m, file);
  }
});

test('translation is absent until there are real localized routes', async () => {
  const base = await readFile(path.join(src, 'layouts', 'BaseLayout.astro'), 'utf8');
  const footer = await readFile(path.join(src, 'components', 'Footer.astro'), 'utf8');
  assert.doesNotMatch(base, /GoogleTranslate|language-options|googtrans/);
  assert.doesNotMatch(footer, /translated-ltr|translated-rtl/);
});

test('search and legacy product details preserve freshness and compatibility truthfulness', async () => {
  const search = await readFile(path.join(src, 'pages', 'search.astro'), 'utf8');
  const product = await readFile(path.join(src, 'pages', 'product', '[slug].astro'), 'utf8');
  assert.match(search, /const commerce = getCommerceData\(product\.data\)/);
  assert.match(search, /priceLabel: commerce\.priceLabel/);
  assert.match(search, /escapeHtml\(item\.priceLabel\)/);
  assert.match(product, /data\.wifi && 'Wi-Fi'/);
  assert.match(product, /data\.alexaCompatible && 'Alexa'/);
  assert.doesNotMatch(product, /\['Wi-Fi', data\.bluetooth/);
  assert.doesNotMatch(product, /\['Alexa', data\.googleHomeCompatible/);
});

test('visible reviews do not assert unsupported catalog availability', async () => {
  for (const review of ['aqara-hub-m2-review.md', 'aeotec-smartthings-hub-review.md', 'switchbot-hub-2-review.md']) {
    const source = await readFile(path.join(src, 'content', 'reviews', review), 'utf8');
    assert.doesNotMatch(source, /product as available|availability marked true/i);
  }
});

test('commercial content loaders accept both .yaml and .yml files', async () => {
  const config = await readFile(path.join(src, 'content.config.ts'), 'utf8');
  for (const directory of ['products', 'deals', 'best-of', 'categories']) {
    assert.match(config, new RegExp(`glob\\(\\{ base: './src/content/${directory}', pattern: '\\*\\*/\\*\\.\\{yaml,yml\\}' \\}\\)`));
  }
});
