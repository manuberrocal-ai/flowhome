import assert from 'node:assert/strict';
import test from 'node:test';
import { retryDelayMs, retryDelaySeconds, decideRetry, processClaimedSend } from '../src/lib/blocks/block8/retry.ts';
import { RETRY_DEFAULTS } from '../src/lib/blocks/block8/domain.ts';

test('backoff is exponential in attempts and capped by maxDelayMs', () => {
  const d1 = retryDelayMs(1, RETRY_DEFAULTS, () => 0.5);
  const d2 = retryDelayMs(2, RETRY_DEFAULTS, () => 0.5);
  const d5 = retryDelayMs(5, RETRY_DEFAULTS, () => 0.5);
  assert.ok(d2 > d1, 'd2 must exceed d1');
  assert.ok(d5 <= RETRY_DEFAULTS.maxDelayMs, 'capped');
  assert.ok(d5 < RETRY_DEFAULTS.maxDelayMs + 1);
});

test('retryDelaySeconds is the floor of retryDelayMs / 1000', () => {
  for (const n of [1, 2, 3, 5]) {
    assert.equal(retryDelaySeconds(n, RETRY_DEFAULTS, () => 0.5), Math.floor(retryDelayMs(n, RETRY_DEFAULTS, () => 0.5) / 1000));
  }
});

test('backoff uses injected bounded full jitter', () => {
  assert.equal(retryDelayMs(1, RETRY_DEFAULTS, () => 0), 0);
  assert.equal(retryDelayMs(1, RETRY_DEFAULTS, () => 0.5), 500);
  assert.equal(retryDelayMs(1, RETRY_DEFAULTS, () => 0.999), 999);
  assert.equal(retryDelayMs(99, RETRY_DEFAULTS, () => 1), RETRY_DEFAULTS.maxDelayMs - 1);
  const decision = decideRetry(2, { state: 'sent', safeToRetry: true }, RETRY_DEFAULTS, new Date('2026-07-30T12:00:00Z'), () => 0.25);
  assert.equal(decision.delayMs, 500);
});

test('confirmed mock/sent send is terminal with no retry', () => {
  for (const state of ['mock', 'sent']) {
    const r = decideRetry(1, { state, confirmed: true });
    assert.equal(r.state, state);
    assert.equal(r.nextAttemptAt, null);
    assert.match(r.reason, /^terminal:/);
  }
});

test('safeToRetry below the cap requeues with a future nextAttemptAt', () => {
  const now = new Date('2026-07-30T12:00:00Z');
  const r = decideRetry(2, { state: 'sent', safeToRetry: true, confirmed: false }, RETRY_DEFAULTS, now);
  assert.equal(r.state, 'retry');
  assert.ok(r.delayMs > 0);
  assert.ok(new Date(r.nextAttemptAt).getTime() > now.getTime());
  assert.match(r.reason, /^retry:attempt_2$/);
});

test('uncertain or non-safeToRetry outcome never retries; goes dead', () => {
  const r = decideRetry(2, { state: 'sent', confirmed: false }, RETRY_DEFAULTS, new Date('2026-07-30T12:00:00Z'));
  assert.equal(r.state, 'dead');
  assert.match(r.reason, /^unsafe_or_uncertain/);
});

test('safeToRetry at the attempts cap becomes dead rather than retrying past the cap', () => {
  const r = decideRetry(RETRY_DEFAULTS.maxAttempts, { state: 'sent', safeToRetry: true, confirmed: false }, RETRY_DEFAULTS, new Date('2026-07-30T12:00:00Z'));
  assert.equal(r.state, 'dead');
  assert.match(r.reason, /^dead:attempts_5$/);
});

test('processClaimedSend translating a thrown safeToRetry error below the cap into retry', async () => {
  let calls = 0;
  const provider = { send: async () => { calls++; const e = new Error('temporary'); e.safeToRetry = true; throw e; } };
  const r = await processClaimedSend(1, provider, RETRY_DEFAULTS, new Date('2026-07-30T12:00:00Z'));
  assert.equal(calls, 1);
  assert.equal(r.state, 'retry');
  assert.ok(r.delayMs > 0);
});

test('processClaimedSend translating an uncertain provider outcome into dead without retry', async () => {
  const provider = { send: async () => ({ state: 'sent', confirmed: false }) };
  const r = await processClaimedSend(2, provider, RETRY_DEFAULTS, new Date('2026-07-30T12:00:00Z'));
  assert.equal(r.state, 'dead');
  assert.equal(r.nextAttemptAt, null);
});
