import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { normalizeCartItems, buildAmazonCartUrl, mergeCartStates, CART_STORAGE_VERSION } from '../src/lib/cart-store.js';
import { getCommerceData } from '../src/lib/commerce-data.ts';

const oldAsin = 'B09NM549V7';
const asin = 'B09NM56KJM';
const slug = 'roborock-q5-plus';
const legacy = {asin:oldAsin,slug,name:'Roborock Q5+',url:'/product/roborock-q5-plus/',price:399.99};

test('Q5 product and expired deal share the corrected destination, without renewing commerce', () => {
  const product = parse(readFileSync(new URL('../src/content/products/roborock-q5-plus.yaml',import.meta.url),'utf8'));
  const deal = parse(readFileSync(new URL('../src/content/deals/roborock-q5-plus-deal.yaml',import.meta.url),'utf8'));
  for(const record of [product,deal]) {
    assert.equal(record.asin,asin);
    assert.equal(record.affiliateUrl,`https://www.amazon.com/dp/${asin}?tag=flowhome-20`);
  }
  assert.equal(product.slug,slug);
  assert.equal(product.priceLastChecked,'2026-07-18');
  assert.equal(product.ratingLastChecked,'2026-07-18');
  assert.equal(getCommerceData(product).displayPrice,undefined);
  assert.equal(getCommerceData(product).displayRating,undefined);
  assert.equal(deal.featured,false);
  assert.equal(String(deal.endDate),'2026-07-15');
});

test('legacy Q5 saved items deduplicate and transfer the corrected ASIN', () => {
  const items = normalizeCartItems([legacy,{...legacy,asin}]);
  assert.equal(items.length,1);
  assert.equal(items[0].asin,asin);
  assert.equal(items[0].url,legacy.url);
  const url = new URL(buildAmazonCartUrl(items));
  assert.equal(url.searchParams.get('ASIN.1'),asin);
  assert.ok(!url.href.includes(oldAsin));
  for(const item of [{asin:oldAsin},{asin:oldAsin,slug:'roborock-s7-maxv-ultra'},{asin,slug}]) assert.equal(normalizeCartItems([item])[0].asin,item.asin);
});

test('corrected identity keeps tombstones and merge order stable across old and new clients', () => {
  const state = (entry,clock,deviceId) => ({version:CART_STORAGE_VERSION,clock,deviceId,entries:[{...entry,clock,deviceId}]});
  const old = state({...legacy,quantity:1},3,'device-old');
  const removed = state({...legacy,asin,quantity:0},4,'device-new');
  for(const [left,right] of [[old,removed],[removed,old]]) {
    const merged=mergeCartStates(left,right);
    assert.equal(merged.entries.length,1);
    assert.equal(merged.entries[0].asin,asin);
    assert.equal(merged.entries[0].quantity,0);
    assert.equal(merged.entries[0].clock,4);
  }
});
