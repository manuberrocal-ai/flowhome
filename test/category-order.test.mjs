import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = (file) => readFileSync(new URL(`../src/pages/${file}`, import.meta.url), 'utf8');
const category = read('category/[slug].astro');
const catalog = read('products/index.astro');
// Exercise the actual pure callbacks from the local template, not a copied sort.
const callback = (source, method) => source.match(new RegExp(`\\.${method}\\(([^\\n]+)\\)[;\\r]`))?.[1]
  ?? source.match(new RegExp(`\\.${method}\\(([^\\n]+)\\)\\r?\\n`))?.[1];
const compareSource = callback(category, 'sort');
const compare = runInNewContext(`(${compareSource})`);
const productPipeline = category.slice(category.indexOf('const products ='), category.indexOf('const [guides, reviews]'));
const include = runInNewContext(`(${callback(productPipeline, 'filter')})`, { category: { data: { slug: 'smart-hub' } } });
const product = (id, name, ownerRating, ownerRatingCount, catalogActive = true, group = 'smart-hub') => ({ id, data: { name, ownerRating, ownerRatingCount, catalogActive, category: group } });

test('category uses the catalog alphabetical ordering and ignores rating popularity', () => {
  assert.equal(compareSource, callback(catalog, 'sort'));
  const entries = [product('z', 'Zulu', 5, 999999), product('b', 'Alpha', 1, 0), product('a', 'Alpha', 0, 0)];
  assert.deepEqual(entries.toSorted(compare).map(({ id }) => id), ['a', 'b', 'z']);
  const changed = entries.map((entry) => ({ ...entry, data: { ...entry.data, ownerRating: 5 - entry.data.ownerRating, ownerRatingCount: 999999 - entry.data.ownerRatingCount } })).reverse();
  assert.deepEqual(changed.toSorted(compare).map(({ id }) => id), ['a', 'b', 'z']);
});

test('category preserves active membership filtering and explains its order', () => {
  const entries = [product('yes', 'Hub', 1, 0), product('inactive', 'Hidden', 5, 999, false), product('other', 'Camera', 5, 999, true, 'security-camera')];
  assert.deepEqual(entries.filter(include).map(({ id }) => id), ['yes']);
  assert.match(category, /Products are listed alphabetically, not ranked by ratings, price or compatibility\./);
  assert.match(category, /relevantGuides\.map/);
  assert.match(category, /relevantReviews\.slice/);
});
