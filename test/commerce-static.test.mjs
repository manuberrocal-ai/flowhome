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
