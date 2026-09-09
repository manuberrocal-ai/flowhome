import assert from 'node:assert/strict';
import test from 'node:test';
import { COMMERCE_FRESHNESS, formatCommerceDate, getAvailabilitySchemaUrl, getCommerceData } from '../src/lib/commerce-data.ts';

const now = new Date('2026-07-26T12:00:00Z');
const product = (overrides = {}) => ({
  price: 80,
  originalPrice: 100,
  discountPct: 20,
  asin: 'B012345678',
  affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20',
  priceSource: 'amazon-creators-api',
  priceLastChecked: '2026-07-26T11:00:00Z',
  availabilityStatus: 'in-stock',
  availabilitySource: 'amazon-creators-api',
  availabilityLastChecked: '2026-07-26T11:00:00Z',
  ownerRating: 4.7,
  ownerRatingCount: 100,
  ratingSource: 'amazon-creators-api',
  ratingLastChecked: '2026-07-26T11:00:00Z',
  ...overrides,
});

test('public fields require fresh exact-source API observations and coherent discounts', () => {
  const commerce = getCommerceData(product(), now);
  assert.equal(commerce.isPriceFresh, true);
  assert.equal(commerce.showPromotion, true);
  assert.equal(commerce.hasOffer, true);
  assert.equal(commerce.priceLabel, 'Price snapshot');
  assert.equal(commerce.displayPrice, 80);
  assert.equal(commerce.displayOriginalPrice, 100);
  assert.equal(commerce.displayDiscountPct, 20);
  assert.equal(commerce.displayRating, 4.7);
  assert.equal(commerce.displayRatingCount, 100);
  assert.equal(commerce.priceCapturedAt, '2026-07-26T11:00:00.000Z');
  assert.equal(commerce.priceExpiresAt, '2026-07-27T11:00:00.000Z');
  assert.equal(commerce.ratingExpiresAt, '2026-07-27T11:00:00.000Z');
  assert.equal(commerce.availabilityExpiresAt, '2026-07-27T11:00:00.000Z');
});

test('manual and unknown-feed timestamps do not grant publication rights', () => {
  for (const source of ['manual', 'affiliate-feed', 'affiliate feed', 'Amazon customer ratings', 'AMAZON-CREATORS-API', '', undefined]) {
    const commerce = getCommerceData(product({ priceSource: source, ratingSource: source, availabilitySource: source }), now);
    assert.equal(commerce.isPriceFresh, false, String(source));
    assert.equal(commerce.hasOffer, false, String(source));
    assert.equal(commerce.showPromotion, false, String(source));
    assert.equal(commerce.displayPrice, undefined);
    assert.equal(commerce.displayRating, undefined);
    assert.equal(commerce.availability, undefined);
    assert.equal(commerce.priceLabel, 'Check price on Amazon');
  }
});

test('stale, unknown, future, date-only, invalid-calendar and non-UTC captures fail closed', () => {
  for (const priceLastChecked of ['2026-07-25T11:59:59Z', undefined, '2026-07-27T00:00:00Z', '2026-07-26T10:00:00+02:00', '2026-07-26', '2026-02-30T12:00:00Z', '2026-07-25T24:00:00Z', '2026-07-26T11:00:60Z', '2026-07-26T11:00:00', '']) {
    const commerce = getCommerceData(product({ priceLastChecked }), now);
    assert.equal(commerce.isPriceFresh, false);
    assert.equal(commerce.showPromotion, false);
    assert.equal(commerce.hasOffer, false);
    assert.equal(commerce.displayPrice, undefined);
    assert.equal(commerce.priceLabel, 'Check price on Amazon');
  }
});

test('the 24-hour maximum is exclusive and cannot be extended by expiry metadata', () => {
  assert.equal(COMMERCE_FRESHNESS.priceMs, 86_400_000);
  assert.equal(COMMERCE_FRESHNESS.ratingMs, 86_400_000);
  assert.equal(COMMERCE_FRESHNESS.availabilityMs, 86_400_000);
  const source = product({ priceLastChecked: '2026-07-25T12:00:00Z', ratingLastChecked: '2026-07-25T12:00:00Z', availabilityLastChecked: '2026-07-25T12:00:00Z', priceValidUntil: '2030-01-01T00:00:00Z' });
  const before = getCommerceData(source, new Date(now.valueOf() - 1));
  assert.equal(before.displayPrice, 80);
  assert.equal(before.displayRating, 4.7);
  assert.equal(before.isAvailabilityFresh, true);
  const atExpiry = getCommerceData(source, now);
  assert.equal(atExpiry.displayPrice, undefined);
  assert.equal(atExpiry.displayRating, undefined);
  assert.equal(atExpiry.availability, undefined);
  assert.equal(getCommerceData(product({ priceValidUntil: '2030-01-01T00:00:00Z' }), now).priceValidUntil, '2026-07-27T11:00:00.000Z');
});

test('supplied expiry must be valid strict UTC and future for each individual field', () => {
  const early = getCommerceData(product({ priceValidUntil: '2026-07-26T13:00:00Z' }), now);
  assert.equal(early.priceValidUntil, '2026-07-26T13:00:00.000Z');
  for (const value of ['2026-07-26T12:00:00Z', '2026-07-25T00:00:00Z', '2026-07-27T12:00:00+01:00', '2026-02-30T00:00:00Z', 'not-a-date', '', null]) {
    const expired = getCommerceData(product({ priceValidUntil: value, ratingValidUntil: value, availabilityValidUntil: value }), now);
    assert.equal(expired.priceValidUntil, undefined, String(value));
    assert.equal(expired.displayPrice, undefined);
    assert.equal(expired.displayRating, undefined);
    assert.equal(expired.availability, undefined);
  }
});

test('invalid or non-positive prices cannot create an offer or promotion', () => {
  for (const price of [0, -1, NaN, Infinity, -Infinity, '80', null, undefined]) {
    const commerce = getCommerceData(product({ price }), now);
    assert.equal(commerce.hasOffer, false, String(price));
    assert.equal(commerce.displayPrice, undefined);
    assert.equal(commerce.showPromotion, false);
  }
});

test('discount claims must match arithmetic and use finite positive list prices', () => {
  for (const overrides of [{ discountPct: 90 }, { discountPct: 0 }, { discountPct: 100 }, { discountPct: NaN }, { discountPct: '20' }, { discountPct: 20.4 }, { originalPrice: Infinity }, { originalPrice: 0 }, { originalPrice: -1 }, { originalPrice: 70 }]) {
    const commerce = getCommerceData(product(overrides), now);
    assert.equal(commerce.showPromotion, false, JSON.stringify(overrides));
    assert.equal(commerce.displayOriginalPrice, undefined);
    assert.equal(commerce.displayDiscountPct, undefined);
    assert.equal(commerce.displayPrice, 80);
  }
  assert.equal(getCommerceData(product({ price: 49.99, originalPrice: 59.99, discountPct: 17 }), now).showPromotion, true);
});

test('availability source, capture and status are independently authorized', () => {
  assert.equal(getCommerceData(product(), now).availability, 'https://schema.org/InStock');
  for (const overrides of [{ availabilitySource: 'manual' }, { availabilitySource: 'affiliate feed' }, { availabilityLastChecked: '2026-07-25T11:00:00Z' }, { availabilityLastChecked: '2026-07-27T11:00:00Z' }, { availabilityStatus: 'Unknown' }, { availabilityStatus: 'toString' }]) {
    const commerce = getCommerceData(product(overrides), now);
    assert.equal(commerce.availability, undefined);
    assert.equal(commerce.showPromotion, false);
    assert.equal(commerce.hasOffer, true, 'a verified price is independent from unknown availability');
  }
  assert.equal(getCommerceData(product({ availabilityStatus: 'out-of-stock' }), now).showPromotion, false);
  assert.equal(getAvailabilitySchemaUrl('toString'), undefined);
});

test('ratings require exact provenance, a fresh timestamp, valid scale and positive count', () => {
  for (const overrides of [{ ownerRating: 0 }, { ownerRating: 5.1 }, { ownerRating: NaN }, { ownerRating: '4.7' }, { ownerRatingCount: 0 }, { ownerRatingCount: -1 }, { ownerRatingCount: 2.5 }, { ownerRatingCount: Infinity }, { ratingLastChecked: '2026-07-25T11:00:00Z' }, { ratingLastChecked: '2026-02-30T12:00:00Z' }, { ratingLastChecked: '2026-07-27T11:00:00Z' }, { ratingSource: 'Amazon customer ratings' }]) {
    const commerce = getCommerceData(product(overrides), now);
    assert.equal(commerce.isRatingFresh, false, JSON.stringify(overrides));
    assert.equal(commerce.displayRating, undefined);
    assert.equal(commerce.displayRatingCount, undefined);
    assert.equal(commerce.ratingExpiresAt, undefined);
    assert.equal(commerce.displayPrice, 80);
  }
});

test('only a same-product direct US Amazon destination supports public API fields', () => {
  for (const affiliateUrl of ['https://example.test/product', 'http://www.amazon.com/dp/B012345678', 'https://amazon.com.evil.test/dp/B012345678', 'https://user:pass@www.amazon.com/dp/B012345678', 'https://www.amazon.com:8443/dp/B012345678', 'https://www.amazon.com/s?k=light', 'https://www.amazon.ca/dp/B012345678', 'https://www.amazon.com/dp/B987654321']) {
    const commerce = getCommerceData(product({ affiliateUrl }), now);
    assert.equal(commerce.displayPrice, undefined, affiliateUrl);
    assert.equal(commerce.displayRating, undefined);
    assert.equal(commerce.availability, undefined);
  }
});

test('invalid reference times never throw or publish and timestamp formatting rejects rollover', () => {
  for (const reference of [new Date(NaN), 'not-a-date', '2026-02-30T12:00:00Z', '2026-07-26T12:00:00', '2026-07-26']) {
    const commerce = getCommerceData(product(), reference);
    assert.equal(commerce.displayPrice, undefined);
    assert.equal(commerce.displayRating, undefined);
    assert.equal(commerce.availability, undefined);
  }
  assert.equal(formatCommerceDate('2026-02-30'), undefined);
  assert.equal(formatCommerceDate('2026-02-28'), '2026-02-28');
  assert.equal(getCommerceData(product({ priceLastChecked: '2026-07-26T11:00:00.1Z' }), now).priceCapturedAt, '2026-07-26T11:00:00.100Z');
});
