import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeDealScore,
  computeTrendScore,
  DEAL_SCORE_WEIGHTS,
  MIN_HISTORY_FOR_FLOOR_CLAIM,
  TREND_SCORE_THRESHOLDS,
} from '../src/lib/blocks/block8/scoring.ts';

const NOW = new Date('2026-07-30T12:00:00Z');
const freshIso = '2026-07-29T12:00:00Z';
const staleIso = '2026-06-01T12:00:00Z';
const BACKING_SNAPSHOT = 's1';

const goodHistory = [
  { price: 120, anomaly: false, capturedAt: '2026-06-30T12:00:00Z' },
  { price: 115, anomaly: false, capturedAt: '2026-07-15T12:00:00Z' },
  { price: 110, anomaly: false, capturedAt: '2026-07-24T12:00:00Z' },
];

// ---------------------------------------------------------------------------
// DealScore determinism
// ---------------------------------------------------------------------------

test('DealScore is deterministic: same inputs produce the same breakdown', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  const a = computeDealScore({ offer, history: goodHistory, now: NOW });
  const b = computeDealScore({ offer, history: goodHistory, now: NOW });
  assert.deepEqual(a, b);
});

test('DealScore with 3 good snapshots and a fresh offer labels lowest_price with floor verified', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  const score = computeDealScore({ offer, history: goodHistory, now: NOW });
  assert.equal(score.label, 'lowest_price');
  assert.equal(score.verified, true);
  assert.equal(score.confidence, 'high');
  assert.match(score.floorClaim, /Lowest authorised price verified/);
});

test('DealScore collapses to unknown with no authorised history (never a claim without proof)', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  const score = computeDealScore({ offer, history: [], now: NOW });
  assert.equal(score.label, 'unknown');
  assert.equal(score.verified, false);
  assert.match(score.floorClaim, /No claim/);
});

test('DealScore collapses to unknown with fewer than MIN_HISTORY_FOR_FLOOR_CLAIM snapshots', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  for (const n of [0, 1, MIN_HISTORY_FOR_FLOOR_CLAIM - 1]) {
    const score = computeDealScore({ offer, history: goodHistory.slice(0, n), now: NOW });
    assert.equal(score.label, 'unknown', `history length ${n}`);
    assert.equal(score.verified, false);
  }
});

test('DealScore never labels lowest_price for a stale or expired offer even with full history', () => {
  for (const capturedAt of [staleIso, freshIso]) {
    const expiresAtDiff = capturedAt === staleIso ? null : '2026-07-15T12:00:00Z';
    const offer = { price: 100, listPrice: 140, capturedAt, expiresAt: expiresAtDiff, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
    const score = computeDealScore({ offer, history: goodHistory, now: NOW });
    assert.equal(score.label, 'unknown');
    assert.equal(score.verified, false);
  }
});

test('DealScore downgrades to good_deal when discount exists but price is above the historical floor', () => {
  const offer = { price: 112, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { cost: null, freeShipping: true, conditions: null, etaDays: null }, coupons: [] };
  const score = computeDealScore({ offer, history: goodHistory, now: NOW });
  assert.equal(score.label, 'good_deal');
  assert.equal(score.verified, true);
});

test('DealScore shipping penalty reduces total when non-free shipping is documented', () => {
  const free = computeDealScore({ offer: { price: 112, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true, cost: null }, coupons: [] }, history: goodHistory, now: NOW });
  const paid = computeDealScore({ offer: { price: 112, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: false, cost: 25 }, coupons: [] }, history: goodHistory, now: NOW });
  assert.ok(paid.total < free.total);
});

test('DealScore factors include the canonical keys and weights documented in the contract', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  const score = computeDealScore({ offer, history: goodHistory, now: NOW });
  const keys = score.factors.map((f) => f.key);
  for (const k of ['discount_vs_list', 'discount_vs_floor', 'shipping', 'coupon_uplift']) {
    assert.ok(keys.includes(k), `expected factor ${k}`);
  }
  const w = score.factors.reduce((sum, f) => sum + f.weight, 0);
  const expected = DEAL_SCORE_WEIGHTS.discountVsList + DEAL_SCORE_WEIGHTS.discountVsFloor + DEAL_SCORE_WEIGHTS.shippingPenalty + DEAL_SCORE_WEIGHTS.couponUplift;
  assert.ok(Math.abs(w - expected) < 1e-9);
});

test('DealScore excludes expired and conditionally ineligible coupons from uplift', () => {
  const base = { price: 112, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true, cost: null } };
  const withoutCoupons = computeDealScore({ offer: { ...base, coupons: [] }, history: goodHistory, now: NOW });
  const withExpiredOrIneligible = computeDealScore({
    offer: {
      ...base,
      coupons: [
        { id: 'expired', code: 'OLD10', amountOff: null, pctOff: 10, minSubtotal: null, conditions: null, conditionsSatisfied: true, expiresAt: '2026-07-30T12:00:00Z' },
        { id: 'conditional', code: 'MEMBER10', amountOff: null, pctOff: 10, minSubtotal: null, conditions: 'Member only', conditionsSatisfied: false, expiresAt: '2026-08-01T12:00:00Z' },
      ],
    },
    history: goodHistory,
    now: NOW,
  });
  assert.equal(withExpiredOrIneligible.total, withoutCoupons.total);
  assert.equal(withExpiredOrIneligible.factors.find((factor) => factor.key === 'coupon_uplift').value, 0);
});

test('DealScore never verifies or labels a pending or unapproved offer', () => {
  for (const state of [
    { lifecycle: 'pending_review', review: 'approved' },
    { lifecycle: 'active', review: 'unknown' },
  ]) {
    const score = computeDealScore({
      offer: { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, ...state, shipping: { freeShipping: true }, coupons: [] },
      history: goodHistory,
      now: NOW,
    });
    assert.equal(score.label, 'unknown');
    assert.equal(score.verified, false);
  }
});

// ---------------------------------------------------------------------------
// TrendScore determinism
// ---------------------------------------------------------------------------

test('TrendScore is deterministic: same inputs same breakdown', () => {
  const signals = [
    { delta: 0.2, weight: 0.9, anomaly: false, capturedAt: freshIso },
    { delta: 0.15, weight: 0.7, anomaly: false, capturedAt: '2026-07-28T12:00:00Z' },
  ];
  const a = computeTrendScore({ signals, now: NOW });
  const b = computeTrendScore({ signals, now: NOW });
  assert.deepEqual(a, b);
});

test('TrendScore labels rising when weighted centroid is positive and at least 2 signals exist', () => {
  const signals = [
    { delta: 0.2, weight: 0.9, anomaly: false, capturedAt: freshIso },
    { delta: 0.15, weight: 0.7, anomaly: false, capturedAt: '2026-07-28T12:00:00Z' },
  ];
  const score = computeTrendScore({ signals, now: NOW });
  assert.equal(score.label, 'rising');
  assert.equal(score.verified, true);
  assert.equal(score.confidence, 'medium');
});

test('TrendScore stays unknown with fewer than 2 authorised signals', () => {
  const signals = [{ delta: 0.5, weight: 1, anomaly: false, capturedAt: freshIso }];
  const score = computeTrendScore({ signals, now: NOW });
  assert.equal(score.label, 'unknown');
  assert.equal(score.verified, false);
});

test('TrendScore stays stable when signals cancel to within the noise band', () => {
  const signals = [
    { delta: 0.01, weight: 0.5, anomaly: false, capturedAt: freshIso },
    { delta: -0.01, weight: 0.5, anomaly: false, capturedAt: '2026-07-28T12:00:00Z' },
  ];
  const score = computeTrendScore({ signals, now: NOW });
  assert.equal(score.label, 'stable');
  assert.equal(score.verified, true);
  assert.ok(Math.abs(score.total) < TREND_SCORE_THRESHOLDS.minAbsDeltaForDirection);
});

test('TrendScore zeroes anomalous signals in scoring but keeps their audit entry', () => {
  const signals = [
    { delta: 0.2, weight: 0.9, anomaly: false, capturedAt: freshIso },
    { delta: 0.18, weight: 0.7, anomaly: false, capturedAt: '2026-07-28T12:00:00Z' },
    { delta: 5, weight: 0.4, anomaly: true, capturedAt: '2026-07-29T12:00:00Z' },
  ];
  const score = computeTrendScore({ signals, now: NOW });
  const anomFactor = score.factors.find((f) => f.key === 'trend_signal_anomaly');
  assert.ok(anomFactor);
  assert.equal(anomFactor.contribution, 0);
  assert.equal(score.label, 'rising');
});

test('TrendScore ignores signals older than the trend window', () => {
  const staleIso = new Date(NOW.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const signals = [
    { delta: 0.5, weight: 0.9, anomaly: false, capturedAt: staleIso },
    { delta: 0.5, weight: 0.7, anomaly: false, capturedAt: new Date(NOW.getTime() - 16 * 24 * 60 * 60 * 1000).toISOString() },
  ];
  const score = computeTrendScore({ signals, now: NOW });
  assert.equal(score.verified, false);
  assert.equal(score.label, 'unknown');
});

test('scoring excludes non-strict UTC history and trend signal timestamps', () => {
  const offer = { price: 100, listPrice: 140, capturedAt: freshIso, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: freshIso, lastSnapshotId: BACKING_SNAPSHOT, lifecycle: 'active', review: 'approved', shipping: { freeShipping: true }, coupons: [] };
  const history = goodHistory.map((snapshot, index) => ({ ...snapshot, capturedAt: index === 0 ? '2026-07-29' : '2026-07-29T12:00:00+00:00' }));
  assert.equal(computeDealScore({ offer, history, now: NOW }).label, 'unknown');

  const signals = [
    { delta: 0.2, weight: 0.9, anomaly: false, capturedAt: '2026-07-29' },
    { delta: 0.15, weight: 0.7, anomaly: false, capturedAt: '2026-07-29T12:00:00+00:00' },
  ];
  assert.equal(computeTrendScore({ signals, now: NOW }).label, 'unknown');
});
