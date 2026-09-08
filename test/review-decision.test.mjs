import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareReviewJob } from '../scripts/lib/review-queue.mjs';
import { prepareReviewDecision } from '../scripts/lib/review-decision.mjs';

const revision = 'a'.repeat(64);
const { job } = prepareReviewJob({ asin: 'B09B8V1LZ3', revision, now: '2026-09-08T00:00:00Z' });
const evidence = { jobId: job.id, revision, digest: 'b'.repeat(64) };
const input = { jobId: job.id, revision, evidenceDigest: evidence.digest, expectedVersion: 0, decision: 'approve', reason: 'evidence-reviewed' };

test('decision intent is immutable and never grants publication, including completed jobs', () => {
  for (const state of ['pending', 'claimed', 'completed']) {
    const result = prepareReviewDecision(input, { ...job, state }, evidence);
    assert.equal(result.status, 'pending-authenticated-persistence');
    assert.equal(result.publicationAuthorized, false);
    assert.ok(Object.isFrozen(result));
    assert.deepEqual(result, prepareReviewDecision(input, { ...job, state }, evidence));
  }
  assert.equal(job.state, 'pending');
  assert.equal(Object.hasOwn(input, 'publicationAuthorized'), false);
});

test('intent rejects injected identity, raw content, stale revision and mismatched evidence', () => {
  for (const extra of [{ actorId: 'owner' }, { role: 'admin' }, { price: 10 }, { notes: 'free text' }, { token: 'fixture' }]) assert.throws(() => prepareReviewDecision({ ...input, ...extra }, job, evidence));
  for (const patch of [{ jobId: 'other' }, { revision: 'c'.repeat(64) }, { evidenceDigest: 'd'.repeat(64) }, { expectedVersion: -1 }, { expectedVersion: 1.5 }, { decision: '__proto__' }, { reason: 'arbitrary text' }]) assert.throws(() => prepareReviewDecision({ ...input, ...patch }, job, evidence));
  assert.throws(() => prepareReviewDecision(input, job, { ...evidence, revision: 'c'.repeat(64) }));
  assert.throws(() => prepareReviewDecision(input, { ...job, source: 'other' }, evidence));
  const rejection = prepareReviewDecision({ ...input, decision: 'reject', reason: 'insufficient-evidence' }, job, evidence);
  assert.equal(rejection.publicationAuthorized, false);
});
