import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { CATEGORY_FEATURE_MATRIX, getProductFeatures } from '../src/lib/product-specs.ts';

test('public specifications never gain a schema default when the catalog observation is absent', () => {
  const root = new URL('../src/content/products/', import.meta.url);
  const products = readdirSync(root).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, root), 'utf8')));
  const schema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8').split('const reviewsCollection')[0];
  for (const product of products) {
    for (const row of CATEGORY_FEATURE_MATRIX[product.category]) {
      if (Object.hasOwn(product, row.sourceField)) continue;
      assert.doesNotMatch(schema, new RegExp('^\\s*' + row.sourceField + ':.*\\.default\\(', 'm'), `${product.slug}: ${row.sourceField}`);
      if (row.boolean) assert.equal(getProductFeatures(product).find(feature => feature.label === row.label)?.value, 'Not verified');
    }
  }
});
