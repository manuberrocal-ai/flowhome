/**
 * Block 8 — Offer / price / trend domain contracts.
 *
 * @packageDocumentation
 *
 * Authorised data model for offers, price snapshots, trend signals, and
 * deal candidates. All timestamps are strict UTC ISO-8601 strings
 * (e.g. "2026-07-30T12:00:00Z"); date-only strings are intentionally NOT
 * accepted here to remove day-boundary ambiguity for captured-at instants.
 *
 * This module is data only — no network I/O, no scraping, no provider calls.
 * Production activation is externally blocked; see
 * [`docs/BLOCK8_OFFER_TREND_RUNBOOK.md`](../../../docs/BLOCK8_OFFER_TREND_RUNBOOK.md).
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/** Canonical offer lifecycle. `unknown` is never equivalent to `active`. */
export type OfferLifecycle = 'pending_review' | 'active' | 'suppressed' | 'expired' | 'unknown';

/** Admin review verdict applied to a flagged offer or trend signal. */
export type ReviewVerdict = 'approved' | 'rejected' | 'pending' | 'overridden' | 'unknown';

/** Human-supplied override reason codes, always recorded on the audit trail. */
export type AdminActionType = 'override_promote' | 'override_suppress' | 'reset' | 'expire_now' | 'anomaly_acknowledge';

/** Confidence band for any scored entity. `unknown` is never `high`. */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

/** Canonical availability values aligned with Schema.org ItemAvailability. */
export type AvailabilityStatus = 'in-stock' | 'out-of-stock' | 'preorder' | 'discontinued' | 'unknown';

/** Authorised data sources. `Unknown` is the only accepted inactive value. */
export type OfferSource = 'manual' | 'affiliate-feed' | 'amazon-creators-api' | 'Unknown';

export type TrendSource = 'manual' | 'affiliate-feed' | 'Unknown';

/** Markets use ISO 3166-1 alpha-2 country codes; currency uses ISO 4217. */
export type MarketCode = 'US' | 'CA' | 'MX' | 'GB' | 'DE' | 'ES' | 'unknown';
export type CurrencyCode = 'USD' | 'CAD' | 'MXN' | 'GBP' | 'EUR' | 'unknown';

/** DealScore label is the only claim surfaced to visitors; it is conservative. */
export type DealScoreLabel = 'lowest_price' | 'good_deal' | 'fair_price' | 'unknown';

/** TrendScore label describes direction with confidence, never a forecast. */
export type TrendScoreLabel = 'rising' | 'falling' | 'stable' | 'unknown';

// ---------------------------------------------------------------------------
// Strict UTC timestamp helpers
// ---------------------------------------------------------------------------

const STRICT_UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

/** Returns a normalised UTC ISO string or `null` when the value is not strict UTC. */
export function toStrictUtc(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  const trimmed = value.trim();
  if (!STRICT_UTC_ISO.test(trimmed)) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function nowUtc(now?: Date | string): string {
  const ref = now instanceof Date ? now : now ? new Date(now) : new Date();
  return ref.toISOString();
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * A merchant is the affiliate-linked retailer; never auto-discovered from
 * scraped content. `authorised` is the gate that allows offers to be ingested.
 */
export interface Merchant {
  id: string;
  /** Canonical retailer name (display only); not used for matching. */
  name: string;
  /** Authorised retailer domain (e.g. "amazon.com") or null. */
  domain: string | null;
  market: MarketCode;
  currency: CurrencyCode;
  /** Affiliate programme tag/code constant, not a secret. */
  affiliateTag: string | null;
  authorised: boolean;
}

/**
 * A product variant is the exact purchasable unit (ASIN, SKU, GTIN, etc).
 * The same product across markets or colours yields separate variants.
 */
export interface ProductVariant {
  id: string;
  productId: string;
  /** Stable marketplace identifier (ASIN, SKU, GTIN-13, …). */
  marketplaceId: string | null;
  marketplaceIdType: 'asin' | 'sku' | 'gtin' | 'unknown';
  title: string;
  market: MarketCode;
  currency: CurrencyCode;
  category: string | null;
}

/**
 * A price snapshot is an immutable captured-at observation for one variant at
 * one merchant. It is the only input DealScore uses to reason about history.
 */
export interface PriceSnapshot {
  id: string;
  variantId: string;
  merchantId: string;
  price: number;
  listPrice: number | null;
  currency: CurrencyCode;
  /** ISO 3166-1 alpha-2 country the snapshot applies to. */
  market: MarketCode;
  source: OfferSource;
  capturedAt: string;
  /** Idempotency key (source+merchant+variant+capturedAt+price+nonce). */
  idempotencyKey: string;
  /** Flagged when anomaly detection rejected an implausible price delta. */
  anomaly: boolean;
  /** Same-store direct affiliate URL validated locally; null when unavailable. */
  affiliateUrl: string | null;
}

/** A coupon attached to an offer, with explicit conditions (no auto-claim). */
export interface Coupon {
  id: string;
  code: string | null;
  /** Absolute discount in `currency` units; mutually exclusive with pct. */
  amountOff: number | null;
  /** Percentage discount in 0–100; mutually exclusive with amountOff. */
  pctOff: number | null;
  /** Minimum cart subtotal required to apply, in `currency` units. */
  minSubtotal: number | null;
  /** Human-readable conditions, displayed verbatim to the visitor. */
  conditions: string | null;
  /**
   * Explicit result of evaluating every coupon condition against the modeled
   * inputs. `null` means eligibility is unknown and cannot affect DealScore.
   */
  conditionsSatisfied: boolean | null;
  /** UTC instant the coupon expires; expired coupons never reduce prices. */
  expiresAt: string | null;
}

/** Shipping terms; never inferred from retailer pages. */
export interface ShippingTerms {
  /** Lowest available shipping cost in `currency` units, or null when unknown. */
  cost: number | null;
  /** True when a free-shipping offer is documented; never implied. */
  freeShipping: boolean;
  /** Eligibility summary, displayed verbatim; null when unknown. */
  conditions: string | null;
  /** Estimated lead time in days, or null when unknown. */
  etaDays: number | null;
}

/** An offer is one merchant's current commercial terms for one variant. */
export interface Offer {
  id: string;
  variantId: string;
  merchantId: string;
  market: MarketCode;
  currency: CurrencyCode;
  price: number;
  listPrice: number | null;
  availability: AvailabilityStatus;
  /** Strict UTC instant at which `availability` was observed. */
  availabilityCapturedAt: string;
  shipping: ShippingTerms;
  coupons: Coupon[];
  affiliateUrl: string | null;
  source: OfferSource;
  capturedAt: string;
  /** UTC instant after which the offer is considered stale and unpromotable. */
  expiresAt: string | null;
  /** Verified non-anomalous price snapshot backing this offer; required to promote or score it. */
  lastSnapshotId: string | null;
  lifecycle: OfferLifecycle;
  review: ReviewVerdict;
  /** Computed at ingestion time; never user-editable; recalculated on update. */
  confidence: ConfidenceLevel;
}

/** A trend topic aggregates signals around one product / category / query. */
export interface TrendTopic {
  id: string;
  /** Stable slug such as a product slug or category key. */
  slug: string;
  market: MarketCode;
  label: string;
  /** Whether enough authorised history exists to publish any direction. */
  eligible: boolean;
}

/** A trend signal is one authorised observation feeding TrendScore. */
export interface TrendSignal {
  id: string;
  topicId: string;
  source: TrendSource;
  /** Signed normalised delta in [-1, 1]; positive = rising, negative = falling. */
  delta: number;
  /** Authority weight in (0, 1]; signals from unproven sources carry < 0.5. */
  weight: number;
  capturedAt: string;
  idempotencyKey: string;
  anomaly: boolean;
}

/** A deal candidate is the explainable object surfaced to the surface pages. */
export interface DealCandidate {
  id: string;
  variantId: string;
  offerId: string | null;
  topicId: string | null;
  market: MarketCode;
  currency: CurrencyCode;
  /** Computed instantaneous score; immutable per snapshot of inputs. */
  dealScore: DealScoreBreakdown;
  trendScore: TrendScoreBreakdown;
  /** Label safe to surface; never implies a price-floor claim alone. */
  label: DealScoreLabel;
  /** True only when a fresh, authorised, reviewed offer promotes it. */
  promotable: boolean;
  /** UTC instant the candidate was generated; never older than the offer it wraps. */
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Score breakdowns (explainable)
// ---------------------------------------------------------------------------

/** One weighted input feeding DealScore, with a stable reason string. */
export interface DealScoreFactor {
  key: string;
  /** Raw input value used by the factor (clamped/normalised). */
  value: number;
  /** Weight applied in [0, 1]; weights sum across all factors to 1. */
  weight: number;
  /** Penalty applied in [0, 1]; subtracted from the weighted contribution. */
  penalty: number;
  /** Raw weighted contribution = value * weight - penalty. */
  contribution: number;
  /** Stable human-readable explanation, surfaced without PII or claims. */
  reason: string;
}

export interface DealScoreBreakdown {
  total: number;
  label: DealScoreLabel;
  confidence: ConfidenceLevel;
  factors: DealScoreFactor[];
  /** True only when authorised history and fresh verification back the score. */
  verified: boolean;
  /** Stable note explaining whether/how a price-floor claim may be surfaced. */
  floorClaim: string;
}

export interface TrendScoreFactor {
  key: string;
  value: number;
  weight: number;
  contribution: number;
  reason: string;
}

export interface TrendScoreBreakdown {
  total: number;
  label: TrendScoreLabel;
  confidence: ConfidenceLevel;
  factors: TrendScoreFactor[];
  /** True only when enough authorised signals back the direction. */
  verified: boolean;
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

/** An immutable audit record for any admin review/override action. */
export interface AdminAuditEntry {
  id: string;
  /** Target entity id (offer, trend signal, deal candidate). */
  targetId: string;
  targetType: 'offer' | 'trend_signal' | 'deal_candidate';
  action: AdminActionType;
  /** Field names touched by the override, for replay/rollback analysis. */
  fields: string[];
  /** Verbatim reviewer note (plain text, no PII). */
  note: string | null;
  actorId: string;
  /** UTC instant the action was recorded. */
  recordedAt: string;
  /** Snapshot of the affected fields before the override (string-keyed). */
  before: Record<string, unknown> | null;
  /** Snapshot of the affected fields after the override (string-keyed). */
  after: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Configuration constants (defaults; override via ingestion policies)
// ---------------------------------------------------------------------------

export const FRESHNESS_WINDOWS_MS = {
  /** Price snapshot usable age for DealScore, mirrors commerce-data priceMs. */
  price: 7 * 24 * 60 * 60 * 1000,
  /** Availability freshness mirrors commerce-data availabilityMs. */
  availability: 24 * 60 * 60 * 1000,
  /** Trend signal usable age; longer than price to allow weekly aggregates. */
  trend: 14 * 24 * 60 * 60 * 1000,
  /** Price snapshot retained for history even after it leaves the fresh window. */
  history: 90 * 24 * 60 * 60 * 1000,
} as const;

export const ANOMALY_DEFAULTS = {
  /** A price move beyond 40% of the previous good snapshot is anomalous. */
  relativeThreshold: 0.4,
  /** A price move beyond 5x the rolling median absolute deviation is anomalous. */
  madMultiplier: 5,
  /** Reject prices below this absolute floor (filters scrape-feed $0 errors). */
  absoluteFloor: 0.5,
  /** Reject prices above this absolute ceiling (filters k/M formatting errors). */
  absoluteCeiling: 1_000_000,
} as const;

export const RETRY_DEFAULTS = {
  /** Hard cap on send attempts before the job moves to dead-letter. */
  maxAttempts: 5,
  /** Base delay in ms for the first retry; multiplied by 2^(attempt-1). */
  baseDelayMs: 1_000,
  /** Maximum jittered delay between retries to avoid thundering herds. */
  maxDelayMs: 5 * 60 * 1_000,
} as const;
