import assert from 'node:assert/strict';
import test from 'node:test';
import { projectAuthorizedCommerce } from '../src/lib/blocks/block8/public-projection.ts';
import { NOW, offerFixture, evidenceFixture } from './helpers/block8-fixtures.mjs';

const asin = 'B0FIXTUR01';
const make = () => { const offer = offerFixture({ source: 'amazon-creators-api', affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=flowhome-20` }); const evidence = evidenceFixture(offer); evidence.knownVariants[0].marketplaceId = asin; return { offer, evidence }; };

test('trusted price and availability project without leaking raw records or inventing other fields', () => {
  const { offer, evidence } = make(); const before = JSON.stringify(offer);
  const result = projectAuthorizedCommerce(asin, offer, evidence, NOW);
  assert.equal(result.displayPrice, 100);
  assert.equal(result.availability, 'https://schema.org/InStock');
  assert.equal(result.displayOriginalPrice, undefined);
  assert.equal(result.displayDiscountPct, undefined);
  assert.equal(result.displayRating, undefined);
  assert.equal(result.showPromotion, false);
  assert.equal(JSON.stringify(result).includes('fixture:'), false);
  assert.equal(JSON.stringify(offer), before);
});

test('availability missing, revoked or expired is omitted while independently permitted price survives', () => {
  for (const mutation of [grant => { delete grant.availability; }, grant => { grant.availability.state = 'revoked'; }, grant => { grant.availability.validUntil = NOW; }]) {
    const { offer, evidence } = make(); mutation(evidence.sourcePermissions[0]);
    const result = projectAuthorizedCommerce(asin, offer, evidence, NOW);
    assert.equal(result.displayPrice, 100); assert.equal(result.availability, undefined);
  }
});

test('unreviewed, mismatched, stale, revoked and unauthenticated evidence cannot project a price', () => {
  for (const patch of [{ source: 'manual' }, { review: 'pending' }, { lifecycle: 'suppressed' }, { price: 99 }, { market: 'CA' }, { expiresAt: NOW }, { capturedAt: 'invalid' }, { affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=wrong-20` }, { affiliateUrl: `https://www.amazon.com/dp/B000000000?tag=flowhome-20` }]) {
    const { offer, evidence } = make(); Object.assign(offer, patch);
    assert.equal(projectAuthorizedCommerce(asin, offer, evidence, NOW).displayPrice, undefined, JSON.stringify(patch));
  }
  const { offer, evidence } = make();
  assert.equal(projectAuthorizedCommerce('B000000000', offer, evidence, NOW).displayPrice, undefined);
  assert.equal(projectAuthorizedCommerce(asin, offer, undefined, NOW).displayPrice, undefined);
  assert.equal(projectAuthorizedCommerce(asin, offer, evidence, 'invalid').displayPrice, undefined);
  evidence.sourcePermissions[0].state = 'revoked';
  assert.equal(projectAuthorizedCommerce(asin, offer, evidence, NOW).displayPrice, undefined);
});

test('field deadlines remain exclusive and do not extend on projection', () => {
  const { offer, evidence } = make();
  evidence.sourcePermissions[0].validUntil = '2026-07-30T12:02:00Z';
  evidence.sourcePermissions[0].availability.validUntil = '2026-07-30T12:01:00Z';
  const first = projectAuthorizedCommerce(asin, offer, evidence, NOW);
  assert.equal(first.priceExpiresAt, '2026-07-30T12:02:00.000Z');
  assert.equal(first.availabilityExpiresAt, '2026-07-30T12:01:00.000Z');
  const second = projectAuthorizedCommerce(asin, offer, evidence, '2026-07-30T12:01:00Z');
  assert.equal(second.displayPrice, 100); assert.equal(second.availability, undefined);
  assert.equal(projectAuthorizedCommerce(asin, offer, evidence, '2026-07-30T12:02:00Z').displayPrice, undefined);
});

test('the existing static-delivery barrier also suppresses this server projection', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, '__FLOWHOME_STATIC_COMMERCE__');
  try {
    Object.defineProperty(globalThis, '__FLOWHOME_STATIC_COMMERCE__', { configurable: true, value: true });
    const { offer, evidence } = make();
    const result = projectAuthorizedCommerce(asin, offer, evidence, NOW);
    assert.equal(result.displayPrice, undefined);
    assert.equal(result.availability, undefined);
  } finally {
    if (previous) Object.defineProperty(globalThis, '__FLOWHOME_STATIC_COMMERCE__', previous);
    else delete globalThis.__FLOWHOME_STATIC_COMMERCE__;
  }
});
