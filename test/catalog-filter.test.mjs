import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesCatalogQuery, normalizeCatalogText } from '../src/lib/catalog-filter.js';

const product = { name: 'TP-Link Kasa Smart Dimmer Switch HS220', brand: 'TP-Link', model: 'HS220', category: 'smart-lighting' };

test('catalog query matches model, brand and human-readable category', () => {
  for (const query of ['HS220', 'tp link', 'smart lighting', '  KASA   dimmer ', 'dimmer kasa']) {
    assert.equal(matchesCatalogQuery(product, query), true, query);
  }
  assert.equal(matchesCatalogQuery(product, 'camera'), false);
  assert.equal(matchesCatalogQuery(product, 'kasa camera'), false);
});

test('category and query combine; empty filters preserve products', () => {
  assert.equal(matchesCatalogQuery(product), true);
  assert.equal(matchesCatalogQuery(product, 'kasa', 'smart-lighting'), true);
  assert.equal(matchesCatalogQuery(product, '', 'smart-lock'), false);
  assert.equal(normalizeCatalogText('Cámara'), 'camara');
  assert.equal(matchesCatalogQuery({}, ''), true);
  assert.equal(matchesCatalogQuery({}, '<script>'), false);
});
