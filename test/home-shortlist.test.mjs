import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { HOME_SHORTLIST, selectHomeShortlist } from '../src/lib/home-shortlist.js';

const products = readdirSync('src/content/products').filter(name => name.endsWith('.yaml')).map(name => ({ data: parse(readFileSync('src/content/products/' + name, 'utf8')) }));
test('home selection has eight actual distinct categories and explicit reasons', () => {
  const selected = selectHomeShortlist(products);
  assert.equal(selected.length, 8);
  assert.equal(new Set(selected.map(p => p.data.category)).size, 8);
  assert.deepEqual(selected.map(p => p.data.slug), HOME_SHORTLIST.map(p => p.slug));
  assert.ok(selected.every(p => p.editorialReason.length > 20));
});
test('file order and ratings cannot change editorial selection; inactive items stay out', () => {
  assert.deepEqual(selectHomeShortlist([...products].reverse()), selectHomeShortlist(products));
  const changed = products.map(p => ({ data: { ...p.data, ownerRating: 0, ownerRatingCount: 9999999 } }));
  assert.deepEqual(selectHomeShortlist(changed).map(p => p.data.slug), HOME_SHORTLIST.map(p => p.slug));
  changed.find(p => p.data.slug === HOME_SHORTLIST[0].slug).data.catalogActive = false;
  assert.equal(selectHomeShortlist(changed).length, 7);
  assert.throws(() => selectHomeShortlist([]), /Missing editorial shortlist product/);
});
