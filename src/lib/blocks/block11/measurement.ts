import { strictUtc } from '../block10/domain.ts';

export type ImportableMeasurementSource = 'manual_export' | 'official_api';
export type MeasurementSource = ImportableMeasurementSource | 'unknown';
export type AttributionObservation = Readonly<{
  contentId: string; campaignId: string; variantId: string; source: MeasurementSource; observedAt: string;
  metrics: Readonly<{ impressions: number; clicks: number; conversions: number }>;
}>;
const ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;
const TOP_LEVEL_KEYS = ['contentId', 'campaignId', 'variantId', 'source', 'observedAt', 'metrics'];
const METRIC_KEYS = ['impressions', 'clicks', 'conversions'];
export type AttributionAssessment = Readonly<{ importable: boolean; status: 'valid' | 'draft_unknown' | 'invalid'; reason: string | null }>;

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value); return keys.length === expected.length && keys.every((key) => expected.includes(key));
}

/** Aggregate-only attribution: it intentionally has no click ID, email, query, or referrer field. */
export function assessAttribution(observation: unknown): AttributionAssessment {
  if (!observation || typeof observation !== 'object' || Array.isArray(observation) || !exactKeys(observation as Record<string, unknown>, TOP_LEVEL_KEYS)) return { importable: false, status: 'invalid', reason: 'attribution_top_level_keys_invalid' };
  const candidate = observation as Record<string, unknown>;
  if (![candidate.contentId, candidate.campaignId, candidate.variantId].every((value) => typeof value === 'string' && ID.test(value)) || !strictUtc(candidate.observedAt as string)) return { importable: false, status: 'invalid', reason: 'attribution_identity_or_time_invalid' };
  if (!candidate.metrics || typeof candidate.metrics !== 'object' || Array.isArray(candidate.metrics) || !exactKeys(candidate.metrics as Record<string, unknown>, METRIC_KEYS)) return { importable: false, status: 'invalid', reason: 'attribution_metric_keys_invalid' };
  if (!Object.values(candidate.metrics as Record<string, unknown>).every((value) => typeof value === 'number' && Number.isInteger(value) && value >= 0)) return { importable: false, status: 'invalid', reason: 'aggregate_metrics_must_be_nonnegative_integers' };
  if (candidate.source === 'unknown') return { importable: false, status: 'draft_unknown', reason: 'unknown_source_not_importable' };
  if (!['manual_export', 'official_api'].includes(candidate.source as string)) return { importable: false, status: 'invalid', reason: 'attribution_source_invalid' };
  return { importable: true, status: 'valid', reason: null };
}

export function validateAttribution(observation: unknown): string | null {
  const assessed = assessAttribution(observation); return assessed.importable ? null : assessed.reason;
}
