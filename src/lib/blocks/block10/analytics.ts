/** Runtime adapter: canonical analytics sanitizer and strict UTC are mandatory. */
import { buildIdempotencyKey } from '../block8/ingestion.ts';
import { strictUtc } from './domain.ts';
import type { AnalyticsEvent } from './domain.ts';
import { traceFor } from './operations.ts';

type AnalyticsSanitizer = typeof import('../../analytics.ts')['sanitizeEvent'];

export function createAnalyticsEvent(name: string, payload: Record<string, unknown>, occurredAt: string, correlationId: string, sanitize: AnalyticsSanitizer): AnalyticsEvent | null {
  const clean = sanitize(name, payload);
  const at = strictUtc(occurredAt);
  if (!clean || !at) return null;
  const trace = traceFor('analytics-sanitizer', correlationId);
  return { name, payload: clean, occurredAt: at, traceId: trace.traceId, source: 'analytics-sanitizer', idempotencyKey: buildIdempotencyKey('analytics', [name, at, trace.traceId]) };
}
