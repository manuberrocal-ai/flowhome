import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareReviewJob } from '../scripts/lib/review-queue.mjs';
import { persistReviewQueue } from '../scripts/lib/persist-review-queue.mjs';

const now = '2026-09-06T12:00:00.000Z';
const job = prepareReviewJob({ asin: 'B012345678', revision: 'a'.repeat(64), now }).job;
const entries = [{ preparedJob: job }];
const confirmed = { status: 'duplicate', id: job.id, idempotencyKey: job.idempotencyKey, state: 'completed' };

test('dry-run and incomplete quality never read or write the durable store', async () => {
  const store = { targetId: 'local', lookup: () => { throw new Error('unexpected'); }, enqueue: () => { throw new Error('unexpected'); } };
  assert.equal((await persistReviewQueue(entries, store, { dryRun: true, qualityPassed: true, now })).status, 'dry_run');
  assert.equal((await persistReviewQueue(entries, store, { dryRun: false, qualityPassed: false, now })).status, 'skipped_quality');
});

test('reconciliation preserves stored completion without a new write', async () => {
  let writes = 0;
  const result = await persistReviewQueue(entries, { targetId: 'local', lookup: async () => confirmed, enqueue: async () => { writes++; } }, { qualityPassed: true, now });
  assert.equal(result.status, 'confirmed');
  assert.equal(result.entries[0].state, 'completed');
  assert.equal(writes, 0);
});

test('missing work gets one write; uncertain acknowledgement halts the remaining batch', async () => {
  let writes = 0;
  const store = { targetId: 'local', lookup: async () => ({ status: 'missing' }), enqueue: async () => { writes++; return { status: 'unconfirmed', message: 'must-not-log' }; } };
  const result = await persistReviewQueue([...entries, ...entries], store, { qualityPassed: true, now });
  assert.equal(result.status, 'needs_attention');
  assert.equal(result.notAttempted, 1);
  assert.equal(writes, 1);
  assert.ok(!JSON.stringify(result).includes('must-not-log'));
});
