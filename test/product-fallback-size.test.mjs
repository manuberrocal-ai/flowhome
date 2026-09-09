import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductFallbackImage } from '../src/lib/product-art.ts';
import { illustrationCategories, getCategoryIllustration } from '../src/lib/product-image-policy.js';
import { thumbnailPath } from '../src/lib/product-thumbnails.js';

test('every category fallback uses its authorized high-density thumbnail', () => {
  for (const category of illustrationCategories) {
    assert.equal(getProductFallbackImage({ category }), thumbnailPath(getCategoryIllustration(category), 960));
  }
  assert.equal(getProductFallbackImage({ category: '../../outside' }), '/images/product-art/illustrations-v1/smart-home-device-960.webp');
  assert.equal(getProductFallbackImage({}), '/images/product-art/illustrations-v1/smart-home-device-960.webp');
});
