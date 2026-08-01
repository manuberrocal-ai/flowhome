/**
 * Block 8 — Retry & backoff policy (pure, deterministic).
 *
 * @packageDocumentation
 *
 * Mirrors `lifecycle-core.js` retry semantics: only explicit `safeToRetry`
 * failures are requeued; uncertain send outcomes become `dead`, never replayed.
 * The maximum attempts cap matches the lifecycle worker (`RETRY_DEFAULTS`).
 * This module is policy only — it never performs I/O; callers apply the result.
 */
import { RETRY_DEFAULTS } from './domain.ts';

export type SendState = 'mock' | 'sent' | 'retry' | 'dead';

export type SendStateLike = string;

export type SendOutcome<State extends SendStateLike = SendState> = {
  state: State;
  confirmed?: boolean;
  safeToRetry?: boolean;
};

export interface ProviderLike {
  send(): Promise<SendOutcome>;
}

export interface RetryDecision {
  state: SendState;
  /** Absolute UTC instant the next attempt is allowed, or null when terminal. */
  nextAttemptAt: string | null;
  /** Delay applied in ms, for audit and observability. */
  delayMs: number;
  /** Stable reason code, no PII. */
  reason: string;
}

/** Exponential backoff with bounded full jitter, capped at `maxDelayMs`. */
export function retryDelayMs(
  attempts: number,
  opts: typeof RETRY_DEFAULTS = RETRY_DEFAULTS,
  rng: () => number = Math.random,
): number {
  const n = Math.max(1, attempts);
  const base = opts.baseDelayMs * 2 ** (n - 1);
  const capped = Math.min(base, opts.maxDelayMs);
  const sample = rng();
  const boundedSample = Number.isFinite(sample) ? Math.max(0, Math.min(sample, 1 - Number.EPSILON)) : 0;
  return Math.floor(capped * boundedSample);
}

/** Backoff version compatible with `lifecycle-core.retryDelaySeconds` callers. */
export function retryDelaySeconds(attempts: number, opts: typeof RETRY_DEFAULTS = RETRY_DEFAULTS, rng: () => number = Math.random): number {
  return Math.floor(retryDelayMs(attempts, opts, rng) / 1000);
}

/**
 * Apply the retry policy to one send attempt. Pure and total over inputs.
 *
 * - `mock` confirmed send → terminal `mock`, no retry.
 * - `sent` confirmed send → terminal `sent`, no retry.
 * - Hard error with `safeToRetry=true` and attempts below cap → `retry`.
 * - Any uncertain / failed-without-`safeToRetry` outcome → `dead`.
 * - Once attempts reach `maxAttempts`, any retryable failure becomes `dead`.
 */
export function decideRetry(
  attempt: number,
  outcome: SendOutcome,
  opts: typeof RETRY_DEFAULTS = RETRY_DEFAULTS,
  now: Date | string = new Date(),
  rng: () => number = Math.random,
): RetryDecision {
  const ref = now instanceof Date ? now : new Date(now);
  const attempts = Math.max(1, attempt);

  if ((outcome.state === 'mock' || outcome.state === 'sent') && outcome.confirmed === true) {
    return { state: outcome.state as SendState, nextAttemptAt: null, delayMs: 0, reason: `terminal:${outcome.state}` };
  }
  if (outcome.safeToRetry === true && attempts < opts.maxAttempts) {
    const delay = retryDelayMs(attempts, opts, rng);
    return {
      state: 'retry',
      nextAttemptAt: delay > 0 ? new Date(ref.getTime() + delay).toISOString() : ref.toISOString(),
      delayMs: delay,
      reason: `retry:attempt_${attempts}`,
    };
  }
  if (outcome.safeToRetry !== true) {
    return { state: 'dead', nextAttemptAt: null, delayMs: 0, reason: 'unsafe_or_uncertain' };
  }
  return { state: 'dead', nextAttemptAt: null, delayMs: 0, reason: `dead:attempts_${attempts}` };
}

/**
 * Wrap a provider send invocation with the retry policy. Returns the final
 * outcome for a single claimed job; idempotency key + claimed state are owned
 * by the caller (mirrors `lifecycle-core.processClaimedJob`).
 */
export async function processClaimedSend(
  attempts: number,
  provider: ProviderLike,
  opts: typeof RETRY_DEFAULTS = RETRY_DEFAULTS,
  now: Date | string = new Date(),
  rng: () => number = Math.random,
): Promise<RetryDecision> {
  let outcome: SendOutcome;
  try {
    outcome = await provider.send();
  } catch (error) {
    const anyError = error as { safeToRetry?: boolean };
    outcome = { state: 'dead', safeToRetry: anyError?.safeToRetry === true, confirmed: false };
  }
  return decideRetry(attempts, outcome, opts, now, rng);
}
