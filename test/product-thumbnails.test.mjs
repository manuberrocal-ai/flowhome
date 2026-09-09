import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { thumbnailSources, thumbnailWidths, thumbnailPath, getProductThumbnailSet, getProductDetailSet } from '../src/lib/product-thumbnails.js';

test('every allowed illustration has smaller square thumbnail variants', async () => {
  for (const source of thumbnailSources) {
    const original = await readFile(new URL('../public' + source, import.meta.url));
    for (const width of thumbnailWidths) {
      const bytes = await readFile(new URL('../public' + thumbnailPath(source, width), import.meta.url));
      const meta = await sharp(bytes).metadata();
      assert.equal(meta.width, width);
      assert.equal(meta.height, width);
      assert.equal(meta.format, 'webp');
      assert.ok(bytes.length < original.length / 4, source + ':' + width);
    }
  }
});

test('thumbnail sets preserve identity and reject arbitrary paths', () => {
  assert.match(getProductThumbnailSet({ slug: 'ring-video-doorbell-wired' }), /models-v1\/ring-video-doorbell-wired-240.webp 240w/);
  assert.doesNotMatch(getProductThumbnailSet({ image: 'https://unapproved.example/a.webp' }), /unapproved|undefined/);
  assert.equal(thumbnailPath('/images/product-art/../secret.webp', 240), undefined);
  assert.equal(thumbnailPath(thumbnailSources[0], 999), undefined);
});

test('detail sets retain verified model resolution without authorizing supplied image paths', () => {
  assert.match(getProductDetailSet({ slug: 'echo-dot-5th-gen' }), /echo-dot-5th-gen.webp 1254w$/);
  assert.doesNotMatch(getProductDetailSet({ image: '/images/product-art/models-v1/echo-dot-5th-gen.webp' }), /1254w|models-v1/);
  assert.doesNotMatch(getProductDetailSet({ slug: 'echo-dot-5th-gen', asin: 'WRONG' }), /1254w|models-v1/);
});
