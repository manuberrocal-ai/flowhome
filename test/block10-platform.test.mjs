import assert from 'node:assert/strict';
import test from 'node:test';
import { createJob, enqueueJob, claimNext, finishClaim, replayDeadLetter, evaluateRateLimit, traceFor, decideAlert, processPartition } from '../src/lib/blocks/block10/operations.ts';
import { detectDrift, evaluateAutomation, evaluateModelAssistance, decideRollback, isFlagEnabled } from '../src/lib/blocks/block10/governance.ts';
import { decideAdminAction } from '../src/lib/blocks/block10/admin.ts';
import { createAnalyticsEvent } from '../src/lib/blocks/block10/analytics.ts';

const NOW = '2026-08-01T12:00:00.000Z';
const sanitizeFixture = (name, payload) => name === 'affiliate_click' && !('email' in payload) ? payload : null;
const rule = { id: 'rule:publish', version: 'v1', kind: 'rule', immutable: true, reviewed: true, explanation: 'Fresh reviewed source only.' };
const flags = { globalEnabled: true, domainEnabled: true, globalKill: false, domainKill: false };
const approval = (action) => ({ id: `approval-${action}`, action, actorId: 'admin', state: 'approved', reason: 'Reviewed action', approvedAt: NOW, expiresAt: '2026-08-02T12:00:00.000Z' });
function job(parts = ['same']) { return createJob({ source: 'affiliate-feed', partition: 'US', payload: { value: 1 }, idempotencyParts: parts, correlationId: 'corr-1', now: NOW }); }

test('idempotent enqueue and trace context are stable without payload leakage', () => {
  assert.equal(job().idempotencyKey, job().idempotencyKey);
  assert.equal(job(['other']).idempotencyKey === job().idempotencyKey, false);
  assert.equal(enqueueJob([job()], { source: 'affiliate-feed', partition: 'US', payload: { value: 1 }, idempotencyParts: ['same'], correlationId: 'corr-1', now: NOW }).status, 'duplicate');
  assert.deepEqual(traceFor('affiliate-feed', 'corr-1'), traceFor('affiliate-feed', 'corr-1'));
  assert.throws(() => createJob({ source: 'bad source', partition: 'US', payload: {}, idempotencyParts: [], correlationId: 'c', now: NOW }), /invalid_source_or_partition/);
  assert.throws(() => createJob({ source: 'feed', partition: 'US', payload: {}, idempotencyParts: [], correlationId: 'c', now: '2026-08-01' }), /invalid_now/);
});

test('claim leases exactly one job and reclaim only happens after expiry', () => {
  const jobs = [job(['a']), job(['b'])];
  const ordered = [...jobs].sort((left, right) => left.availableAt.localeCompare(right.availableAt) || left.id.localeCompare(right.id));
  const first = claimNext(jobs, 'worker-a', NOW);
  assert.equal(first.claimed.id, ordered[0].id);
  assert.equal(claimNext(first.jobs, 'worker-b', '2026-08-01T12:00:01.000Z').claimed.id, ordered[1].id);
  const only = claimNext([job(['only'])], 'worker-a', NOW);
  assert.equal(claimNext(only.jobs, 'worker-b', '2026-08-01T12:00:01.000Z').claimed, null);
  assert.equal(claimNext(only.jobs, 'worker-b', '2026-08-01T12:01:01.000Z').claimed.id, only.claimed.id);
});

test('safe failure retries with Block 8 defaults, uncertain failure becomes non-replayable DLQ', () => {
  const claimed = claimNext([job()], 'worker-a', NOW).claimed;
  const retry = finishClaim(claimed, 'worker-a', claimed.leaseToken, { state: 'failed', safeToRetry: true }, NOW, () => 0.5);
  assert.equal(retry.state, 'retry'); assert.equal(retry.failureClass, 'retryable');
  assert.equal(finishClaim(claimed, 'other-worker', claimed.leaseToken, { state: 'failed', safeToRetry: true }, NOW).state, 'claimed');
  assert.equal(finishClaim(claimed, 'worker-a', 'wrong-token', { state: 'failed', safeToRetry: true }, NOW).state, 'claimed');
  assert.equal(finishClaim({ ...claimed, leaseExpiresAt: '2026-08-01T11:59:59.000Z' }, 'worker-a', claimed.leaseToken, { state: 'failed', safeToRetry: true }, NOW).state, 'claimed');
  const uncertain = finishClaim(claimed, 'worker-a', claimed.leaseToken, { state: 'failed', confirmed: false }, NOW);
  assert.equal(uncertain.state, 'dead'); assert.equal(uncertain.failureClass, 'uncertain');
  assert.equal(replayDeadLetter(uncertain, approval('replay'), NOW).allowed, false);
  const replay = replayDeadLetter({ ...uncertain, failureClass: 'permanent' }, approval('replay'), NOW);
  assert.equal(replay.allowed, true); assert.equal(replay.replayRequest.approvalId, 'approval-replay');
  assert.equal(claimNext([{ ...job(['cap']), attempts: 5, state: 'retry' }], 'worker-a', NOW).claimed, null);
});

test('rate limits, alerts, and partial isolation are deterministic', async () => {
  assert.equal(evaluateRateLimit({ source: 'feed', limit: 2, windowMs: 60_000 }, [NOW, NOW], NOW).allowed, false);
  assert.equal(evaluateRateLimit({ source: 'feed', limit: 2, windowMs: 60_000 }, ['2026-02-30T12:00:00Z'], NOW).remaining, 2);
  const alert = decideAlert({ trace: traceFor('feed', 'c'), failed: 1, total: 3, lagMs: 0, threshold: 0.8 });
  assert.deepEqual({ alert: alert.alert, severity: alert.severity }, { alert: true, severity: 'warning' });
  const results = await processPartition([1, 2, 3], async (item) => { if (item === 2) throw new Error('outage'); return item * 2; });
  assert.deepEqual(results.map((result) => result.ok), [true, false, true]);
});

test('flags, kill switches, action-derived risk, caps, approval, and drift fail closed', () => {
  assert.equal(isFlagEnabled({ ...flags, globalKill: true }), false);
  const base = { action: 'publish_content', domain: 'content', ruleVersion: rule, modelVersion: null, promptVersion: null, modelEvidence: null, requestedSpendMinor: 0, currentSpendMinor: 0, spendLimitMinor: 10, publicationCount: 0, publicationLimit: 1, approval: null, now: NOW };
  assert.equal(evaluateAutomation(base, flags).reason, 'human_approval_required:publish');
  assert.equal(evaluateAutomation({ ...base, action: 'spend_campaign', requestedSpendMinor: 11, approval: approval('spend') }, flags).reason, 'hard_spend_limit');
  assert.equal(evaluateAutomation({ ...base, publicationCount: 1, approval: approval('publish') }, flags).reason, 'hard_publication_limit');
  for (const action of ['publish_content', 'spend_campaign', 'destructive_change', 'legal_privacy_change']) assert.match(evaluateAutomation({ ...base, action, requestedSpendMinor: action === 'spend_campaign' ? 1 : 0 }, flags).reason, /^human_approval_required:/);
  assert.equal(evaluateAutomation({ ...base, action: 'unknown', approval: approval('publish') }, flags).reason, 'unknown_action_fail_closed');
  assert.equal(evaluateAutomation({ ...base, ruleVersion: null, approval: approval('publish') }, flags).reason, 'deterministic_explainable_rule_required');
  assert.equal(detectDrift([10, 10], [20, 20], 0.5).drifted, true);
});

test('reviewed artifact validation, rollback, and model assistance require prompt, evidence, and no drift', () => {
  const model = { ...rule, id: 'model:1', kind: 'model' };
  const prompt = { ...rule, id: 'prompt:1', kind: 'prompt' };
  assert.equal(evaluateModelAssistance(model, prompt, { sampleSize: 5, minimumSampleSize: 10, drifted: false }).eligible, false);
  assert.equal(evaluateModelAssistance(model, prompt, { sampleSize: 10, minimumSampleSize: 10, drifted: true }).reason, 'drift_detected');
  assert.equal(evaluateModelAssistance(model, prompt, { sampleSize: 10, minimumSampleSize: 10, drifted: false }).eligible, true);
  assert.equal(decideRollback({ ...rule, version: 'v2' }, rule, approval('rollback'), NOW).allowed, true);
  assert.equal(decideRollback({ ...rule, version: 'v2' }, rule, null, NOW).reason, 'rollback_approval_required');
  assert.equal(evaluateAutomation({ action: 'publish_content', domain: 'content', ruleVersion: rule, modelVersion: null, promptVersion: null, modelEvidence: null, requestedSpendMinor: 0, currentSpendMinor: 0, spendLimitMinor: 1, publicationCount: 0, publicationLimit: 1, approval: { ...approval('publish'), approvedAt: '2026-08-01T12:01:00.000Z' }, now: NOW }, flags).allowed, false);
});

test('analytics adapter accepts only canonical sanitized events with strict UTC', () => {
  assert.deepEqual(createAnalyticsEvent('affiliate_click', { page_type: 'home', cta_position: 'hero' }, NOW, 'corr', sanitizeFixture).payload, { page_type: 'home', cta_position: 'hero' });
  assert.equal(createAnalyticsEvent('affiliate_click', { page_type: 'home', email: 'a@b.com' }, NOW, 'corr', sanitizeFixture), null);
  assert.equal(createAnalyticsEvent('affiliate_click', { page_type: 'home' }, '2026-08-01', 'corr', sanitizeFixture), null);
});

test('RBAC audits permitted and blocked actions without PII, secrets, or privilege escalation', () => {
  const blocked = decideAdminAction({ requestId: 'request-1', actorId: 'viewer', role: 'viewer', action: 'override', targetType: 'offer', targetId: 'of-1', reason: 'no privilege', approval: approval('destructive'), before: { state: 'a' }, after: { state: 'b' }, now: NOW });
  assert.equal(blocked.allowed, false); assert.equal(blocked.audit.outcome, 'blocked'); assert.equal(blocked.audit.before, null);
  const pii = decideAdminAction({ requestId: 'request-2', actorId: 'admin', role: 'admin', action: 'override', targetType: 'offer', targetId: 'of-1', reason: 'email a@b.com', approval: approval('destructive'), before: null, after: null, now: NOW });
  assert.equal(pii.allowed, false);
  const secretSnapshot = decideAdminAction({ requestId: 'request-3', actorId: 'admin', role: 'admin', action: 'override', targetType: 'offer', targetId: 'of-1', reason: 'source verified', approval: approval('destructive'), before: { token: 'abc' }, after: null, now: NOW });
  assert.equal(secretSnapshot.allowed, false); assert.equal(secretSnapshot.audit.before, null);
  const invalidMetadata = decideAdminAction({ requestId: 'bad request', actorId: 'admin bad', role: 'admin', action: 'override', targetType: 'offer bad', targetId: 'of-1', reason: 'source verified', approval: null, before: null, after: null, now: '2026-08-01' });
  assert.equal(invalidMetadata.allowed, false); assert.equal(invalidMetadata.audit.actorId, 'unknown');
  const allowed = decideAdminAction({ requestId: 'request-4', actorId: 'admin', role: 'admin', action: 'override', targetType: 'offer', targetId: 'of-1', reason: 'source verified', approval: approval('destructive'), before: { state: 'pending' }, after: { state: 'suppressed' }, now: NOW });
  const different = decideAdminAction({ requestId: 'request-5', actorId: 'admin', role: 'admin', action: 'override', targetType: 'offer', targetId: 'of-1', reason: 'source verified', approval: approval('destructive'), before: null, after: null, now: NOW });
  assert.equal(allowed.allowed, true); assert.equal(allowed.audit.approvalId, 'approval-destructive'); assert.notEqual(allowed.audit.id, different.audit.id); assert.match(allowed.audit.traceId, /^trace:/);
});
