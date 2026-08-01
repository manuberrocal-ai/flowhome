import assert from 'node:assert/strict';
import test from 'node:test';
import { applyOverride, verifyAuditTrail } from '../src/lib/blocks/block8/admin.ts';

const NOW = '2026-07-30T12:00:00Z';
const freshOffer = { id: 'o1', capturedAt: '2026-07-29T12:00:00Z', expiresAt: '2026-08-05T12:00:00Z', availability: 'in-stock', availabilityCapturedAt: '2026-07-29T12:00:00Z', lastSnapshotId: 's1', lifecycle: 'pending_review', review: 'unknown' };
const staleOffer = { id: 'o2', capturedAt: '2026-06-01T12:00:00Z', expiresAt: null, availability: 'in-stock', availabilityCapturedAt: '2026-07-29T12:00:00Z', lastSnapshotId: 's2', lifecycle: 'pending_review', review: 'unknown' };
const expiredOffer = { id: 'o3', capturedAt: '2026-07-29T12:00:00Z', expiresAt: '2026-07-15T12:00:00Z', availability: 'in-stock', availabilityCapturedAt: '2026-07-29T12:00:00Z', lastSnapshotId: 's3', lifecycle: 'suppressed', review: 'unknown' };

// ---------------------------------------------------------------------------
// override contract — promote / suppress / reset / expire / anomaly
// ---------------------------------------------------------------------------

test('override_promote on a promotable fresh offer sets lifecycle active and review approved', () => {
  const r = applyOverride({ targetId: 'o1', targetType: 'offer', action: 'override_promote', actorId: 'admin1', note: 'done', now: NOW }, freshOffer);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedLifecycle, 'active');
  assert.equal(r.appliedReview, 'approved');
  assert.equal(r.changed, true);
  assert.ok(Array.isArray(r.audit.fields) && r.audit.fields.includes('lifecycle'));
});

test('override_promote on a stale offer is BLOCKED with no lifecycle change (no stale-promote ever)', () => {
  const r = applyOverride({ targetId: 'o2', targetType: 'offer', action: 'override_promote', actorId: 'admin1', note: 'try', now: NOW }, staleOffer);
  assert.equal(r.outcome, 'blocked_stale');
  assert.equal(r.appliedLifecycle, null);
  assert.equal(r.appliedReview, null);
  assert.equal(r.changed, false);
  assert.equal(r.audit.fields.length, 0);
});

test('override_promote on an expired offer is BLOCKED with no lifecycle change', () => {
  const r = applyOverride({ targetId: 'o3', targetType: 'offer', action: 'override_promote', actorId: 'admin1', note: 'try', now: NOW }, expiredOffer);
  assert.equal(r.outcome, 'blocked_stale');
  assert.equal(r.appliedLifecycle, null);
  assert.equal(r.changed, false);
});

test('override_suppress moves any offer to suppressed and rejected', () => {
  const r = applyOverride({ targetId: 'o1', targetType: 'offer', action: 'override_suppress', actorId: 'admin1', note: 'kill', now: NOW }, freshOffer);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedLifecycle, 'suppressed');
  assert.equal(r.appliedReview, 'rejected');
});

test('expire_now moves any offer to expired lifecycle', () => {
  const r = applyOverride({ targetId: 'o1', targetType: 'offer', action: 'expire_now', actorId: 'admin1', note: 'expire', now: NOW }, freshOffer);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedLifecycle, 'expired');
  assert.equal(r.appliedReview, 'unknown');
});

test('reset returns an offer to the ingestion baseline (pending_review, unknown)', () => {
  const overridden = { id: 'o4', capturedAt: '2026-07-29T12:00:00Z', expiresAt: '2026-08-05T12:00:00Z', availability: 'in-stock', availabilityCapturedAt: '2026-07-29T12:00:00Z', lastSnapshotId: 's4', lifecycle: 'suppressed', review: 'rejected' };
  const r = applyOverride({ targetId: 'o4', targetType: 'offer', action: 'reset', actorId: 'admin1', note: 'reset', now: NOW }, overridden);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedLifecycle, 'pending_review');
  assert.equal(r.appliedReview, 'unknown');
});

test('anomaly_acknowledge on a flagged trend signal clears the flag and records the audit trail', () => {
  const sig = { id: 'ts1', anomaly: true };
  const r = applyOverride({ targetId: 'ts1', targetType: 'trend_signal', action: 'anomaly_acknowledge', actorId: 'admin1', note: 'false positive', now: NOW }, sig);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.changed, true);
  assert.equal(r.audit.before.anomaly, true);
  assert.equal(r.audit.after.anomaly, false);
});

test('anomaly_acknowledge on a non-anomalous signal is no_change (idempotent)', () => {
  const sig = { id: 'ts2', anomaly: false };
  const r = applyOverride({ targetId: 'ts2', targetType: 'trend_signal', action: 'anomaly_acknowledge', actorId: 'admin1', note: 'noop', now: NOW }, sig);
  assert.equal(r.outcome, 'no_change');
  assert.equal(r.changed, false);
  assert.deepEqual(r.audit.fields, []);
  assert.deepEqual(verifyAuditTrail([r.audit]), { ok: true, reason: null });
});

test('unsupported action on a deal_candidate is blocked and recorded', () => {
  const cand = { id: 'dc1', label: 'unknown' };
  const r = applyOverride({ targetId: 'dc1', targetType: 'deal_candidate', action: 'override_promote', actorId: 'admin1', note: 'bad', now: NOW }, cand);
  assert.equal(r.outcome, 'blocked_unsupported_action');
  assert.equal(r.changed, false);
  assert.ok(r.audit.id.startsWith('audit:'));
});

test('applyOverride accepts a Date object for now, not only a string', () => {
  const r = applyOverride({ targetId: 'o1', targetType: 'offer', action: 'override_suppress', actorId: 'admin1', note: 'now date', now: new Date(NOW) }, freshOffer);
  assert.equal(r.outcome, 'applied');
  assert.match(r.audit.recordedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

test('verifyAuditTrail accepts entries whose before/after contain the touched fields', () => {
  const entries = [
    { id: 'audit:a1', targetId: 'o1', targetType: 'offer', action: 'override_promote', fields: ['lifecycle', 'review'], note: null, actorId: 'a', recordedAt: NOW, before: { lifecycle: 'pending_review', review: 'unknown' }, after: { lifecycle: 'active', review: 'approved' } },
  ];
  const v = verifyAuditTrail(entries);
  assert.equal(v.ok, true);
  assert.equal(v.reason, null);
});

test('verifyAuditTrail rejects entries with missing before when fields are touched', () => {
  const entries = [
    { id: 'audit:a2', targetId: 'o1', targetType: 'offer', action: 'override_promote', fields: ['lifecycle'], note: null, actorId: 'a', recordedAt: NOW, before: null, after: { lifecycle: 'active' } },
  ];
  const v = verifyAuditTrail(entries);
  assert.equal(v.ok, false);
  assert.match(v.reason, /missing before\/after/);
});

test('verifyAuditTrail accepts entries with empty fields (blocked actions) without forcing before/after', () => {
  const entries = [
    { id: 'audit:a3', targetId: 'o1', targetType: 'offer', action: 'override_promote', fields: [], note: null, actorId: 'a', recordedAt: NOW, before: null, after: null },
  ];
  const v = verifyAuditTrail(entries);
  assert.equal(v.ok, true);
});
