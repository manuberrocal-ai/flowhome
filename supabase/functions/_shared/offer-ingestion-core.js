/**
 * Block 8 — Server-side ingestion worker core (Edge Function safe).
 *
 * Mirrors the lifecycle worker contract:
 *  - unique idempotency_key per job,
 *  - retry only on safeToRetry failures, dead on uncertain outcomes,
 *  - hard cap on attempts before dead-letter,
 *  - pure policy helpers exported for unit testing.
 *
 * This module imports the shared retry policy from the Block 8 client surface
 * (it is ESM-safe and has no fetch import) so Edge Functions and tests share
 * exactly one retry decision path. Production activation is externally
 * blocked; see docs/BLOCK8_OFFER_TREND_RUNBOOK.md for activation steps.
 */
import { RETRY_DEFAULTS } from '../../../src/lib/blocks/block8/domain.ts';
import { decideRetry, retryDelayMs } from '../../../src/lib/blocks/block8/retry.ts';

export const JOB_STATES = Object.freeze(['pending', 'claimed', 'retry', 'dead', 'inserted', 'duplicate', 'rejected']);
export const MAX_ATTEMPTS = RETRY_DEFAULTS.maxAttempts;

/** Exponential backoff in seconds, compatible with the lifecycle worker. */
export function retryDelaySeconds(attempts, opts = RETRY_DEFAULTS) {
  return Math.floor(retryDelayMs(attempts, opts) / 1000);
}

export function nextRetryAt(attempts, now = Date.now(), opts = RETRY_DEFAULTS) {
  const delay = retryDelayMs(attempts, opts);
  return new Date(now + delay).toISOString();
}

/**
 * Apply the retry and dedupe policy to one claimed ingestion job. The caller
 * owns the durable idempotency-key store; this function is pure and total.
 *
 * The provider MUST return `{ state: 'inserted'|'duplicate'|'rejected',
 * confirmed: true }` on a deterministic ingest, and either:
 *   - throw with `error.safeToRetry = true` for transient failures, or
 *   - return `{ state: '...', confirmed: false }` for uncertain results.
 * Uncertain results never retry; they go to `dead` immediately.
 */
export async function processClaimedIngestionJob({ job, provider, now = Date.now(), opts = RETRY_DEFAULTS }) {
  if ((job.attempts || 0) >= MAX_ATTEMPTS) return { state: 'dead', nextAttemptAt: null };
  try {
    const result = await provider.send({
      variantId: job.variant_id,
      merchantId: job.merchant_id,
      idempotencyKey: job.idempotency_key,
      payload: job.payload,
    });
    if (result?.confirmed === true && (result.state === 'inserted' || result.state === 'duplicate' || result.state === 'rejected')) {
      return { state: result.state, nextAttemptAt: null };
    }
    return { state: 'dead', nextAttemptAt: null };
  } catch (error) {
    if (error?.safeToRetry === true && (job.attempts || 0) + 1 < MAX_ATTEMPTS) {
      return { state: 'retry', nextAttemptAt: nextRetryAt((job.attempts || 0) + 1, now, opts) };
    }
    return { state: 'dead', nextAttemptAt: null };
  }
}

/** Re-export the policy decision for tests that prefer the modular form. */
export { decideRetry };