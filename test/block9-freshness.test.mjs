import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateClaimFreshness, effectiveClaimStatus, detectEdgeContradictions, detectLedgerContradictions, describeConstraint, confidenceFromClaimFreshness } from '../src/lib/blocks/block9/freshness.ts';

const NOW = new Date('2026-07-30T12:00:00Z');

test('evaluateClaimFreshness returns fresh inside the 180-day window', () => {
  const r = evaluateClaimFreshness({ verifiedAt: '2026-07-01T12:00:00Z', expiry: null }, NOW);
  assert.equal(r.reason, 'fresh');
  assert.equal(r.fresh, true);
});

test('expired claims expire when now >= expiry', () => {
  const r = evaluateClaimFreshness({ verifiedAt: '2026-01-01T12:00:00Z', expiry: '2026-02-01T00:00:00Z' }, NOW);
  assert.equal(r.reason, 'expired');
  assert.equal(r.expired, true);
});

test('unknown verifiedAt stays unknown, never fresh', () => {
  const r = evaluateClaimFreshness({ verifiedAt: '2026-07-30', expiry: null }, NOW);
  assert.equal(r.reason, 'unknown_verified_at');
  assert.equal(r.fresh, false);
});

test('future verification dates are unknown and never surface as valid claims', () => {
  const freshness = evaluateClaimFreshness({ verifiedAt: '2026-07-31T12:00:00Z', expiry: null }, NOW);
  assert.equal(freshness.reason, 'unknown_verified_at');
  assert.equal(freshness.fresh, false);
  const effective = effectiveClaimStatus({ verifiedAt: '2026-07-31T12:00:00Z', expiry: null, status: 'active' }, NOW);
  assert.deepEqual(effective, { status: 'unknown', surfaced: false, confidence: 'unknown', reason: 'unknown_verified_at' });
});

test('stale claims (older than 180d) stay active but degrade to low confidence', () => {
  const r = effectiveClaimStatus({ verifiedAt: '2025-12-01T00:00:00Z', expiry: null, status: 'active' }, NOW);
  assert.equal(r.status, 'active');
  assert.equal(r.surfaced, true);
  assert.equal(r.confidence, 'low');
});

test('expired claims degrade and never surface as fact', () => {
  const r = effectiveClaimStatus({ verifiedAt: '2025-12-01T00:00:00Z', expiry: '2026-02-01T00:00:00Z', status: 'active' }, NOW);
  assert.equal(r.status, 'expired');
  assert.equal(r.surfaced, false);
});

test('disputed claims never surface as fact', () => {
  const r = effectiveClaimStatus({ verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'disputed' }, NOW);
  assert.equal(r.status, 'disputed');
  assert.equal(r.surfaced, false);
});

test('suppressed claims never surface as fact', () => {
  const r = effectiveClaimStatus({ verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'suppressed' }, NOW);
  assert.equal(r.status, 'suppressed');
  assert.equal(r.surfaced, false);
});

test('detectEdgeContradictions flags works-with vs conflicts on the same tuple', () => {
  const now = NOW;
  const edges = [
    { id: 'ea', from: 'p:x', to: 'e:alexa', relation: 'works-with', claim: 'works', market: 'US', verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'active', reviewHistory: [] },
    { id: 'eb', from: 'p:x', to: 'e:alexa', relation: 'conflicts', claim: 'conflicts', market: 'US', verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'active', reviewHistory: [] },
  ];
  const found = detectEdgeContradictions(edges, now);
  assert.equal(found.length, 1);
  assert.equal(found[0].a, 'ea');
  assert.equal(found[0].b, 'eb');
  assert.match(found[0].reason, /opposite_verdict/);
});

test('detectEdgeContradictions flags local-only vs cloud-only on the same tuple', () => {
  const edges = [
    { id: 'ea', from: 'p:x', to: 'e:alexa', relation: 'local-only', claim: 'local', market: 'US', verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'active', reviewHistory: [] },
    { id: 'eb', from: 'p:x', to: 'e:alexa', relation: 'cloud-only', claim: 'cloud', market: 'US', verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'active', reviewHistory: [] },
  ];
  const found = detectEdgeContradictions(edges, NOW);
  assert.equal(found.length, 1);
});

test('detectEdgeContradictions ignores expired edges', () => {
  const edges = [
    { id: 'ea', from: 'p:x', to: 'e:alexa', relation: 'works-with', claim: 'works', market: 'US', verifiedAt: '2026-07-01T12:00:00Z', expiry: null, status: 'active', reviewHistory: [] },
    { id: 'eb', from: 'p:x', to: 'e:alexa', relation: 'conflicts', claim: 'conflicts', market: 'US', verifiedAt: '2026-01-01T12:00:00Z', expiry: '2026-02-01T00:00:00Z', status: 'active', reviewHistory: [] },
  ];
  const found = detectEdgeContradictions(edges, NOW);
  assert.equal(found.length, 0);
});

test('detectLedgerContradictions flags positive vs negative claim on the same location', () => {
  const ledger = [
    { id: 'l1', claim: 'Works with Alexa.', visibleLocation: 'product:a:chip', entityId: 'p:a', entityVersion: null, market: 'US', source: { label: 'a', url: 'https://example.com/a', supplier: 's', accessedAt: '2026-07-01T00:00:00Z' }, validationMethod: 'x', evidence: 'research-verified', confidence: 'medium', reviewDate: '2026-07-01T12:00:00Z', owner: 'o', status: 'active', history: [], edgeId: null },
    { id: 'l2', claim: 'Does not work with Alexa.', visibleLocation: 'product:a:chip', entityId: 'p:a', entityVersion: null, market: 'US', source: { label: 'b', url: 'https://example.com/b', supplier: 's', accessedAt: '2026-07-02T00:00:00Z' }, validationMethod: 'x', evidence: 'research-verified', confidence: 'medium', reviewDate: '2026-07-02T12:00:00Z', owner: 'o', status: 'active', history: [], edgeId: null },
  ];
  const found = detectLedgerContradictions(ledger, NOW);
  assert.equal(found.length, 1);
  assert.match(found[0].reason, /opposite_verdict_on_same_location/);
});

test('describeConstraint returns a notice only for constraint relations', () => {
  assert.match(describeConstraint('requires-hub', 'Hub Alpha') ?? '', /Requires hub Hub Alpha/);
  assert.match(describeConstraint('requires-subscription', 'Vendor Cloud') ?? '', /Requires subscription Vendor Cloud/);
  assert.match(describeConstraint('conflicts', 'Beta Bulb') ?? '', /Known conflict with Beta Bulb/);
  assert.equal(describeConstraint('requires-installation', 'Wall mount'), 'Installation requirement: Wall mount.');
  assert.equal(describeConstraint('requires-electrical', '120 V AC'), 'Electrical requirement: 120 V AC.');
  assert.equal(describeConstraint('requires-housing', 'Wall box'), 'Housing requirement: Wall box.');
  assert.equal(describeConstraint('available-in', 'United States'), 'Available in United States.');
  assert.equal(describeConstraint('warranty-covered-in', 'United States'), 'Warranty coverage: United States.');
  assert.equal(describeConstraint('works-with', 'X'), null);
});

test('confidenceFromClaimFreshness degrades with age and evidence level', () => {
  assert.equal(confidenceFromClaimFreshness(evaluateClaimFreshness({ verifiedAt: '2026-07-01T12:00:00Z', expiry: null }, NOW), 'hands-on-tested'), 'high');
  const stale = evaluateClaimFreshness({ verifiedAt: '2025-12-01T00:00:00Z', expiry: null }, NOW);
  assert.equal(confidenceFromClaimFreshness(stale, 'hands-on-tested'), 'low');
  assert.equal(confidenceFromClaimFreshness(stale, 'research-verified'), 'low');
});
