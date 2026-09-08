import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareReviewJob, validateReviewPayload } from '../scripts/lib/review-queue.mjs';

const input = { asin: 'B012345678', productSlug: 'test-product', revision: 'a'.repeat(64), now: '2026-09-06T12:00:00.000Z' };

test('prepared review jobs contain only allowlisted own metadata', () => {
  const { job } = prepareReviewJob(input);
  assert.deepEqual(Object.keys(job.payload), ['schemaVersion', 'intent', 'asin', 'market', 'productSlug', 'revision']);
  assert.equal(job.partition, 'US:B012345678');
  assert.equal(job.state, 'pending');
  assert.ok(Object.isFrozen(job.payload));
  assert.equal(prepareReviewJob({ ...input, productSlug: undefined }).job.payload.productSlug, null);
});

test('provider fields, nested data, wrong market and malformed identity are rejected without echoing values', () => {
  const valid = prepareReviewJob(input).job.payload;
  for (const field of ['price', 'title', 'image', 'rating', 'availability', 'response', 'secret']) {
    assert.throws(() => validateReviewPayload({ ...valid, [field]: 'never-log-this' }), (error) => error.message === 'invalid_review_payload');
  }
  for (const change of [{ market: 'CA' }, { asin: 'invalid' }, { revision: 'main' }, { productSlug: '../path' }, { schemaVersion: 2 }, { intent: 'publish' }, { productSlug: {} }]) {
    assert.throws(() => validateReviewPayload({ ...valid, ...change }), /invalid_review_payload/);
  }
});

test('a rerun preserves completed review state, changed revision creates new work and identity conflicts fail closed', () => {
  const completed = { ...prepareReviewJob(input).job, state: 'completed', attempts: 1 };
  const repeated = prepareReviewJob({ ...input, now: '2026-09-07T12:00:00.000Z' }, [completed]);
  assert.equal(repeated.status, 'duplicate');
  assert.equal(repeated.job, completed);
  assert.equal(prepareReviewJob({ ...input, revision: 'b'.repeat(64) }, [completed]).status, 'enqueued');
  assert.throws(() => prepareReviewJob({ ...input, productSlug: 'different-product' }, [completed]), /idempotency_content_conflict/);
  assert.equal(completed.state, 'completed');
});
