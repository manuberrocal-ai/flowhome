/** Pure, deterministic resilience contracts for Block 10 workers. */
import { buildIdempotencyKey } from '../block8/ingestion.ts';
import { decideRetry } from '../block8/retry.ts';
import { RETRY_DEFAULTS } from '../block8/domain.ts';
import { strictUtc, type HumanApproval } from './domain.ts';

export type JobState = 'pending' | 'claimed' | 'retry' | 'dead' | 'completed';
export type FailureClass = 'retryable' | 'uncertain' | 'permanent';
export interface TraceContext { traceId: string; correlationId: string; source: string; }
export interface QueueJob<T = unknown> extends TraceContext {
  id: string; idempotencyKey: string; partition: string; payload: T; state: JobState;
  attempts: number; availableAt: string; leaseToken: string | null; leaseOwnerId: string | null; leaseExpiresAt: string | null;
  failureClass: FailureClass | null; failureReason: string | null; createdAt: string; updatedAt: string;
}
export interface JobInput<T> { source: string; partition: string; payload: T; idempotencyParts: readonly (string | number)[]; correlationId: string; now: string; }

export function traceFor(source: string, correlationId: string): TraceContext {
  const safeSource = /^[a-z0-9:_-]{1,80}$/i.test(source) ? source : 'unknown';
  const safeCorrelation = /^[a-z0-9:_-]{1,120}$/i.test(correlationId) ? correlationId : 'uncorrelated';
  return { source: safeSource, correlationId: safeCorrelation, traceId: buildIdempotencyKey('trace', [safeSource, safeCorrelation]) };
}

export function createJob<T>(input: JobInput<T>): QueueJob<T> {
  const now = strictUtc(input.now);
  if (!now) throw new Error('invalid_now');
  const trace = traceFor(input.source, input.correlationId);
  const idempotencyKey = buildIdempotencyKey('job', [input.source, input.partition, ...input.idempotencyParts]);
  if (!/^[a-z0-9:_-]{1,80}$/i.test(input.source) || !/^[a-z0-9:_-]{1,160}$/i.test(input.partition)) throw new Error('invalid_source_or_partition');
  return { ...trace, id: buildIdempotencyKey('jobid', [idempotencyKey]), idempotencyKey, partition: input.partition, payload: input.payload, state: 'pending', attempts: 0, availableAt: now, leaseToken: null, leaseOwnerId: null, leaseExpiresAt: null, failureClass: null, failureReason: null, createdAt: now, updatedAt: now };
}

export function enqueueJob<T>(jobs: readonly QueueJob<T>[], input: JobInput<T>): { job: QueueJob<T>; status: 'enqueued' | 'duplicate' } {
  const candidate = createJob(input);
  const duplicate = jobs.find((job) => job.idempotencyKey === candidate.idempotencyKey);
  return duplicate ? { job: duplicate, status: 'duplicate' } : { job: candidate, status: 'enqueued' };
}

/** Exactly one stable job is claimed; an expired lease is safely reclaimed. */
export function claimNext<T>(jobs: readonly QueueJob<T>[], workerId: string, now: string, leaseMs = 60_000): { jobs: QueueJob<T>[]; claimed: QueueJob<T> | null } {
  const strictNow = strictUtc(now);
  if (!strictNow || !/^[a-z0-9:_-]{1,80}$/i.test(workerId) || leaseMs < 1) return { jobs: [...jobs], claimed: null };
  const at = Date.parse(strictNow);
  if (!Number.isFinite(at)) return { jobs: [...jobs], claimed: null };
  const candidate = [...jobs].filter((job) => { const availableAt = strictUtc(job.availableAt); const leaseExpiresAt = job.leaseExpiresAt ? strictUtc(job.leaseExpiresAt) : null; return job.attempts < RETRY_DEFAULTS.maxAttempts && (((job.state === 'pending' || job.state === 'retry') && availableAt !== null && Date.parse(availableAt) <= at) || (job.state === 'claimed' && leaseExpiresAt !== null && Date.parse(leaseExpiresAt) <= at)); })
    .sort((a, b) => a.availableAt.localeCompare(b.availableAt) || a.id.localeCompare(b.id))[0];
  if (!candidate) return { jobs: [...jobs], claimed: null };
  const leaseToken = buildIdempotencyKey('lease', [candidate.id, workerId, now, candidate.attempts + 1]);
  const claimed = { ...candidate, state: 'claimed' as const, attempts: candidate.attempts + 1, leaseToken, leaseOwnerId: workerId, leaseExpiresAt: new Date(at + leaseMs).toISOString(), updatedAt: strictNow };
  return { claimed, jobs: jobs.map((job) => job.id === claimed.id ? claimed : job) };
}

export function finishClaim<T>(job: QueueJob<T>, workerId: string, leaseToken: string, outcome: { confirmed?: boolean; safeToRetry?: boolean; state: 'sent' | 'mock' | 'failed' }, now: string, rng: () => number = () => 0.5): QueueJob<T> {
  const strictNow = strictUtc(now);
  const leaseExpiresAt = job.leaseExpiresAt ? strictUtc(job.leaseExpiresAt) : null;
  if (!strictNow || job.state !== 'claimed' || job.leaseOwnerId !== workerId || job.leaseToken !== leaseToken || !leaseExpiresAt || Date.parse(leaseExpiresAt) <= Date.parse(strictNow)) return job;
  const decision = decideRetry(job.attempts, { state: outcome.state === 'failed' ? 'dead' : outcome.state, confirmed: outcome.confirmed, safeToRetry: outcome.safeToRetry }, RETRY_DEFAULTS, strictNow, rng);
  const failureClass: FailureClass | null = decision.state === 'retry' ? 'retryable' : decision.state === 'dead' ? (outcome.safeToRetry ? 'permanent' : 'uncertain') : null;
  return { ...job, state: decision.state === 'retry' ? 'retry' : decision.state === 'dead' ? 'dead' : 'completed', availableAt: decision.nextAttemptAt ?? job.availableAt, leaseToken: null, leaseOwnerId: null, leaseExpiresAt: null, failureClass, failureReason: decision.reason, updatedAt: strictNow };
}

/** Manual replay never replays uncertain outcomes and requires a reviewed approval. */
export interface ReplayRequest { jobId: string; approvalId: string; reason: string; traceId: string; requestedAt: string; }
export function isCurrentApproval(approval: HumanApproval | null, action: HumanApproval['action'], now: string): boolean {
  const current = strictUtc(now); const approvedAt = approval?.approvedAt ? strictUtc(approval.approvedAt) : null; const expiresAt = approval?.expiresAt ? strictUtc(approval.expiresAt) : null;
  return Boolean(current && approval && /^[A-Za-z0-9:_-]{1,160}$/.test(approval.id) && /^[A-Za-z0-9:_-]{1,160}$/.test(approval.actorId) && approval.action === action && approval.state === 'approved' && approvedAt && Date.parse(approvedAt) <= Date.parse(current) && (!expiresAt || Date.parse(expiresAt) > Date.parse(current)));
}
export function replayDeadLetter<T>(job: QueueJob<T>, approval: HumanApproval | null, now: string): { job: QueueJob<T>; allowed: boolean; reason: string; replayRequest: ReplayRequest | null } {
  const strictNow = strictUtc(now);
  if (job.state !== 'dead') return { job, allowed: false, reason: 'not_dead_letter', replayRequest: null };
  if (job.failureClass === 'uncertain') return { job, allowed: false, reason: 'uncertain_outcome_never_replayed', replayRequest: null };
  if (!strictNow || !approval || !isCurrentApproval(approval, 'replay', strictNow)) return { job, allowed: false, reason: 'reviewed_approval_required', replayRequest: null };
  const replayRequest = { jobId: job.id, approvalId: approval.id, reason: approval.reason.trim().slice(0, 120), traceId: job.traceId, requestedAt: strictNow };
  return { job: { ...job, state: 'pending', attempts: 0, availableAt: strictNow, failureClass: null, failureReason: `manual_replay:${replayRequest.reason}`, updatedAt: strictNow }, allowed: true, reason: 'requeued_after_review', replayRequest };
}

export interface RateLimit { source: string; limit: number; windowMs: number; }
export function evaluateRateLimit(limit: RateLimit, observedAt: readonly string[], now: string): { allowed: boolean; retryAt: string | null; remaining: number } {
  const strictNow = strictUtc(now); const at = strictNow ? Date.parse(strictNow) : Number.NaN;
  if (!Number.isFinite(at) || limit.limit < 1 || limit.windowMs < 1) return { allowed: false, retryAt: null, remaining: 0 };
  const inWindow = observedAt.map(strictUtc).filter((value): value is string => value !== null).map(Date.parse).filter((value) => value > at - limit.windowMs && value <= at).sort((a, b) => a - b);
  if (inWindow.length < limit.limit) return { allowed: true, retryAt: null, remaining: limit.limit - inWindow.length };
  return { allowed: false, retryAt: new Date(inWindow[0] + limit.windowMs).toISOString(), remaining: 0 };
}

export interface AlertDecision { alert: boolean; severity: 'none' | 'warning' | 'critical'; reason: string; traceId: string; }
export function decideAlert(input: { trace: TraceContext; failed: number; total: number; lagMs: number; threshold: number; }): AlertDecision {
  if (input.total < 1 || input.threshold < 0) return { alert: false, severity: 'none', reason: 'invalid_sample', traceId: input.trace.traceId };
  const ratio = input.failed / input.total;
  const critical = ratio >= input.threshold || input.lagMs >= 15 * 60_000;
  return { alert: critical || ratio > 0, severity: critical ? 'critical' : ratio > 0 ? 'warning' : 'none', reason: critical ? 'threshold_or_lag_exceeded' : ratio > 0 ? 'partial_failure' : 'healthy', traceId: input.trace.traceId };
}

/** Isolates errors by item and partition so one outage cannot erase healthy work. */
export async function processPartition<T, R>(items: readonly T[], run: (item: T) => Promise<R>): Promise<Array<{ ok: true; value: R } | { ok: false; reason: 'item_failed' }>> {
  return Promise.all(items.map(async (item) => { try { return { ok: true as const, value: await run(item) }; } catch { return { ok: false as const, reason: 'item_failed' as const }; } }));
}
