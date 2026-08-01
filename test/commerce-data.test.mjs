import assert from 'node:assert/strict';
import test from 'node:test';
import { getCommerceData } from '../src/lib/commerce-data.ts';

const now = new Date('2026-07-26T12:00:00Z');
const product = (overrides = {}) => ({
  price: 80,
  originalPrice: 100,
  discountPct: 20,
  affiliateUrl: 'https://example.test/product',
  priceSource: 'manual',
  priceLastChecked: '2026-07-25T12:00:00Z',
  ...overrides,
});

test('accepts strict UTC snapshots and only promotes fresh valid discounts', () => {
  const commerce = getCommerceData(product(), now);
  assert.equal(commerce.isPriceFresh, true);
  assert.equal(commerce.showPromotion, true);
  assert.equal(commerce.hasOffer, true);
  assert.equal(commerce.priceLabel, 'Price snapshot');
});

test('marks stale, unknown, future, and non-UTC price snapshots as historical', () => {
  for (const priceLastChecked of ['2026-07-19T11:59:59Z', undefined, '2026-07-27T00:00:00Z', '2026-07-25T12:00:00+02:00']) {
    const commerce = getCommerceData(product({ priceLastChecked }), now);
    assert.equal(commerce.isPriceFresh, false);
    assert.equal(commerce.showPromotion, false);
    assert.equal(commerce.hasOffer, false);
    assert.equal(commerce.priceLabel, 'Historical price snapshot');
  }
});

test('uses priceValidUntil only when it is strict UTC and in the future', () => {
  assert.equal(getCommerceData(product({ priceValidUntil: '2026-07-27T12:00:00Z' }), now).priceValidUntil, '2026-07-27T12:00:00.000Z');
  const expired = getCommerceData(product({ priceValidUntil: '2026-07-26T12:00:00Z' }), now);
  assert.equal(expired.priceValidUntil, undefined);
  assert.equal(expired.showPromotion, false);
  assert.equal(expired.hasOffer, false);
  assert.equal(getCommerceData(product({ priceValidUntil: '2026-07-27T12:00:00+01:00' }), now).priceValidUntil, undefined);
});

test('includes availability only with a verified fresh source and timestamp', () => {
  const verified = product({ availabilityStatus: 'in-stock', availabilitySource: 'affiliate feed', availabilityLastChecked: '2026-07-26T11:00:00Z' });
  assert.equal(getCommerceData(verified, now).availability, 'https://schema.org/InStock');
  assert.equal(getCommerceData(product({ availabilityStatus: 'in-stock', availabilitySource: 'affiliate feed', availabilityLastChecked: '2026-07-25T11:00:00Z' }), now).availability, undefined);
  assert.equal(getCommerceData(product({ availabilityStatus: 'in-stock', availabilityLastChecked: '2026-07-26T11:00:00Z' }), now).availability, undefined);
});
