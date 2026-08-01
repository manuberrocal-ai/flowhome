import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPriceSnapshotFresh,
  isTrendSignalFresh,
  evaluateOfferFreshness,
  isOfferAvailabilityFresh,
  isOfferPromotable,
  confidenceFromFreshness,
} from '../src/lib/blocks/block8/freshness.ts';
import { FRESHNESS_WINDOWS_MS } from '../src/lib/blocks/block8/domain.ts';

const NOW = new Date('2026-07-30T12:00:00Z');
const freshIso = '2026-07-29T12:00:00Z';
const staleIso = new Date(NOW.getTime() - FRESHNESS_WINDOWS_MS.price - 1).toISOString();
const expiredIso = new Date(NOW.getTime() - 1).toISOString();

test('a price snapshot within the price window is fresh', () => {
  const f = isPriceSnapshotFresh({ capturedAt: freshIso }, NOW);
  assert.equal(f.fresh, true);
  assert.equal(f.expired, false);
  assert.equal(f.reason, 'fresh');
});

test('a price snapshot past the price window is stale, not unknown', () => {
  const f = isPriceSnapshotFresh({ capturedAt: staleIso }, NOW);
  assert.equal(f.fresh, false);
  assert.equal(f.expired, false);
  assert.equal(f.reason, 'stale');
});

test('a missing or invalid capturedAt never becomes fresh; it stays unknown_captured_at', () => {
  assert.equal(isPriceSnapshotFresh({ capturedAt: null }, NOW).reason, 'unknown_captured_at');
  assert.equal(isPriceSnapshotFresh({ capturedAt: '2026-07-30' }, NOW).reason, 'unknown_captured_at');
});

test('an offer with expiresAt in the past is expired', () => {
  const f = evaluateOfferFreshness({ capturedAt: freshIso, expiresAt: expiredIso }, NOW);
  assert.equal(f.expired, true);
  assert.equal(f.reason, 'expired');
});

test('a fresh offer within window but past its own expiresAt is expired even if capturedAt is recent', () => {
  const f = evaluateOfferFreshness({ capturedAt: freshIso, expiresAt: '2026-07-15T12:00:00Z' }, NOW);
  assert.equal(f.reason, 'expired');
});

test('trend signals use the longer trend window', () => {
  const recent = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const oldTrend = new Date(NOW.getTime() - FRESHNESS_WINDOWS_MS.trend - 1).toISOString();
  assert.equal(isTrendSignalFresh({ capturedAt: recent }, NOW).reason, 'fresh');
  assert.equal(isTrendSignalFresh({ capturedAt: oldTrend }, NOW).reason, 'stale');
});

test('isOfferPromotable returns true only when fresh, not expired, not suppressed, and not rejected', () => {
  const availability = { availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: 's1' };
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'pending_review', review: 'unknown' }, NOW).promotable, false);
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'active', review: 'approved' }, NOW).promotable, true);
  // suppressed lifecycle never promotable
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'suppressed', review: 'unknown' }, NOW).promotable, false);
  // expired lifecycle never promotable
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'expired', review: 'unknown' }, NOW).promotable, false);
  // unknown lifecycle never promotable
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'unknown', review: 'unknown' }, NOW).promotable, false);
  // review rejected blocks promotion even when fresh
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, ...availability, lifecycle: 'active', review: 'rejected' }, NOW).promotable, false);
  // stale freshness blocks promotion
  assert.equal(isOfferPromotable({ capturedAt: staleIso, expiresAt: null, ...availability, lifecycle: 'active', review: 'approved' }, NOW).promotable, false);
});

test('availability must be in stock and captured within the 24-hour window to promote', () => {
  const staleAvailability = new Date(NOW.getTime() - FRESHNESS_WINDOWS_MS.availability - 1).toISOString();
  assert.equal(isOfferAvailabilityFresh({ availabilityCapturedAt: staleAvailability }, NOW).reason, 'stale');
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: staleAvailability, lastSnapshotId: 's1', lifecycle: 'active', review: 'approved' }, NOW).promotable, false);
  assert.equal(isOfferPromotable({ capturedAt: freshIso, expiresAt: null, availability: 'out-of-stock', availabilityCapturedAt: freshIso, lastSnapshotId: 's1', lifecycle: 'active', review: 'approved' }, NOW).promotable, false);
});

test('an active approved offer without a verified snapshot is never promotable', () => {
  const result = isOfferPromotable({ capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: null, lifecycle: 'active', review: 'approved' }, NOW);
  assert.deepEqual(result, { promotable: false, reason: 'snapshot:missing_verified_snapshot' });
});

test('confidenceFromFreshness degrades gracefull: unknown stays unknown, expired becomes low, stale demotes', () => {
  assert.equal(confidenceFromFreshness({ fresh: false, expired: false, ageMs: NaN, reference: '2026-07-30T12:00:00.000Z', reason: 'unknown_captured_at' }), 'unknown');
  assert.equal(confidenceFromFreshness({ fresh: false, expired: true, ageMs: 0, reference: '2026-07-30T12:00:00.000Z', reason: 'expired' }, 'high'), 'low');
  assert.equal(confidenceFromFreshness({ fresh: false, expired: false, ageMs: 0, reference: '2026-07-30T12:00:00.000Z', reason: 'stale' }, 'high'), 'medium');
  assert.equal(confidenceFromFreshness({ fresh: false, expired: false, ageMs: 0, reference: '2026-07-30T12:00:00.000Z', reason: 'stale' }, 'medium'), 'low');
  assert.equal(confidenceFromFreshness({ fresh: true, expired: false, ageMs: 0, reference: '2026-07-30T12:00:00.000Z', reason: 'fresh' }, 'high'), 'high');
});
