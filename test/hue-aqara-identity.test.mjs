import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { normalizeCartItems, buildAmazonCartUrl, mergeCartStates, CART_STORAGE_VERSION } from '../src/lib/cart-store.js';
import { getCommerceData } from '../src/lib/commerce-data.ts';

const cases = [
  { slug: 'philips-hue-white-color-starter-kit', oldAsin: 'B016H0QZ7I', asin: 'B096YFWVVS', date: '2026-06-28' },
  { slug: 'aqara-motion-sensor-p1', oldAsin: 'B09QXPBRM2', asin: 'B09QKVMMTB', date: '2026-06-29' },
];
for (const {slug,oldAsin,asin,date} of cases) {
  test(`${slug}: corrected destination does not renew commercial observations`, () => {
    const product = parse(readFileSync(new URL(`../src/content/products/${slug}.yaml`,import.meta.url),'utf8'));
    assert.equal(product.asin,asin);
    assert.equal(product.affiliateUrl,`https://www.amazon.com/dp/${asin}?tag=flowhome-20`);
    assert.equal(product.priceLastChecked,date);
    assert.equal(product.ratingLastChecked,date);
    assert.equal(getCommerceData(product).displayPrice,undefined);
    assert.equal(getCommerceData(product).displayRating,undefined);
    assert.ok(product.sources.some(source=>source.url===`https://www.amazon.com/dp/${asin}`));
  });
  test(`${slug}: legacy saves deduplicate and transfer corrected identity only for this slug`, () => {
    const legacy = {asin:oldAsin,slug,url:`/product/${slug}/`};
    const items = normalizeCartItems([legacy,{...legacy,asin}]);
    assert.equal(items.length,1);
    assert.equal(items[0].asin,asin);
    assert.equal(new URL(buildAmazonCartUrl(items)).searchParams.get('ASIN.1'),asin);
    for(const item of [{asin:oldAsin},{asin:oldAsin,slug:'unrelated-product'},{asin,slug}]) assert.equal(normalizeCartItems([item])[0].asin,item.asin);
    const state = (item,quantity,clock,deviceId) => ({version:CART_STORAGE_VERSION,clock,deviceId,entries:[{...item,quantity,clock,deviceId}]});
    const active = state(legacy,1,3,'device-old');
    const removed = state({...legacy,asin},0,4,'device-new');
    for(const [left,right] of [[active,removed],[removed,active]]) {
      const merged=mergeCartStates(left,right);
      assert.equal(merged.entries.length,1);
      assert.equal(merged.entries[0].asin,asin);
      assert.equal(merged.entries[0].quantity,0);
      assert.equal(merged.entries[0].clock,4);
    }
  });
}
test('Hue historical deal remains expired and unfeatured after destination correction', () => {
  const deal=parse(readFileSync(new URL('../src/content/deals/philips-hue-starter-kit-deal.yaml',import.meta.url),'utf8'));
  assert.equal(deal.asin,cases[0].asin);
  assert.equal(deal.affiliateUrl,`https://www.amazon.com/dp/${cases[0].asin}?tag=flowhome-20`);
  assert.equal(String(deal.endDate),'2026-07-15');
  assert.equal(deal.featured,false);
});
