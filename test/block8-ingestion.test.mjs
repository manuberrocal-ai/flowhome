import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  ingestPriceSnapshots,
  ingestOffers,
  ingestTrendSignals,
  buildIdempotencyKey,
  resolveVariant,
  summariseIngestion,
} from '../src/lib/blocks/block8/ingestion.ts';

const NOW = new Date('2026-07-30T12:00:00Z');
const freshIso = '2026-07-29T12:00:00Z';

const baseCtx = () => ({
  knownMerchants: [{ id: 'm1', authorised: true, market: 'US', currency: 'USD' }, { id: 'm_unauth', authorised: false, market: 'US', currency: 'USD' }],
  knownVariants: [{ id: 'v1', marketplaceId: 'B0FIXTURE01', marketplaceIdType: 'asin', market: 'US', currency: 'USD' }],
  existingSnapshotKeys: new Set(),
  existingOfferKeys: new Set(),
  existingTrendKeys: new Set(),
  snapshotsById: new Map([['s1', { id: 's1', variantId: 'v1', merchantId: 'm1', price: 88, anomaly: false }]]),
  historyByVariant: new Map([['v1', [120, 115, 110]]]),
});

// ---------------------------------------------------------------------------
// Idempotency key
// ---------------------------------------------------------------------------

test('buildIdempotencyKey is deterministic for identical inputs', () => {
  const k1 = buildIdempotencyKey('ps', ['v1', 'm1', 88, 'manual', freshIso]);
  const k2 = buildIdempotencyKey('ps', ['v1', 'm1', 88, 'manual', freshIso]);
  assert.equal(k1, k2);
  assert.match(k1, /^ps:[0-9a-f]{8}$/);
  const different = buildIdempotencyKey('ps', ['v1', 'm1', 99, 'manual', freshIso]);
  assert.notEqual(k1, different);
});

// ---------------------------------------------------------------------------
// Snapshot ingestion
// ---------------------------------------------------------------------------

test('ingestPriceSnapshots inserts a good authorized snapshot and computes anomaly', () => {
  const ctx = baseCtx();
  const r = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso }], ctx, NOW);
  assert.equal(r[0].status, 'inserted');
  assert.equal(r[0].entity.anomaly, false);
  assert.equal(r[0].entity.variantId, 'v1');
});

test('ingestPriceSnapshots dedupes snaps with same idempotency key across runs', () => {
  const ctx = baseCtx();
  const first = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso }], ctx, NOW);
  const ctx2 = { ...ctx, existingSnapshotKeys: new Set([first[0].idempotencyKey]) };
  const second = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso }], ctx2, NOW);
  assert.equal(second[0].status, 'duplicate');
  assert.equal(second[0].entity, null);
});

test('ingestion derives canonical keys and dedupes repeated snapshots, offers, and trends within one batch', () => {
  const snapshot = { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, idempotencyKey: 'caller-key-a' };
  const snapshots = ingestPriceSnapshots([snapshot, { ...snapshot, idempotencyKey: 'caller-key-b' }], baseCtx(), NOW);
  assert.deepEqual(snapshots.map((result) => result.status), ['inserted', 'duplicate']);
  assert.notEqual(snapshots[0].idempotencyKey, 'caller-key-a');

  const offer = { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availabilityCapturedAt: freshIso, snapshotId: 's1' };
  assert.deepEqual(ingestOffers([offer, { ...offer }], baseCtx(), NOW).map((result) => result.status), ['inserted', 'duplicate']);

  const trend = { topicId: 't1', source: 'manual', delta: 0.2, weight: 0.9, capturedAt: freshIso, idempotencyKey: 'caller-key-a' };
  const trends = ingestTrendSignals([trend, { ...trend, idempotencyKey: 'caller-key-b' }], baseCtx(), NOW);
  assert.deepEqual(trends.map((result) => result.status), ['inserted', 'duplicate']);
  assert.notEqual(trends[0].idempotencyKey, 'caller-key-a');
});

test('anomaly snapshot is inserted and flagged (kept for audit) — never dropped silently', () => {
  const ctx = baseCtx();
  // history includes clustered 110..120 -> small MAD; 50 is well below threshold
  const r = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 50, source: 'manual', capturedAt: freshIso }], ctx, NOW);
  assert.equal(r[0].status, 'inserted');
  assert.equal(r[0].entity.anomaly, true);
  assert.match(r[0].reason, /anomaly/);
});

test('unauthorised merchant rows are rejected (no promotion of fake offers)', () => {
  const ctx = baseCtx();
  const r = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm_unauth', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso }], ctx, NOW);
  assert.equal(r[0].status, 'rejected');
  assert.equal(r[0].reason, 'merchant_not_authorised');
});

test('non-strict-UTC capturedAt is rejected', () => {
  const ctx = baseCtx();
  const r = ingestPriceSnapshots([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: '2026-07-30' }], ctx, NOW);
  assert.equal(r[0].status, 'rejected');
  assert.equal(r[0].reason, 'invalid_captured_at');
});

test('ingestPriceSnapshots rejects unknown variants and incoherent market, currency, or source', () => {
  const base = { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso };
  const results = ingestPriceSnapshots([
    { ...base, variantId: 'unknown' },
    { ...base, market: 'CA' },
    { ...base, currency: 'CAD' },
    { ...base, source: 'scraped' },
  ], baseCtx(), NOW);
  assert.deepEqual(results.map((result) => result.reason), [
    'unknown_variant',
    'market_mismatch',
    'currency_mismatch',
    'invalid_offer_source',
  ]);
  assert.ok(results.every((result) => result.status === 'rejected' && result.entity === null));
});

// ---------------------------------------------------------------------------
// Partial-failure isolation
// ---------------------------------------------------------------------------

test('good, rejected, duplicate, and anomalous rows in one batch return independent outcomes', () => {
  const ctx = baseCtx();
  const inputs = [
    { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso },
    { variantId: 'v1', merchantId: 'm_unauth', market: 'US', currency: 'USD', price: 12, source: 'manual', capturedAt: freshIso },
    { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 51, source: 'manual', capturedAt: '2026-07-30' },
    { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 50, source: 'manual', capturedAt: freshIso },
  ];
  const r = ingestPriceSnapshots(inputs, ctx, NOW);
  assert.equal(r[0].status, 'inserted');
  assert.equal(r[0].entity.anomaly, false);
  assert.equal(r[0].reason, 'snapshot_accepted');
  assert.equal(r[1].status, 'rejected');
  assert.equal(r[1].reason, 'merchant_not_authorised');
  assert.equal(r[2].status, 'rejected');
  assert.equal(r[2].reason, 'invalid_captured_at');
  assert.equal(r[3].status, 'inserted');
  assert.equal(r[3].entity.anomaly, true);
  assert.match(r[3].reason, /anomaly/);
  const s = summariseIngestion(r);
  assert.equal(s.total, 4);
  assert.equal(s.inserted, 2);
  assert.equal(s.rejected, 2);
  assert.equal(s.anomalyKept, 1);

});

// ---------------------------------------------------------------------------
// Offer ingestion
// ---------------------------------------------------------------------------

test('a fresh offer enters pending_review and a stale offer enters suppressed', () => {
  const ctx = baseCtx();
  const fresh = ingestOffers([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availability: 'in-stock', availabilityCapturedAt: freshIso, shipping: { freeShipping: true }, expiresAt: '2026-08-06T12:00:00Z', snapshotId: 's1' }], ctx, NOW);
  assert.equal(fresh[0].status, 'inserted');
  assert.equal(fresh[0].entity.lifecycle, 'pending_review');
  assert.equal(fresh[0].entity.review, 'unknown');
  const stale = ingestOffers([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: '2026-04-01T12:00:00Z', availability: 'in-stock', availabilityCapturedAt: freshIso, shipping: { freeShipping: true }, snapshotId: 's1' }], ctx, NOW);
  assert.equal(stale[0].status, 'inserted');
  assert.equal(stale[0].entity.lifecycle, 'suppressed');
  assert.match(stale[0].reason, /freshness/);
});

test('offer dedupe by idempotency key works across batches', () => {
  const ctx = baseCtx();
  const first = ingestOffers([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availabilityCapturedAt: freshIso, expiresAt: '2026-08-06T12:00:00Z', snapshotId: 's1' }], ctx, NOW);
  const ctx2 = { ...ctx, existingOfferKeys: new Set([first[0].idempotencyKey]) };
  const second = ingestOffers([{ variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availabilityCapturedAt: freshIso, expiresAt: '2026-08-06T12:00:00Z', snapshotId: 's1' }], ctx2, NOW);
  assert.equal(second[0].status, 'duplicate');
});

test('offer ingestion requires an existing authorised, non-anomalous coherent snapshot', () => {
  const offer = { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availabilityCapturedAt: freshIso };
  const ctx = baseCtx();
  const results = ingestOffers([
    offer,
    { ...offer, snapshotId: 'missing' },
    { ...offer, snapshotId: 's1', price: 89 },
  ], ctx, NOW);
  assert.deepEqual(results.map((result) => result.reason), ['missing_authorised_snapshot', 'unknown_snapshot', 'snapshot_incoherent']);

  const anomalous = { ...ctx, snapshotsById: new Map([['bad', { id: 'bad', variantId: 'v1', merchantId: 'm1', price: 88, anomaly: true }]]) };
  assert.equal(ingestOffers([{ ...offer, snapshotId: 'bad' }], anomalous, NOW)[0].reason, 'snapshot_anomalous');
});

test('offer ingestion rejects non-canonical or incoherent source, market, currency, and variant inputs', () => {
  const base = { variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso, availabilityCapturedAt: freshIso };
  const results = ingestOffers([
    { ...base, source: 'scraped' },
    { ...base, market: 'ZZ' },
    { ...base, currency: 'AUD' },
    { ...base, market: 'CA' },
    { ...base, currency: 'CAD' },
    { ...base, variantId: 'unknown' },
  ], baseCtx(), NOW);
  assert.deepEqual(results.map((result) => result.reason), [
    'invalid_offer_source',
    'invalid_market',
    'invalid_currency',
    'market_mismatch',
    'currency_mismatch',
    'unknown_variant',
  ]);
  assert.ok(results.every((result) => result.status === 'rejected' && result.entity === null));
});

test('offer ingestion requires an exact availability capture instant', () => {
  const result = ingestOffers([{
    variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', price: 88, source: 'manual', capturedAt: freshIso,
    availability: 'in-stock', availabilityCapturedAt: '2026-07-29',
  }], baseCtx(), NOW);
  assert.equal(result[0].reason, 'invalid_availability_captured_at');
});

// ---------------------------------------------------------------------------
// Trend signal ingestion
// ---------------------------------------------------------------------------

test('trend signal delta in range is accepted and out-of-range anomaly is flagged', () => {
  const ctx = baseCtx();
  const ok = ingestTrendSignals([{ topicId: 't1', source: 'manual', delta: 0.2, weight: 0.9, capturedAt: freshIso }], ctx, NOW);
  assert.equal(ok[0].status, 'inserted');
  assert.equal(ok[0].entity.anomaly, false);
  const oob = ingestTrendSignals([{ topicId: 't1', source: 'manual', delta: 5, weight: 0.3, capturedAt: freshIso }], ctx, NOW);
  assert.equal(oob[0].status, 'inserted');
  assert.equal(oob[0].entity.anomaly, true);
  assert.equal(oob[0].entity.delta, 1);
});

test('trend dedupe by idempotency key works across batches', () => {
  const ctx = baseCtx();
  const first = ingestTrendSignals([{ topicId: 't1', source: 'manual', delta: 0.2, weight: 0.9, capturedAt: freshIso }], ctx, NOW);
  const ctx2 = { ...ctx, existingTrendKeys: new Set([first[0].idempotencyKey]) };
  const second = ingestTrendSignals([{ topicId: 't1', source: 'manual', delta: 0.2, weight: 0.9, capturedAt: freshIso }], ctx2, NOW);
  assert.equal(second[0].status, 'duplicate');
});

// ---------------------------------------------------------------------------
// Variant resolution
// ---------------------------------------------------------------------------

test('resolveVariant matches only by authorised marketplace id and type; fuzzy name is forbidden', () => {
  const known = [{ id: 'v1', marketplaceId: 'B0AAA00000', marketplaceIdType: 'asin', market: 'US', currency: 'USD' }];
  assert.deepEqual(resolveVariant(known, 'B0AAA00000', 'asin'), { variantId: 'v1', reason: 'resolved' });
  assert.deepEqual(resolveVariant(known, 'B0BBB00000', 'asin'), { variantId: null, reason: 'unmatched' });
  assert.deepEqual(resolveVariant(known, null, 'asin'), { variantId: null, reason: 'no_marketplace_id' });
  assert.deepEqual(resolveVariant(known, 'B0AAA00000', 'unknown'), { variantId: null, reason: 'unknown_type' });
});

// ---------------------------------------------------------------------------
// Fixtures integrity
// ---------------------------------------------------------------------------

test('fixtures.json loads as valid JSON with the documented shape (no production data)', async () => {
  const raw = await readFile(new URL('../data/blocks/block8/fixtures.json', import.meta.url), 'utf8');
  const fixtures = JSON.parse(raw);
  assert.equal(fixtures._meta.purpose.includes('NOT production data'), true);
  assert.equal(fixtures.merchants.length, 2);
  assert.equal(fixtures.variants.length, 3);
  assert.equal(fixtures.snapshots.length, 4);
  assert.equal(fixtures.offers.length, 5);
  assert.equal(fixtures.trendSignals.length, 4);
});
