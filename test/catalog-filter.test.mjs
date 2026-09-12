import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesCatalogQuery, normalizeCatalogText, readCatalogFilters, writeCatalogFilters } from '../src/lib/catalog-filter.js';

const product = { name: 'TP-Link Kasa Smart Dimmer Switch HS220', brand: 'TP-Link', model: 'HS220', category: 'smart-lighting' };

test('catalog query matches model, brand and human-readable category', () => {
  for (const query of ['HS220', 'tp link', 'smart lighting', '  KASA   dimmer ', 'dimmer kasa']) {
    assert.equal(matchesCatalogQuery(product, query), true, query);
  }
  assert.equal(matchesCatalogQuery(product, 'camera'), false);
  assert.equal(matchesCatalogQuery(product, 'kasa camera'), false);
});

test('setup filtering is evidence-bound and combines with name and category', () => {
  assert.equal(matchesCatalogQuery(product, '', '', 'plug-and-play'), false, 'unknown is not easy installation');
  assert.equal(matchesCatalogQuery({ ...product, installation: 'advanced' }, 'kasa', 'smart-lighting', 'advanced'), true);
  assert.equal(matchesCatalogQuery({ ...product, installation: 'advanced' }, 'kasa', '', 'plug-and-play'), false);
});

test('catalog filter links validate supported values and preserve unrelated parameters', () => {
  const filters = readCatalogFilters('?q=Kasa&category=smart-lighting&setup=advanced', ['smart-lighting']);
  assert.deepEqual(filters, { query: 'Kasa', category: 'smart-lighting', installation: 'advanced' });
  assert.deepEqual(readCatalogFilters('?category=javascript%3Aalert(1)&setup=compatible'), { query: '', category: '', installation: '' });
  assert.equal(readCatalogFilters('?q=' + 'a'.repeat(200)).query.length, 120);
  const query = writeCatalogFilters('?utm_source=guide&q=old&category=old', filters);
  assert.equal(new URLSearchParams(query).get('utm_source'), 'guide');
  assert.deepEqual(readCatalogFilters(query, ['smart-lighting']), filters);
  assert.equal(writeCatalogFilters(query, { query: '', category: '', installation: '' }), 'utm_source=guide');
  const literal = '<script> & #';
  assert.equal(readCatalogFilters(writeCatalogFilters('', { query: literal, category: '', installation: '' })).query, literal);
});

test('category and query combine; empty filters preserve products', () => {
  assert.equal(matchesCatalogQuery(product), true);
  assert.equal(matchesCatalogQuery(product, 'kasa', 'smart-lighting'), true);
  assert.equal(matchesCatalogQuery(product, '', 'smart-lock'), false);
  assert.equal(normalizeCatalogText('Cámara'), 'camara');
  assert.equal(matchesCatalogQuery({}, ''), true);
  assert.equal(matchesCatalogQuery({}, '<script>'), false);
});
