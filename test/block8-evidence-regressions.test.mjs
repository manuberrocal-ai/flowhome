import assert from 'node:assert/strict';
import test from 'node:test';
import { ingestOffers, ingestPriceSnapshots, ingestTrendSignals, resolveVariant } from '../src/lib/blocks/block8/ingestion.ts';
import { buildIdempotencyKey, canonicalContent } from '../src/lib/blocks/block8/idempotency.ts';
import { isOfferPromotable, isPriceSnapshotFresh, evaluateOfferFreshness } from '../src/lib/blocks/block8/freshness.ts';
import { computeDealScore, computeTrendScore } from '../src/lib/blocks/block8/scoring.ts';
import { applyOverride, buildAuditId } from '../src/lib/blocks/block8/admin.ts';
import { toStrictUtc, nowUtc } from '../src/lib/blocks/block8/domain.ts';
import { NOW, CAPTURED, offerFixture, snapshotFixture, evidenceFixture } from './helpers/block8-fixtures.mjs';

const historyFixture = () => [120, 115, 110].map((price, index) => snapshotFixture({ id: `h:${index}`, idempotencyKey: `fixture:h:${index}`, price, capturedAt: `2026-07-2${index}T12:00:00Z` }));
const ingestionContext = (evidence) => ({ ...evidence, existingSnapshotKeys: new Set(), existingOfferKeys: new Set(), existingTrendKeys: new Set(), historyByVariant: new Map() });
const ingestInput = (offer) => ({ ...offer, snapshotId: offer.lastSnapshotId });
const overrideInput = (now = NOW) => ({ targetId: 'o1', targetType: 'offer', action: 'override_promote', actorId: 'fixture-reviewer', note: null, now });

function assertBlocked(offer, evidence, message = '', now = NOW) {
  assert.equal(ingestOffers([ingestInput(offer)], ingestionContext(evidence), now)[0].status, 'rejected', message);
  assert.equal(isOfferPromotable(offer, now, evidence).promotable, false, message);
  assert.equal(applyOverride(overrideInput(now), offer, evidence).changed, false, message);
  const score = computeDealScore({ offer, evidence, history: historyFixture(), now });
  assert.equal(score.verified, false, message);
  assert.equal(score.label, 'unknown', message);
  assert.equal(score.confidence, 'unknown', message);
}

test('B8-01 authorised linked observation passes ingestion, review, promotion and scoring', () => {
  const offer = offerFixture(); const history = historyFixture(); const evidence = evidenceFixture(offer, history);
  const ingested = ingestOffers([ingestInput(offer)], ingestionContext(evidence), NOW)[0];
  assert.equal(ingested.status, 'inserted');
  assert.equal(ingested.entity.lifecycle, 'pending_review');
  assert.equal(ingested.entity.expiresAt, '2026-07-31T11:00:00.000Z');
  assert.equal(isOfferPromotable(ingested.entity, NOW, evidence).promotable, false);
  assert.equal(applyOverride({ ...overrideInput(), targetId: ingested.entity.id }, ingested.entity, evidence).outcome, 'applied');
  assert.equal(isOfferPromotable(offer, NOW, evidence).promotable, true);
  const score = computeDealScore({ offer, history, evidence, now: NOW });
  assert.equal(score.label, 'lowest_price'); assert.equal(score.verified, true); assert.equal(score.confidence, 'high');
});

test('B8-01 old/manual, mismatched, future, anomalous and unresolved backing snapshots cannot be renewed', () => {
  const offer = offerFixture({ source: 'amazon-creators-api', expiresAt: '2026-07-30T13:00:00Z' });
  for (const patch of [
    { source: 'manual', capturedAt: '2020-01-01T00:00:00Z' }, { source: 'Unknown' },
    { capturedAt: '2026-07-30T12:00:01Z' }, { capturedAt: '2026-02-30T11:00:00Z' },
    { capturedAt: '2026-07-29T11:00:00Z' }, { variantId: 'other' }, { merchantId: 'other' },
    { market: 'CA' }, { currency: 'CAD' }, { price: 99 }, { listPrice: 999 }, { anomaly: true }, { id: 'not-s1' },
  ]) {
    const evidence = evidenceFixture(offer);
    evidence.snapshotsById.set('s1', { ...evidence.snapshotsById.get('s1'), ...patch });
    assertBlocked(offer, evidence, JSON.stringify(patch));
  }
  const absent = evidenceFixture(offer); absent.snapshotsById.clear(); assertBlocked(offer, absent);
  assert.equal(isOfferPromotable(offer, NOW).promotable, false);
  assert.equal(applyOverride(overrideInput(), offer).changed, false);
  assert.equal(computeDealScore({ offer, history: historyFixture(), now: NOW }).verified, false);
});

test('B8-01 manual/unknown data and missing, revoked, expired or ambiguous permissions never become current', () => {
  for (const source of ['manual', 'Unknown']) {
    const offer = offerFixture({ source }); assertBlocked(offer, evidenceFixture(offer), source);
  }
  const offer = offerFixture();
  for (const patch of [{ state: 'revoked' }, { state: 'unknown' }, { currentPriceAllowed: false }, { currentPriceAllowed: 'true' }, { permissionId: '' }, { validUntil: NOW }, { validFrom: NOW }, { maxAgeMs: 86_400_001 }, { market: 'CA' }, { currency: 'CAD' }, { source: 'manual' }]) {
    const evidence = evidenceFixture(offer); evidence.sourcePermissions[0] = { ...evidence.sourcePermissions[0], ...patch }; assertBlocked(offer, evidence, JSON.stringify(patch));
  }
  for (const mode of ['missing', 'duplicate', 'merchant']) {
    const evidence = evidenceFixture(offer);
    if (mode === 'missing') delete evidence.sourcePermissions;
    if (mode === 'duplicate') evidence.sourcePermissions.push({ ...evidence.sourcePermissions[0] });
    if (mode === 'merchant') evidence.knownMerchants[0].authorised = 'true';
    assertBlocked(offer, evidence, mode);
  }
});

test('B8-01 promotion revalidates after source revocation, evidence removal and target mismatch', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  assert.equal(applyOverride(overrideInput(), offer, evidence).changed, true);
  evidence.sourcePermissions[0].state = 'revoked';
  assert.equal(applyOverride(overrideInput(), offer, evidence).changed, false);
  evidence.sourcePermissions[0].state = 'approved'; evidence.snapshotsById.clear();
  assert.equal(applyOverride(overrideInput(), offer, evidence).changed, false);
  assert.equal(applyOverride({ ...overrideInput(), targetId: 'other' }, offer, evidenceFixture(offer)).changed, false);
  assert.equal(applyOverride(overrideInput(), { ...offer, lifecycle: 'expired' }, evidenceFixture(offer)).changed, false);
});

test('B8-02 malformed, inverted, excessive and elapsed expiry fails all commercial gates', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  for (const expiresAt of ['', 'not-a-date', '2026-02-30T12:00:00Z', CAPTURED, '2026-07-30T10:00:00Z', '2026-07-31T11:00:00.001Z', NOW]) assertBlocked({ ...offer, expiresAt }, evidence, expiresAt);
  assert.equal(evaluateOfferFreshness({ capturedAt: CAPTURED, expiresAt: null }, NOW).fresh, true);
  assert.equal(evaluateOfferFreshness({ capturedAt: CAPTURED, expiresAt: '2026-07-30T12:00:00.001Z' }, NOW).fresh, true);
  const narrowed = evidenceFixture(offer); narrowed.sourcePermissions[0].maxAgeMs = 2 * 3_600_000;
  assertBlocked({ ...offer, expiresAt: '2026-07-30T14:00:00Z' }, narrowed);
  assert.equal(ingestOffers([ingestInput(offer)], ingestionContext(narrowed), NOW)[0].entity.expiresAt, '2026-07-30T13:00:00.000Z');
});

test('B8-03 historical floor permission is separate, source-specific and unknown by default', () => {
  const offer = offerFixture(); const history = historyFixture();
  for (const mode of ['missing', 'false', 'same-permission', 'zero-retention', 'expired-retention']) {
    const evidence = evidenceFixture(offer, history); const grant = evidence.sourcePermissions[0];
    if (mode === 'missing') delete grant.history;
    if (mode === 'false') grant.history.floorClaimsAllowed = false;
    if (mode === 'same-permission') grant.history.permissionId = grant.permissionId;
    if (mode === 'zero-retention') grant.history.retainForMs = 0;
    if (mode === 'expired-retention') grant.history.retainForMs = 86_400_000;
    const score = computeDealScore({ offer, history, evidence, now: NOW });
    assert.equal(score.label, 'unknown', mode); assert.equal(score.confidence, 'unknown', mode); assert.equal(score.verified, false, mode);
  }
  const amazon = offerFixture({ source: 'amazon-creators-api' });
  const apiHistory = history.map((snapshot) => ({ ...snapshot, source: amazon.source }));
  const apiEvidence = evidenceFixture(amazon, apiHistory);
  assert.equal(isOfferPromotable(amazon, NOW, apiEvidence).promotable, true);
  assert.equal(computeDealScore({ offer: amazon, history: apiHistory, evidence: apiEvidence, now: NOW }).verified, false, 'API access plus a 90-day retention assertion is not historical permission');
});

test('B8-03 wrong product/source, renamed duplicates, conflicting observations and missing linkage do not establish a floor', () => {
  const offer = offerFixture();
  for (const patch of [{ variantId: 'other' }, { merchantId: 'other' }, { market: 'CA' }, { currency: 'CAD' }, { source: 'Unknown' }, { price: NaN }, { price: 0 }, { price: Infinity }, { anomaly: true }]) {
    const history = historyFixture(); history[0] = { ...history[0], ...patch };
    const evidence = evidenceFixture(offer, history);
    assert.equal(computeDealScore({ offer, history, evidence, now: NOW }).verified, false, JSON.stringify(patch));
  }
  const original = historyFixture()[0];
  for (const history of [[original, original, original], [0, 1, 2].map((index) => ({ ...original, id: `renamed:${index}`, idempotencyKey: `key:${index}` })), [0, 1, 2].map((index) => ({ ...original, id: `conflict:${index}`, idempotencyKey: `key:${index}`, price: 120 + index }))]) {
    assert.equal(computeDealScore({ offer, history, evidence: evidenceFixture(offer, history), now: NOW }).verified, false);
  }
  const history = historyFixture(); const evidence = evidenceFixture(offer, history); evidence.snapshotsById.delete(history[0].id);
  assert.equal(computeDealScore({ offer, history, evidence, now: NOW }).verified, false);
  assert.equal(computeDealScore({ offer: { ...offer, lastSnapshotId: 'missing' }, history, evidence: evidenceFixture(offer, history), now: NOW }).verified, false);
});

test('B8-04 variant identity includes market and ambiguity is independent of registry order', () => {
  const us = evidenceFixture().knownVariants[0]; const ca = { ...us, id: 'v-ca', market: 'CA', currency: 'CAD' };
  for (const known of [[us, ca], [ca, us]]) {
    assert.deepEqual(resolveVariant(known, us.marketplaceId, 'asin'), { variantId: null, reason: 'ambiguous' });
    assert.equal(resolveVariant(known, us.marketplaceId, 'asin', 'US').variantId, 'v1');
    assert.equal(resolveVariant(known, us.marketplaceId, 'asin', 'CA').variantId, 'v-ca');
  }
  assert.equal(resolveVariant([us, { ...us, currency: 'CAD' }], us.marketplaceId, 'asin', 'US').reason, 'ambiguous');
  assert.equal(resolveVariant([us], us.marketplaceId, 'asin').variantId, 'v1');
});

test('B8-05 versioned keys separate boundaries, types and audit parts without leaking content', () => {
  assert.notEqual(buildIdempotencyKey('example', ['ab', 'c']), buildIdempotencyKey('example', ['a', 'bc']));
  assert.notEqual(buildIdempotencyKey('example', [1]), buildIdempotencyKey('example', ['1']));
  assert.notEqual(buildIdempotencyKey('example', [0]), buildIdempotencyKey('example', [-0]));
  assert.equal(canonicalContent({ b: 2, a: 1 }), canonicalContent({ a: 1, b: 2 }));
  assert.throws(() => buildIdempotencyKey('example', [NaN]), /invalid_idempotency/);
  const a = buildAuditId({ targetId: 'ab', targetType: 'c', action: 'reset', actorId: 'fixture', note: null }, NOW);
  const b = buildAuditId({ targetId: 'a', targetType: 'bc', action: 'reset', actorId: 'fixture', note: null }, NOW);
  assert.notEqual(a, b); assert.match(a, /^audit:v2:[0-9a-f]{64}$/);
});

test('B8-05 changed material content is not silently treated as a duplicate', () => {
  const offer = offerFixture(); const context = ingestionContext(evidenceFixture(offer));
  const base = ingestInput(offer);
  const changes = [{ availability: 'out-of-stock' }, { expiresAt: '2026-07-30T13:00:00Z' }, { shipping: { freeShipping: false, cost: 2 } }, { affiliateUrl: 'https://example.test/fixture' }, { availabilityCapturedAt: '2026-07-30T11:30:00Z' }, { coupons: [{ id: 'fixture', code: null, pctOff: 5, amountOff: null, minSubtotal: null, conditions: null, conditionsSatisfied: true, expiresAt: '2026-07-30T13:00:00Z' }] }];
  const outcomes = ingestOffers([base, ...changes.map((patch) => ({ ...base, ...patch })), { ...base }], context, NOW);
  assert.deepEqual(outcomes.map((result) => result.status), ['inserted', ...changes.map(() => 'inserted'), 'duplicate']);
  const snapshots = ingestPriceSnapshots([{ ...base, source: 'manual' }, { ...base, source: 'manual', listPrice: 150 }], context, NOW);
  assert.notEqual(snapshots[0].idempotencyKey, snapshots[1].idempotencyKey);
});

test('B8-05 legacy sets stop ingestion without rewriting or deleting stored keys', () => {
  const offer = offerFixture(); const context = ingestionContext(evidenceFixture(offer));
  const legacy = new Set(['ps:1a47e90b']);
  const before = [...legacy];
  assert.equal(ingestPriceSnapshots([{ ...offer }], { ...context, existingSnapshotKeys: legacy }, NOW)[0].reason, 'legacy_idempotency_migration_required');
  assert.equal(ingestOffers([ingestInput(offer)], { ...context, existingOfferKeys: legacy }, NOW)[0].reason, 'legacy_idempotency_migration_required');
  assert.equal(ingestTrendSignals([{ topicId: 't1', source: 'manual', delta: 0.2, capturedAt: CAPTURED }], { ...context, existingTrendKeys: legacy }, NOW)[0].reason, 'legacy_idempotency_migration_required');
  assert.deepEqual([...legacy], before);
});

test('B8-06 calendar, reference, future and exclusive 24-hour boundaries fail closed', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  for (const value of ['2026-02-30T12:00:00Z', '2026-07-30T24:00:00Z', '2026-07-30', '2026-07-30T12:00:00+00:00', '', 'bad', new Date('invalid')]) {
    assert.equal(toStrictUtc(value), null); assert.equal(nowUtc(value), '');
    assert.equal(isPriceSnapshotFresh({ capturedAt: CAPTURED }, value).reason, 'invalid_reference');
    assertBlocked(offer, evidence, String(value), value);
    assert.equal(computeTrendScore({ signals: [{ delta: 1, weight: 1, anomaly: false, capturedAt: CAPTURED }], now: value }).verified, false);
  }
  assert.equal(isPriceSnapshotFresh({ capturedAt: CAPTURED }, '2026-07-31T10:59:59.999Z').fresh, true);
  assert.equal(isPriceSnapshotFresh({ capturedAt: CAPTURED }, '2026-07-31T11:00:00Z').fresh, false);
  assert.equal(isPriceSnapshotFresh({ capturedAt: CAPTURED }, '2026-08-01T11:00:00Z').fresh, false);
  const future = offerFixture({ capturedAt: '2026-07-30T12:00:00.001Z' }); assertBlocked(future, evidenceFixture(future));
  const staleStock = offerFixture({ availabilityCapturedAt: '2026-07-29T12:00:00Z' }); assertBlocked(staleStock, evidenceFixture(staleStock));
});
