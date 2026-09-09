import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { prepareReviewJob } from '../scripts/lib/review-queue.mjs';
import { createReviewQueueStore } from '../scripts/lib/review-queue-store.mjs';

const input = { asin: 'B012345678', revision: 'a'.repeat(64), now: '2026-09-06T12:00:00.000Z' };
const job = prepareReviewJob(input).job;
const success = { status: 'duplicate', id: job.id, idempotencyKey: job.idempotencyKey, state: 'completed' };

test('store calls only the restricted RPC and preserves confirmed state', async () => {
  const calls = [];
  const store = createReviewQueueStore({ rpc: async (...args) => { calls.push(args); return { data: success, error: null }; } });
  assert.deepEqual(await store.enqueue(input), success);
  assert.deepEqual(calls, [['block10_enqueue_catalog_review', { p_payload: job.payload }]]);
});

test('lookup uses its read-only RPC and does not turn a missing row into an enqueue', async () => {
  const calls = [];
  const store = createReviewQueueStore({ rpc: async (...args) => { calls.push(args); return { data: { status: 'missing' } }; } });
  assert.deepEqual(await store.lookup(input), { status: 'missing' });
  assert.deepEqual(calls, [['block10_lookup_catalog_review', { p_payload: job.payload, p_idempotency_key: job.idempotencyKey }]]);
});

test('store redacts errors and never automatically retries an uncertain write', async () => {
  for (const transport of [async () => { throw new Error('secret-value'); }, async () => ({ error: { message: 'secret-value' } })]) {
    let calls = 0;
    const store = createReviewQueueStore({ rpc: (...args) => { calls++; return transport(...args); } });
    const result = await store.enqueue(input);
    assert.equal(result.status, 'unconfirmed');
    assert.equal(calls, 1);
    assert.ok(!JSON.stringify(result).includes('secret-value'));
  }
});

test('store rejects mismatched acknowledgements and invalid input before network', async () => {
  for (const data of [null, {}, { ...success, id: 'other' }, { ...success, state: 'published' }]) {
    assert.equal((await createReviewQueueStore({ rpc: async () => ({ data }) }).enqueue(input)).status, 'unconfirmed');
  }
  let called = false;
  await assert.rejects(createReviewQueueStore({ rpc: async () => { called = true; } }).enqueue({ ...input, asin: 'bad' }), /invalid_review_payload/);
  assert.equal(called, false);
});

test('migration surface grants RPC only and never resets existing jobs; rollback preserves data', () => {
  const sql = readFileSync(new URL('../supabase/migrations/009_catalog_review_enqueue.sql', import.meta.url), 'utf8');
  const rollback = readFileSync(new URL('../supabase/rollbacks/009_catalog_review_enqueue.rollback.sql', import.meta.url), 'utf8');
  assert.match(sql, /on conflict \(idempotency_key\) do nothing/);
  assert.match(sql, /for update/);
  assert.match(sql, /v_job\.payload is distinct from p_payload/);
  assert.doesNotMatch(sql, /update public\.block10_jobs|grant[^;]*on table/i);
  assert.match(sql, /grant execute on function public\.block10_enqueue_catalog_review\(jsonb\) to service_role/);
  assert.doesNotMatch(rollback, /delete from|truncate|drop table/i);
});
