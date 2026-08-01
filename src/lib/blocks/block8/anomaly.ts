/**
 * Block 8 — Price anomaly detection.
 *
 * @packageDocumentation
 *
 * Flags implausible price deltas before they enter DealScore. An anomaly is
 * rejected at ingestion: the snapshot is kept for audit but never contributes
 * to scoring or promotions. The function is pure and deterministic.
 */
import { ANOMALY_DEFAULTS } from './domain.ts';

export interface AnomalyContext {
  /** Previous good snapshot price, or null when there is no baseline. */
  previousPrice: number | null;
  /** Optional ordered history of good prices (oldest first); used for MAD. */
  history?: number[];
  /** Optional override for tests; defaults to `ANOMALY_DEFAULTS`. */
  thresholds?: Partial<typeof ANOMALY_DEFAULTS>;
}

export interface AnomalyDecision {
  anomaly: boolean;
  /** Stable reason code; null when not anomalous. */
  reason: 'relative_threshold' | 'mad_outlier' | 'absolute_floor' | 'absolute_ceiling' | 'no_baseline' | null;
  /** The threshold actually applied, for the audit trail. */
  applied: typeof ANOMALY_DEFAULTS;
  /** Intermediate computed values used by the check, no PII. */
  details: { relativeDelta: number | null; mad: number | null };
}

function medianAbsoluteDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const deviations = sorted.map((v) => Math.abs(v - median));
  deviations.sort((a, b) => a - b);
  return deviations.length % 2 === 0
    ? (deviations[deviations.length / 2 - 1] + deviations[deviations.length / 2]) / 2
    : deviations[Math.floor(deviations.length / 2)];
}

/**
 * Decide whether a candidate price is anomalous. Pure function; no side effects
 * and no I/O. Anomalies never block ingestion of other rows in the same batch.
 */
export function detectPriceAnomaly(
  candidatePrice: number,
  ctx: AnomalyContext,
): AnomalyDecision {
  const applied = { ...ANOMALY_DEFAULTS, ...ctx.thresholds };
  const emptyDetails = { relativeDelta: null as number | null, mad: null as number | null };

  if (!Number.isFinite(candidatePrice) || candidatePrice <= 0) {
    return { anomaly: true, reason: 'absolute_floor', applied, details: emptyDetails };
  }
  if (candidatePrice < applied.absoluteFloor) {
    return { anomaly: true, reason: 'absolute_floor', applied, details: emptyDetails };
  }
  if (candidatePrice > applied.absoluteCeiling) {
    return { anomaly: true, reason: 'absolute_ceiling', applied, details: emptyDetails };
  }

  const history = (ctx.history ?? []).filter((v) => Number.isFinite(v) && v > 0);
  if (history.length >= 4) {
    const mad = medianAbsoluteDeviation(history);
    if (mad > 0 && Math.abs(candidatePrice - history[history.length - 1]) > applied.madMultiplier * mad) {
      return {
        anomaly: true,
        reason: 'mad_outlier',
        applied,
        details: {
          relativeDelta: history[history.length - 1] > 0
            ? (candidatePrice - history[history.length - 1]) / history[history.length - 1]
            : null,
          mad,
        },
      };
    }
  }

  if (ctx.previousPrice != null && ctx.previousPrice > 0) {
    const relativeDelta = Math.abs(candidatePrice - ctx.previousPrice) / ctx.previousPrice;
    if (relativeDelta > applied.relativeThreshold) {
      return {
        anomaly: true,
        reason: 'relative_threshold',
        applied,
        details: { relativeDelta, mad: null },
      };
    }
    return {
      anomaly: false,
      reason: null,
      applied,
      details: { relativeDelta, mad: null },
    };
  }

  return { anomaly: false, reason: 'no_baseline', applied, details: emptyDetails };
}