/**
 * Block 10 shared-data contracts. This module deliberately reuses the canonical
 * Block 8, Block 9, experiment, and analytics contracts instead of copying them.
 * It is pure and does not open a database connection.
 */
import type { ExperimentDefinition } from '../../experiments.ts';
import type { CompatibilityNode } from '../block9/domain.ts';

export type {
  ProductVariant, Merchant, Offer, PriceSnapshot, TrendSignal, TrendTopic,
  DealCandidate, ConfidenceLevel, MarketCode, CurrencyCode,
} from '../block8/domain.ts';
export { RETRY_DEFAULTS, nowUtc, toStrictUtc } from '../block8/domain.ts';
export type { ExperimentDefinition } from '../../experiments.ts';
/** Product-only identity linked to Block 9; graph-only fields are intentionally absent. */
export type Product = Pick<CompatibilityNode, 'id' | 'slug' | 'market'> & Readonly<{
  source: 'catalog' | 'manual' | 'block9';
  state: 'draft' | 'active' | 'archived' | 'unknown';
  createdAt: string;
  updatedAt: string;
}>;
export type Experiment = ExperimentDefinition;
export type ApprovalAction = 'publish' | 'spend' | 'destructive' | 'legal_privacy' | 'replay' | 'rollback' | 'kill_switch' | 'feature_enable' | 'experiment_activate';
export type ApprovalState = 'requested' | 'approved' | 'rejected' | 'revoked';
export interface HumanApproval { id: string; action: ApprovalAction; actorId: string; state: ApprovalState; reason: string; approvedAt: string | null; expiresAt: string | null; }

/** Rejects calendar-normalized values (for example 2026-02-30), not only offsets. */
export function strictUtc(value: string): string | null {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/.exec(value);
  if (!match) return null;
  const parsed = new Date(value); if (Number.isNaN(parsed.getTime())) return null;
  const expected = `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`;
  return parsed.toISOString() === expected ? parsed.toISOString() : null;
}

export type ContentAssetState = 'draft' | 'review' | 'published' | 'archived' | 'unknown';
export type CampaignState = 'draft' | 'approved' | 'active' | 'paused' | 'completed' | 'unknown';
export type AuditOutcome = 'applied' | 'blocked' | 'rejected' | 'no_change';

export interface ContentAsset {
  id: string;
  productId: string | null;
  state: ContentAssetState;
  source: string;
  version: string;
  approvalId: string | null;
  publicationCount: number;
  publicationLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  state: CampaignState;
  source: string;
  version: string;
  spendLimitMinor: number;
  spentMinor: number;
  approvalId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Analytics remains an adapter to `sanitizeEvent`; raw payloads are forbidden. */
export type AnalyticsEvent = Readonly<{
  name: string;
  payload: Readonly<Record<string, string | number>>;
  occurredAt: string;
  traceId: string;
  source: 'analytics-sanitizer';
  idempotencyKey: string;
}>;

/**
 * Lifecycle preferences and consent are projections of the existing Block 7
 * tables/views (`lifecycle_preferences`, `lifecycle_consent_history`), not new
 * application-owned records. These are read-only projections, not ownership.
 */
export type UserPreference = Readonly<{
  source: 'lifecycle_preferences'; userId: string; version: number; categories: readonly string[];
  market: string; frequency: 'weekly' | 'monthly' | 'important-only'; types: readonly string[];
  consented: boolean; status: 'active' | 'unsubscribed'; suppressionReason: string | null;
  consentedAt: string | null; updatedAt: string;
}>;
export type ConsentRecord = Readonly<{
  source: 'lifecycle_consent_history'; userId: string; consentVersion: number;
  action: 'granted' | 'updated' | 'unsubscribed'; suppressionReason: string | null; recordedAt: string;
}>;

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  approvalId: string | null;
  outcome: AuditOutcome;
  traceId: string;
  source: 'block10-admin';
  recordedAt: string;
  before: Readonly<Record<string, unknown>> | null;
  after: Readonly<Record<string, unknown>> | null;
}
