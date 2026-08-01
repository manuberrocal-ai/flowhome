import assert from 'node:assert/strict';
import test from 'node:test';
import { applyClaimOverride, verifyClaimAuditTrail, appendReviewHistory } from '../src/lib/blocks/block9/admin.ts';

const NOW = '2026-07-30T12:00:00Z';
const freshClaim = { status: 'pending_review', verifiedAt: '2026-07-29T12:00:00Z', expiry: '2026-12-01T00:00:00Z' };
const staleClaim = { status: 'pending_review', verifiedAt: '2025-12-01T00:00:00Z', expiry: null };
const expiredClaim = { status: 'active', verifiedAt: '2026-01-01T12:00:00Z', expiry: '2026-02-01T00:00:00Z' };

test('approve on a fresh claim sets status active', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'approve', actorId: 'admin1', note: 'ok', now: NOW }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedStatus, 'active');
  assert.equal(r.changed, true);
  assert.ok(r.audit.fields.includes('status'));
});

test('approve on a stale claim is BLOCKED with no change (no stale-approve ever)', () => {
  const r = applyClaimOverride({ targetId: 'c2', targetType: 'claim', action: 'approve', actorId: 'admin1', note: 'try', now: NOW }, staleClaim);
  assert.equal(r.outcome, 'blocked_stale');
  assert.equal(r.appliedStatus, null);
  assert.equal(r.changed, false);
});

test('reinstate on an expired claim is BLOCKED', () => {
  const r = applyClaimOverride({ targetId: 'c3', targetType: 'claim', action: 'reinstate', actorId: 'admin1', note: 'try', now: NOW }, expiredClaim);
  assert.equal(r.outcome, 'blocked_stale');
  assert.equal(r.appliedStatus, null);
});

test('suppress moves any claim to suppressed (always allowed)', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'suppress', actorId: 'admin1', note: 'kill', now: NOW }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedStatus, 'suppressed');
});

test('dispute moves any claim to disputed', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'dispute', actorId: 'admin1', note: 'flag', now: NOW }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedStatus, 'disputed');
});

test('expire_now terminates any claim to expired', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'expire_now', actorId: 'admin1', note: 'expire', now: NOW }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedStatus, 'expired');
});

test('reset returns a claim to unknown', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'reset', actorId: 'admin1', note: 'reset', now: NOW }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.equal(r.appliedStatus, 'unknown');
});

test('approve on an already-active fresh claim is no_change (idempotent)', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'approve', actorId: 'admin1', note: 'again', now: NOW }, { status: 'active', verifiedAt: '2026-07-29T12:00:00Z', expiry: null });
  assert.equal(r.outcome, 'no_change');
  assert.equal(r.changed, false);
});

test('applyClaimOverride accepts a Date object for now', () => {
  const r = applyClaimOverride({ targetId: 'c1', targetType: 'claim', action: 'suppress', actorId: 'admin1', note: 'now date', now: new Date(NOW) }, freshClaim);
  assert.equal(r.outcome, 'applied');
  assert.match(r.audit.recordedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('verifyClaimAuditTrail accepts entries whose before/after match touched fields', () => {
  const entries = [
    { id: 'claim-audit:a1', targetId: 'c1', targetType: 'claim', action: 'approve', fields: ['status'], note: null, actorId: 'a', recordedAt: NOW, before: { status: 'pending_review' }, after: { status: 'active' } },
  ];
  const v = verifyClaimAuditTrail(entries);
  assert.equal(v.ok, true);
});

test('verifyClaimAuditTrail rejects entries with missing before for touched fields', () => {
  const entries = [
    { id: 'claim-audit:a2', targetId: 'c1', targetType: 'claim', action: 'approve', fields: ['status'], note: null, actorId: 'a', recordedAt: NOW, before: null, after: { status: 'active' } },
  ];
  const v = verifyClaimAuditTrail(entries);
  assert.equal(v.ok, false);
  assert.match(v.reason, /missing before\/after/);
});

test('verifyClaimAuditTrail accepts blocked entries (empty fields) without before/after', () => {
  const entries = [
    { id: 'claim-audit:a3', targetId: 'c1', targetType: 'claim', action: 'approve', fields: [], note: null, actorId: 'a', recordedAt: NOW, before: null, after: null },
  ];
  const v = verifyClaimAuditTrail(entries);
  assert.equal(v.ok, true);
});

test('appendReviewHistory returns a new array (pure)', () => {
  const base = [{ reviewedAt: NOW, reviewerId: 'a', verdict: 'approved', note: 'ok' }];
  const next = appendReviewHistory(base, { reviewedAt: NOW, reviewerId: 'b', verdict: 'overridden', note: 'rev' });
  assert.equal(next.length, 2);
  assert.equal(base.length, 1);
});
