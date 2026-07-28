import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import test from 'node:test';
import {
  CANONICAL_CATEGORIES,
  RELATIONSHIP_TYPES,
  getRelationshipLabel,
  selectDirectAlternatives,
} from '../src/lib/product-taxonomy.ts';

const root = new URL('../', import.meta.url);
const source = (path) => readFile(new URL(path, root), 'utf8');

const slugs = (relations) => relations.map(({ product }) => (product.data ?? product).slug);

test('selects only catalog-active products with the same canonical intent and excludes current', () => {
  const current = { slug: 'hub', category: 'smart-hub' };
  const products = [
    current,
    { slug: 'other-hub', category: 'smart-hub', catalogActive: true },
    { slug: 'levoit', category: 'air-purifier', catalogActive: true },
    { slug: 'off', category: 'smart-hub', catalogActive: false },
  ];
  assert.deepEqual(slugs(selectDirectAlternatives(current, products)), ['other-hub']);
});

test('keeps explicit accessories out of direct alternatives and exposes exact labels', () => {
  const current = {
    slug: 'hub',
    category: 'smart-hub',
    relationships: [{ type: 'compatible-accessory', targetSlug: 'accessory' }],
  };
  const accessory = { slug: 'accessory', category: 'smart-hub', catalogActive: true };
  assert.deepEqual(selectDirectAlternatives(current, [current, accessory]), []);
  assert.equal(getRelationshipLabel('direct-alternative'), 'Direct alternative');
  assert.equal(getRelationshipLabel('compatible-accessory'), 'Compatible accessory');
  assert.equal(getRelationshipLabel('same-ecosystem'), 'Same ecosystem');
  assert.equal(getRelationshipLabel('frequently-paired'), 'Frequently paired');
  assert.equal(getRelationshipLabel('editorial-content'), 'Editorial content');
});

test('prioritizes explicit direct alternatives without crossing category boundaries', () => {
  const current = {
    slug: 'hub',
    category: 'smart-hub',
    relationships: [{ type: 'direct-alternative', targetSlug: 'preferred-hub' }],
  };
  const products = [
    { slug: 'other-hub', category: 'smart-hub', catalogActive: true },
    { slug: 'preferred-hub', category: 'smart-hub', catalogActive: true },
    { slug: 'preferred-purifier', category: 'air-purifier', catalogActive: true },
  ];
  assert.deepEqual(slugs(selectDirectAlternatives(current, products)), ['preferred-hub', 'other-hub']);
});

test('validates every product YAML category against the canonical taxonomy', async () => {
  const files = await readdir(new URL('../src/content/products/', import.meta.url));
  const contentConfig = await source('src/content.config.ts');
  const productFiles = files.filter((file) => file.endsWith('.yaml'));
  for (const file of productFiles) {
    const text = await source(`src/content/products/${file}`);
    const category = text.match(/^category:\s*([^\s#]+)/m)?.[1];
    assert.ok(category && CANONICAL_CATEGORIES.includes(category), `${file} has an invalid category`);
  }
  assert.match(contentConfig, /category:\s*z\.enum\(CANONICAL_CATEGORIES\)/);
  assert.match(contentConfig, /type:\s*z\.enum\(RELATIONSHIP_TYPES\)/);
  assert.equal(RELATIONSHIP_TYPES.length, 5);
});

test('rejects an invalid category', () => {
  assert.equal(CANONICAL_CATEGORIES.includes('smart-hub-like'), false);
});

test('Smart Hub alternatives cannot include unrelated P0 products', () => {
  const current = { slug: 'hub', category: 'smart-hub' };
  const products = [
    current,
    { slug: 'levoit-core-300s-air-purifier', category: 'air-purifier', catalogActive: true },
    { slug: 'aqara-motion-sensor-p1', category: 'motion-sensor', catalogActive: true },
    { slug: 'switchbot-blind-tilt', category: 'smart-blinds', catalogActive: true },
  ];
  assert.deepEqual(selectDirectAlternatives(current, products), []);
});
