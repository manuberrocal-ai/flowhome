import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { illustrationCategories } from '../src/lib/product-image-policy.js';
import { modelIllustrations } from '../src/lib/product-image-policy.js';
import { fileURLToPath } from 'node:url';

test('all optimized illustrations preserve decoded pixels and reduce bytes', async () => {
  const directory = new URL('../public/images/product-art/illustrations-v1/', import.meta.url);
  let before = 0, after = 0;
  for (const category of illustrationCategories) {
    const source = await readFile(new URL(category + '.png', directory));
    const output = await readFile(new URL(category + '.webp', directory));
    const a = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(a.info.width, b.info.width, category);
    assert.equal(a.info.height, b.info.height, category);
    assert.ok(a.data.equals(b.data), `${category}: decoded RGBA`);
    assert.ok(output.length < source.length, `${category}: byte reduction`);
    before += source.length;
    after += output.length;
  }
  assert.ok(after < before * 0.8, 'at least 20% less payload for this fixed artwork set');
});

test('model-specific WebP artwork preserves its original generated pixels', async () => {
  const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const descriptor = Number(home.match(/\$\{product\.image\} (\d+)w/)[1]);
  for (const model of modelIllustrations) {
    const optimized = new URL('../public' + model.image, import.meta.url);
    const source = new URL(optimized.href.replace(/\.webp$/, '.png'));
    const metadata = await sharp(fileURLToPath(optimized)).metadata();
    assert.equal(metadata.width, descriptor, `${model.slug}: original responsive descriptor`);
    assert.equal(metadata.height, 1254, `${model.slug}: square artwork`);
    const original = await sharp(fileURLToPath(source)).ensureAlpha().raw().toBuffer();
    const encoded = await sharp(fileURLToPath(optimized)).ensureAlpha().raw().toBuffer();
    assert.ok(original.equals(encoded), model.slug);
  }
});
