import assert from 'node:assert/strict';
import test from 'node:test';
import { COMMERCIAL_DATA_POLICY } from '../src/lib/commercial-policy.ts';
import { COMMERCE_FRESHNESS, getCommerceData } from '../src/lib/commerce-data.ts';
import { FRESHNESS_WINDOWS_MS } from '../src/lib/blocks/block8/domain.ts';
import { evaluateOfferFreshness, isOfferAvailabilityFresh, isOfferPromotable, isPriceSnapshotFresh } from '../src/lib/blocks/block8/freshness.ts';
import { sourcePermissionFor } from '../src/lib/blocks/block8/evidence.ts';
import { OPERATIONAL_CONTRACTS, PROVISIONAL_THRESHOLDS } from '../src/lib/blocks/block12/contracts.ts';
import { CAPTURED, offerFixture, evidenceFixture } from './helpers/block8-fixtures.mjs';

const DAY = 86_400_000;
const atAge = (ms) => new Date(Date.parse(CAPTURED) + ms);
// Synthetic observations only. These labels are not evidence of live API access.
const product = (overrides = {}) => ({
  asin: 'B012345678', affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20',
  price: 100, priceSource: 'amazon-creators-api', priceLastChecked: CAPTURED,
  availabilityStatus: 'in-stock', availabilitySource: 'amazon-creators-api', availabilityLastChecked: CAPTURED,
  ownerRating: 4.7, ownerRatingCount: 100, ratingSource: 'amazon-creators-api', ratingLastChecked: CAPTURED,
  ...overrides,
});

test('commercial ceilings are immutable and identical across UI, Block8 and Block12', () => {
  assert.deepEqual(COMMERCIAL_DATA_POLICY, { priceMs: DAY, availabilityMs: DAY, ratingMs: DAY, defaultHistoryRetentionMs: 0 });
  for (const object of [COMMERCIAL_DATA_POLICY, COMMERCE_FRESHNESS, FRESHNESS_WINDOWS_MS, PROVISIONAL_THRESHOLDS]) assert.equal(Object.isFrozen(object), true);
  assert.deepEqual(COMMERCE_FRESHNESS, { priceMs: DAY, availabilityMs: DAY, ratingMs: DAY });
  assert.equal(FRESHNESS_WINDOWS_MS.price, DAY);
  assert.equal(FRESHNESS_WINDOWS_MS.availability, DAY);
  assert.equal(FRESHNESS_WINDOWS_MS.history, 0);
  assert.equal(PROVISIONAL_THRESHOLDS.freshnessPriceHours, 24);
  assert.equal(PROVISIONAL_THRESHOLDS.freshnessAvailabilityHours, 24);
  assert.equal(PROVISIONAL_THRESHOLDS.historyRetentionDefaultMs, 0);
  assert.equal('freshnessPriceDays' in PROVISIONAL_THRESHOLDS, false);
  assert.equal('freshnessHistoryDays' in PROVISIONAL_THRESHOLDS, false);
  assert.equal(PROVISIONAL_THRESHOLDS.freshnessTrendDays * DAY, FRESHNESS_WINDOWS_MS.trend);
  const expiryContract = OPERATIONAL_CONTRACTS.find(({ domain }) => domain === 'expired_offers');
  assert.match(expiryContract.slo.target, /price age <24h and availability age <24h, narrowed by source permission and expiry/);
  assert.equal(expiryContract.slo.observed, false, 'local contract is not a running monitor');
});

test('the same observation passes before 24h and fails at, after and seven days later across layers', () => {
  const offer = offerFixture({ source: 'amazon-creators-api' });
  const evidence = evidenceFixture(offer);
  for (const [age, expected] of [[DAY - 1, true], [DAY, false], [DAY + 1, false], [7 * DAY, false]]) {
    const now = atAge(age);
    assert.equal(isPriceSnapshotFresh(offer, now).fresh, expected, `snapshot: ${age}`);
    assert.equal(evaluateOfferFreshness(offer, now).fresh, expected, `offer: ${age}`);
    assert.equal(isOfferAvailabilityFresh(offer, now).fresh, expected, `availability: ${age}`);
    assert.equal(isOfferPromotable(offer, now, evidence).promotable, expected, `promotion: ${age}`);
    const commerce = getCommerceData(product(), now);
    assert.equal(commerce.isPriceFresh, expected, `public price: ${age}`);
    assert.equal(commerce.isAvailabilityFresh, expected, `public availability: ${age}`);
    assert.equal(commerce.isRatingFresh, expected, `public rating: ${age}`);
    assert.equal(commerce.displayPrice, expected ? 100 : undefined);
    for (const field of ['priceExpiresAt', 'availabilityExpiresAt', 'ratingExpiresAt']) {
      assert.equal(commerce[field], expected ? atAge(DAY).toISOString() : undefined, `${field}: ${age}`);
    }
  }
});

test('missing, invalid and future commercial captures stay unknown across layers', () => {
  const now = atAge(1_000);
  for (const capture of [undefined, '', '2026-02-30T11:00:00Z', '2026-07-30', atAge(1_001).toISOString()]) {
    assert.equal(isPriceSnapshotFresh({ capturedAt: capture }, now).fresh, false);
    assert.equal(isOfferAvailabilityFresh({ availabilityCapturedAt: capture }, now).fresh, false);
    const commerce = getCommerceData(product({ priceLastChecked: capture, availabilityLastChecked: capture, ratingLastChecked: capture }), now);
    assert.equal(commerce.displayPrice, undefined);
    assert.equal(commerce.availability, undefined);
    assert.equal(commerce.displayRating, undefined);
  }
});

test('earlier expiry cuts off UI and Block8 at the same instant without a grace period', () => {
  const expiry = atAge(3_600_000).toISOString();
  const offer = offerFixture({ expiresAt: expiry });
  const publicProduct = product({ priceValidUntil: expiry, availabilityValidUntil: expiry, ratingValidUntil: expiry });
  for (const [age, expected] of [[3_599_999, true], [3_600_000, false], [3_600_001, false]]) {
    assert.equal(evaluateOfferFreshness(offer, atAge(age)).fresh, expected);
    const commerce = getCommerceData(publicProduct, atAge(age));
    assert.equal(commerce.isPriceFresh, expected);
    assert.equal(commerce.isAvailabilityFresh, expected);
    assert.equal(commerce.isRatingFresh, expected);
  }
});

test('reviewed permissions narrow current offers and revocation or excessive TTL rejects promotion', () => {
  const offer = offerFixture();
  const evidence = evidenceFixture(offer);
  const grant = evidence.sourcePermissions[0];
  grant.maxAgeMs = 3_600_000;
  assert.equal(isOfferPromotable(offer, atAge(3_599_999), evidence).promotable, true);
  assert.equal(isOfferPromotable(offer, atAge(3_600_000), evidence).promotable, false);
  grant.maxAgeMs = DAY;
  grant.validUntil = atAge(3_600_000).toISOString();
  assert.equal(isOfferPromotable(offer, atAge(3_600_000), evidence).promotable, false);
  grant.state = 'revoked';
  assert.equal(isOfferPromotable(offer, atAge(1_000), evidence).promotable, false);
  grant.state = 'approved';
  grant.maxAgeMs = 7 * DAY;
  assert.equal(isOfferPromotable(offer, atAge(1_000), evidence).promotable, false);
});

test('history needs a distinct grant and cannot extend Amazon cache rights to 90 days', () => {
  const offer = offerFixture({ source: 'amazon-creators-api' });
  const evidence = evidenceFixture(offer);
  const grant = evidence.sourcePermissions[0];
  const history = { ...grant.history, retainForMs: DAY };
  delete grant.history;
  assert.equal(sourcePermissionFor(offer, evidence, atAge(1_000), true), null);
  grant.history = { ...history, permissionId: grant.permissionId };
  assert.equal(sourcePermissionFor(offer, evidence, atAge(1_000), true), null);
  grant.history = history;
  assert.equal(sourcePermissionFor(offer, evidence, atAge(DAY - 1), true), grant);
  assert.equal(sourcePermissionFor(offer, evidence, atAge(DAY), true), null);
  grant.history = { ...history, retainForMs: 90 * DAY };
  assert.equal(sourcePermissionFor(offer, evidence, atAge(1_000), true), null);
  // A different synthetic source can have separate history rights. Its current
  // prices still expire at 24h; this does not authorize any real source/storage.
  offer.source = grant.source = 'affiliate-feed';
  assert.equal(sourcePermissionFor(offer, evidence, atAge(7 * DAY), true), grant);
  assert.equal(sourcePermissionFor(offer, evidence, atAge(7 * DAY)), null);
  assert.equal(sourcePermissionFor(offer, evidence, atAge(90 * DAY), true), null);
});
