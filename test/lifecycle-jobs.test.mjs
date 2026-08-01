import assert from 'node:assert/strict';
import test from 'node:test';
import { createLifecycleDataContract, dispatchClaimedJob, evaluateDeliveryPolicy, lifecycleUnsubscribeCorsHeaders, processClaimedJob, retryDelaySeconds } from '../supabase/functions/_shared/lifecycle-core.js';

const active = (frequency = 'weekly') => ({ consented: true, status: 'active', suppressed: false, frequency, types: ['onboarding', 'digest', 'price-drop', 'restock', 'comparison-follow-up', 'recommendation', 'reactivation'] });
const completed = (type, completedAt = new Date(0).toISOString()) => ({ type, completedAt });

test('delivery caps enforce every type, frequency window, and global window', () => {
  const now = 1_000_000_000;
  assert.equal(evaluateDeliveryPolicy({ type: 'onboarding', preferences: active(), recentCompletions: [completed('onboarding', new Date(now - 1).toISOString())], now }).reason, 'type_cap');
  assert.equal(evaluateDeliveryPolicy({ type: 'digest', preferences: active('important-only'), now }).reason, 'frequency');
  assert.equal(evaluateDeliveryPolicy({ type: 'digest', preferences: active('weekly'), recentCompletions: [completed('digest', new Date(now - 6 * 86_400_000).toISOString())], now }).reason, 'type_cap');
  assert.equal(evaluateDeliveryPolicy({ type: 'digest', preferences: active('monthly'), recentCompletions: [completed('digest', new Date(now - 27 * 86_400_000).toISOString())], now }).reason, 'type_cap');
  for (const type of ['price-drop', 'restock', 'comparison-follow-up', 'recommendation', 'reactivation']) assert.equal(evaluateDeliveryPolicy({ type, preferences: active(), now }).allowed, true, type);
  assert.equal(evaluateDeliveryPolicy({ type: 'restock', preferences: active(), recentCompletions: Array.from({ length: 4 }, () => completed('price-drop', new Date(now - 1).toISOString())), now }).reason, 'global_cap');
});

test('provider processing retries only explicit safe failures and never retries uncertain results', async () => {
  const job = { attempts: 1, idempotency_key: 'job-key', type: 'digest', recipient_email: 'not-retained@example.test' };
  assert.deepEqual(await processClaimedJob({ job, provider: { send: async () => ({ state: 'mock', confirmed: true }) }, now: 0 }), { state: 'mock', nextAttemptAt: null });
  assert.equal((await processClaimedJob({ job, provider: { send: async () => { const error = new Error('temporary'); error.safeToRetry = true; throw error; } }, now: 0 })).state, 'retry');
  assert.deepEqual(await processClaimedJob({ job, provider: { send: async () => ({ state: 'sent', confirmed: false }) }, now: 0 }), { state: 'dead', nextAttemptAt: null });
  assert.ok(retryDelaySeconds(2) > retryDelaySeconds(1));
});

test('attempts 1 through 5 invoke the provider; only safe failures before 5 retry', async () => {
  for (const attempts of [1, 2, 3, 4]) {
    const outcome = await processClaimedJob({ job: { attempts, type: 'digest' }, provider: { send: async () => { const error = new Error('safe'); error.safeToRetry = true; throw error; } }, now: 0 });
    assert.equal(outcome.state, 'retry', `attempt ${attempts}`);
  }
  let sends = 0;
  const final = await processClaimedJob({ job: { attempts: 5, type: 'digest' }, provider: { send: async () => { sends += 1; const error = new Error('safe'); error.safeToRetry = true; throw error; } }, now: 0 });
  assert.equal(sends, 1); assert.deepEqual(final, { state: 'dead', nextAttemptAt: null });
});

const activePreference = { consented: true, status: 'active', suppressed: false, dispatchVersion: 3, frequency: 'weekly', types: ['onboarding', 'digest', 'price-drop', 'restock', 'comparison-follow-up', 'recommendation', 'reactivation'] };

test('deterministic lifecycle contract reserves and consumes one lease, then enforces per-type and global caps before provider invocation', async () => {
  const typeJobs = Array.from({ length: 4 }, (_, index) => ({ id: `type-${index}`, userId: 'user-a', state: 'claimed', type: 'price-drop', attempts: 1, idempotency_key: `type-key-${index}`, recipient_email: 'not-retained@example.test' }));
  let typeSends = 0;
  const typeBoundary = createLifecycleDataContract({ preferences: { 'user-a': activePreference }, jobs: typeJobs, now: 1_000_000_000 });
  const typeResults = await Promise.all(typeJobs.map((job) => dispatchClaimedJob({
    job, db: typeBoundary, provider: { send: async () => { typeSends += 1; return { state: 'mock', confirmed: true }; } },
  })));
  assert.equal(typeSends, 3); assert.deepEqual(typeResults.map((result) => result.state).sort(), ['mock', 'mock', 'mock', 'suppressed']);

  const globalJobs = ['price-drop', 'restock', 'comparison-follow-up', 'recommendation', 'reactivation'].map((type, index) => ({ id: `global-${index}`, userId: 'user-b', state: 'claimed', type, attempts: 1, idempotency_key: `global-key-${index}`, recipient_email: 'not-retained@example.test' }));
  let globalSends = 0;
  const globalBoundary = createLifecycleDataContract({ preferences: { 'user-b': activePreference }, jobs: globalJobs, now: 1_000_000_000 });
  const globalResults = await Promise.all(globalJobs.map((job) => dispatchClaimedJob({
    job, db: globalBoundary, provider: { send: async () => { globalSends += 1; return { state: 'mock', confirmed: true }; } },
  })));
  assert.equal(globalSends, 4); assert.deepEqual(globalResults.map((result) => result.state).sort(), ['mock', 'mock', 'mock', 'mock', 'suppressed']);
});

test('unsubscribe after reservation but before final lease consumption prevents provider invocation', async () => {
  const job = { id: 'claimed-before-unsubscribe', userId: 'user-c', state: 'claimed', type: 'digest', attempts: 1, idempotency_key: 'claimed-before-unsubscribe-key', recipient_email: 'not-retained@example.test' };
  const contract = createLifecycleDataContract({ preferences: { 'user-c': activePreference }, jobs: [job], now: 1_000_000_000 });
  const lease = contract.reserve(job.id);
  assert.ok(lease); assert.equal(contract.unsubscribe('user-c', 'one_click'), true); assert.equal(contract.consume(job.id, lease), false);
  let sends = 0;
  const outcome = await dispatchClaimedJob({ job, db: contract, provider: { send: async () => { sends += 1; return { state: 'mock', confirmed: true }; } } });
  assert.equal(sends, 0); assert.deepEqual(outcome, { state: 'suppressed', nextAttemptAt: null });
});

test('deterministic lifecycle contract exports jobs and webhook activity, then deletes the full activity boundary', () => {
  const contract = createLifecycleDataContract({
    preferences: { 'user-d': { ...activePreference, userId: 'user-d' }, 'user-other': { ...activePreference, userId: 'user-other' } },
    consentHistory: [{ userId: 'user-d', action: 'granted' }, { userId: 'user-other', action: 'granted' }],
    jobs: [{ id: 'job-d', userId: 'user-d', type: 'digest', state: 'mock' }, { id: 'job-other', userId: 'user-other', type: 'digest', state: 'mock' }],
    webhookEvents: [{ providerEventId: 'event-d', jobId: 'job-d', userId: 'user-d', eventType: 'delivered' }, { providerEventId: 'event-other', jobId: 'job-other', userId: 'user-other', eventType: 'delivered' }],
  });
  const exported = contract.exportData('user-d');
  assert.deepEqual(exported.jobs.map((job) => job.id), ['job-d']);
  assert.deepEqual(exported.webhook_events.map((event) => event.providerEventId), ['event-d']);
  assert.equal(contract.deleteData('user-d'), true);
  assert.deepEqual(contract.exportData('user-d'), { preferences: {}, consent_history: [], jobs: [], webhook_events: [] });
  assert.deepEqual(contract.exportData('user-other').jobs.map((job) => job.id), ['job-other']);
});

test('public unsubscribe CORS allows only the configured browser origin and its preflight contract', () => {
  assert.deepEqual(lifecycleUnsubscribeCorsHeaders('https://flowhome.dev'), {
    'access-control-allow-origin': 'https://flowhome.dev',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'Origin',
  });
  assert.equal(lifecycleUnsubscribeCorsHeaders('https://evil.example'), null);
  assert.equal(lifecycleUnsubscribeCorsHeaders(null), null);
});
