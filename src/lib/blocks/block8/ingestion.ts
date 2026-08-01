/**
 * Block 8 — Idempotent ingestion interfaces for offers, price snapshots, and
 * trend signals. Deduplication, variant resolution, anomaly enrichment, and
 * partial-failure isolation are implemented here.
 *
 * @packageDocumentation
 *
 * Ingestion is pure and synchronous; the caller owns the durable store. Every
 * input batch is reduced into per-row outcomes. A failing row never aborts the
 * surrounding rows, and a fully anomalous batch still returns resolved rows
 * flagged `rejected` rather than throwing. Production activation is externally
 * blocked; fixtures live in `data/blocks/block8/fixtures.json`.
 */
import type {
  Coupon,
  Merchant,
  Offer,
  PriceSnapshot,
  ProductVariant,
  ShippingTerms,
  TrendSignal,
} from './domain.ts';
import { toStrictUtc } from './domain.ts';
import { detectPriceAnomaly } from './anomaly.ts';
import { evaluateOfferFreshness } from './freshness.ts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IngestStatus = 'inserted' | 'duplicate' | 'rejected' | 'updated';

export interface IngestOutcome<T> {
  status: IngestStatus;
  entity: T | null;
  reason: string;
  idempotencyKey: string;
}

export interface PriceSnapshotInput {
  variantId: string;
  merchantId: string;
  price: number;
  listPrice?: number | null;
  currency?: string;
  market?: string;
  source?: string;
  capturedAt: string;
  affiliateUrl?: string | null;
}

export interface OfferInput {
  variantId: string;
  merchantId: string;
  market: string;
  currency: string;
  price: number;
  listPrice?: number | null;
  availability?: string;
  shipping?: Partial<ShippingTerms> | null;
  coupons?: Coupon[];
  affiliateUrl?: string | null;
  source?: string;
  capturedAt: string;
  availabilityCapturedAt: string;
  expiresAt?: string | null;
  snapshotId?: string | null;
}

export interface TrendSignalInput {
  topicId: string;
  source?: string;
  delta: number;
  weight?: number;
  capturedAt: string;
}

/** A registry frozen at ingestion time — the caller passes the known set. */
export type KnownVariants = ReadonlyArray<Pick<ProductVariant, 'id' | 'marketplaceId' | 'marketplaceIdType' | 'market' | 'currency'>>;

/** Registry of merchants already authorised at ingestion time. */
export type KnownMerchants = ReadonlyArray<Pick<Merchant, 'id' | 'authorised' | 'market' | 'currency'>>;

export interface IngestionContext {
  knownMerchants: KnownMerchants;
  knownVariants: KnownVariants;
  /** Existing snapshot ids already in the store (for duplicate detection). */
  existingSnapshotKeys: ReadonlySet<string>;
  existingOfferKeys: ReadonlySet<string>;
  existingTrendKeys: ReadonlySet<string>;
  /** Existing persisted snapshots eligible to back an offer. */
  snapshotsById: ReadonlyMap<string, Pick<PriceSnapshot, 'id' | 'variantId' | 'merchantId' | 'price' | 'anomaly'>>;
  /** Existing good-snapshot prices per variant, oldest first. */
  historyByVariant: ReadonlyMap<string, number[]>;
}

// ---------------------------------------------------------------------------
// Idempotency key builder (stable, content-based FNV-1a hash)
// ---------------------------------------------------------------------------

/**
 * Build a content-based idempotency key. Pure and stable; the seed and
 * multiplier are fixed so re-runs reproduce the same key byte-for-byte.
 */
export function buildIdempotencyKey(prefix: string, parts: (string | number)[]): string {
  let hash = 0x811c9dc5;
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  const digest = (hash >>> 0).toString(16).padStart(8, '0');
  return `${prefix}:${digest}`;
}

// ---------------------------------------------------------------------------
// Variant resolution
// ---------------------------------------------------------------------------

/**
 * Resolves an incoming `(marketplaceId, marketplaceIdType)` pair to a known
 * variant, or returns null. Name-based fuzzy matching is forbidden; only
 * authorised marketplace ids resolve variants.
 */
export function resolveVariant(
  known: KnownVariants,
  marketplaceId: string | null,
  marketplaceIdType: 'asin' | 'sku' | 'gtin' | 'unknown',
): { variantId: string | null; reason: 'resolved' | 'no_marketplace_id' | 'unknown_type' | 'unmatched' } {
  if (!marketplaceId) return { variantId: null, reason: 'no_marketplace_id' };
  if (marketplaceIdType === 'unknown') return { variantId: null, reason: 'unknown_type' };
  const match = known.find((v) => v.marketplaceId === marketplaceId && v.marketplaceIdType === marketplaceIdType);
  if (!match) return { variantId: null, reason: 'unmatched' };
  return { variantId: match.id, reason: 'resolved' };
}

// ---------------------------------------------------------------------------
// Durable id generation (the caller persists these)
// ---------------------------------------------------------------------------

function deterministicId(prefix: string, key: string): string {
  return buildIdempotencyKey(prefix, [key]);
}

// ---------------------------------------------------------------------------
// Key composition helpers
// ---------------------------------------------------------------------------

function snapshotKey(input: PriceSnapshotInput, capturedIso: string): string {
  return buildIdempotencyKey('ps', [
    input.variantId,
    input.merchantId,
    input.price,
    input.source ?? 'manual',
    capturedIso,
  ]);
}

function offerKey(input: OfferInput, capturedIso: string): string {
  return buildIdempotencyKey('of', [
    input.variantId,
    input.merchantId,
    input.price,
    input.source ?? 'manual',
    capturedIso,
  ]);
}

function trendKey(input: TrendSignalInput, capturedIso: string): string {
  return buildIdempotencyKey('ts', [input.topicId, input.source ?? 'manual', input.delta, capturedIso]);
}

const OFFER_SOURCES = ['manual', 'affiliate-feed', 'amazon-creators-api'] as const;
const MARKETS = ['US', 'CA', 'MX', 'GB', 'DE', 'ES'] as const;
const CURRENCIES = ['USD', 'CAD', 'MXN', 'GBP', 'EUR'] as const;

function isCanonicalOfferSource(value: string | undefined): value is (typeof OFFER_SOURCES)[number] {
  return value != null && (OFFER_SOURCES as readonly string[]).includes(value);
}

function isCanonicalMarket(value: string | undefined): value is (typeof MARKETS)[number] {
  return value != null && (MARKETS as readonly string[]).includes(value);
}

function isCanonicalCurrency(value: string | undefined): value is (typeof CURRENCIES)[number] {
  return value != null && (CURRENCIES as readonly string[]).includes(value);
}

function validateOfferCoherence(input: OfferInput, ctx: IngestionContext): string | null {
  if (!isCanonicalOfferSource(input.source)) return 'invalid_offer_source';
  if (!isCanonicalMarket(input.market)) return 'invalid_market';
  if (!isCanonicalCurrency(input.currency)) return 'invalid_currency';
  const merchant = ctx.knownMerchants.find((m) => m.id === input.merchantId);
  if (!merchant || !merchant.authorised) return 'merchant_not_authorised';
  const variant = ctx.knownVariants.find((v) => v.id === input.variantId);
  if (!variant) return 'unknown_variant';
  if (variant.market !== input.market || merchant.market !== input.market) return 'market_mismatch';
  if (variant.currency !== input.currency || merchant.currency !== input.currency) return 'currency_mismatch';
  return null;
}

function validateOfferSnapshot(input: OfferInput, ctx: IngestionContext): string | null {
  if (!input.snapshotId) return 'missing_authorised_snapshot';
  const snapshot = ctx.snapshotsById.get(input.snapshotId);
  if (!snapshot) return 'unknown_snapshot';
  const merchant = ctx.knownMerchants.find((m) => m.id === snapshot.merchantId);
  if (!merchant || !merchant.authorised) return 'snapshot_merchant_not_authorised';
  if (snapshot.anomaly) return 'snapshot_anomalous';
  if (snapshot.variantId !== input.variantId || snapshot.merchantId !== input.merchantId || snapshot.price !== input.price) {
    return 'snapshot_incoherent';
  }
  return null;
}

function validateSnapshotCoherence(input: PriceSnapshotInput, ctx: IngestionContext): string | null {
  if (!isCanonicalOfferSource(input.source)) return 'invalid_offer_source';
  if (!isCanonicalMarket(input.market)) return 'invalid_market';
  if (!isCanonicalCurrency(input.currency)) return 'invalid_currency';
  const merchant = ctx.knownMerchants.find((m) => m.id === input.merchantId);
  if (!merchant || !merchant.authorised) return 'merchant_not_authorised';
  const variant = ctx.knownVariants.find((v) => v.id === input.variantId);
  if (!variant) return 'unknown_variant';
  if (variant.market !== input.market || merchant.market !== input.market) return 'market_mismatch';
  if (variant.currency !== input.currency || merchant.currency !== input.currency) return 'currency_mismatch';
  return null;
}

// ---------------------------------------------------------------------------
// Snapshot ingestion (dedup + anomaly enrichment)
// ---------------------------------------------------------------------------

/**
 * Ingest price snapshots. Anomalies are flagged but kept; the caller retains
 * them for audit, but they never feed DealScore (enforced in `scoring.ts`).
 */
export function ingestPriceSnapshots(
  inputs: PriceSnapshotInput[],
  ctx: IngestionContext,
  _now: Date | string = new Date(),
): IngestOutcome<PriceSnapshot>[] {
  const out: IngestOutcome<PriceSnapshot>[] = [];
  const seenKeys = new Set(ctx.existingSnapshotKeys);
  for (const input of inputs) {
    const capturedIso = toStrictUtc(input.capturedAt);
    if (!capturedIso) {
      out.push({ status: 'rejected', entity: null, reason: 'invalid_captured_at', idempotencyKey: '' });
      continue;
    }
    const validationError = validateSnapshotCoherence(input, ctx);
    if (validationError) {
      out.push({ status: 'rejected', entity: null, reason: validationError, idempotencyKey: '' });
      continue;
    }
    const key = snapshotKey(input, capturedIso);
    if (seenKeys.has(key)) {
      out.push({ status: 'duplicate', entity: null, reason: 'duplicate_snapshot_key', idempotencyKey: key });
      continue;
    }
    const previous = (ctx.historyByVariant.get(input.variantId) ?? []).at(-1) ?? null;
    const decision = detectPriceAnomaly(input.price, {
      previousPrice: Number.isFinite(previous ?? NaN) ? (previous as number) : null,
      history: ctx.historyByVariant.get(input.variantId) ?? [],
    });
    const entity: PriceSnapshot = {
      id: deterministicId('ps', key),
      variantId: input.variantId,
      merchantId: input.merchantId,
      price: input.price,
      listPrice: input.listPrice ?? null,
      currency: (input.currency as PriceSnapshot['currency']) ?? 'USD',
      market: (input.market as PriceSnapshot['market']) ?? 'US',
      source: (input.source as PriceSnapshot['source']) ?? 'manual',
      capturedAt: capturedIso,
      idempotencyKey: key,
      anomaly: decision.anomaly,
      affiliateUrl: input.affiliateUrl ?? null,
    };
    seenKeys.add(key);
    out.push({ status: 'inserted', entity, reason: decision.anomaly ? 'anomaly_detected_kept_for_audit' : 'snapshot_accepted', idempotencyKey: key });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Offer ingestion (dedup + freshness + lifecycle)
// ---------------------------------------------------------------------------

/**
 * Ingest offers. Stale or expired offers are inserted with lifecycle `suppressed`
 * and `review=unknown`; they are never promotable until an admin review upgrades
 * them after freshness has been re-established. Idempotency is by `offerKey`.
 */
export function ingestOffers(
  inputs: OfferInput[],
  ctx: IngestionContext,
  now: Date | string = new Date(),
): IngestOutcome<Offer>[] {
  const refDate = now instanceof Date ? now : new Date(now);
  const out: IngestOutcome<Offer>[] = [];
  const seenKeys = new Set(ctx.existingOfferKeys);
  for (const input of inputs) {
    const capturedIso = toStrictUtc(input.capturedAt);
    if (!capturedIso) {
      out.push({ status: 'rejected', entity: null, reason: 'invalid_captured_at', idempotencyKey: '' });
      continue;
    }
    const availabilityCapturedIso = toStrictUtc(input.availabilityCapturedAt);
    if (!availabilityCapturedIso) {
      out.push({ status: 'rejected', entity: null, reason: 'invalid_availability_captured_at', idempotencyKey: '' });
      continue;
    }
    const validationError = validateOfferCoherence(input, ctx);
    if (validationError) {
      out.push({ status: 'rejected', entity: null, reason: validationError, idempotencyKey: '' });
      continue;
    }
    const snapshotError = validateOfferSnapshot(input, ctx);
    if (snapshotError) {
      out.push({ status: 'rejected', entity: null, reason: snapshotError, idempotencyKey: '' });
      continue;
    }
    const key = offerKey(input, capturedIso);
    if (seenKeys.has(key)) {
      out.push({ status: 'duplicate', entity: null, reason: 'duplicate_offer_key', idempotencyKey: key });
      continue;
    }
    const expiresIso = toStrictUtc(input.expiresAt ?? null);
    const freshness = evaluateOfferFreshness({ capturedAt: capturedIso, expiresAt: expiresIso }, refDate);
    const lifecycle: Offer['lifecycle'] = freshness.reason === 'fresh' ? 'pending_review' : 'suppressed';
    const entity: Offer = {
      id: deterministicId('of', key),
      variantId: input.variantId,
      merchantId: input.merchantId,
      market: input.market as Offer['market'],
      currency: input.currency as Offer['currency'],
      price: input.price,
      listPrice: input.listPrice ?? null,
      availability: (input.availability as Offer['availability']) ?? 'unknown',
      availabilityCapturedAt: availabilityCapturedIso,
      shipping: {
        cost: input.shipping?.cost ?? null,
        freeShipping: input.shipping?.freeShipping ?? false,
        conditions: input.shipping?.conditions ?? null,
        etaDays: input.shipping?.etaDays ?? null,
      },
      coupons: input.coupons ?? [],
      affiliateUrl: input.affiliateUrl ?? null,
      source: (input.source as Offer['source']) ?? 'manual',
      capturedAt: capturedIso,
      expiresAt: expiresIso,
      lastSnapshotId: input.snapshotId ?? null,
      lifecycle,
      review: 'unknown',
      confidence: lifecycle === 'pending_review' ? 'low' : 'unknown',
    };
    seenKeys.add(key);
    out.push({
      status: 'inserted',
      entity,
      reason: lifecycle === 'pending_review' ? 'offer_pending_review' : 'offer_suppressed_freshness',
      idempotencyKey: key,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Trend signal ingestion (dedup + anomaly + freshness)
// ---------------------------------------------------------------------------

/**
 * Ingest trend signals. Anomaly is a soft signal: the row is kept but flagged
 * so TrendScore can down-weight it. Partial-failure isolation per row.
 */
export function ingestTrendSignals(
  inputs: TrendSignalInput[],
  ctx: IngestionContext,
  _now: Date | string = new Date(),
): IngestOutcome<TrendSignal>[] {
  const out: IngestOutcome<TrendSignal>[] = [];
  const seenKeys = new Set(ctx.existingTrendKeys);
  for (const input of inputs) {
    const capturedIso = toStrictUtc(input.capturedAt);
    if (!capturedIso) {
      out.push({ status: 'rejected', entity: null, reason: 'invalid_captured_at', idempotencyKey: '' });
      continue;
    }
    const key = trendKey(input, capturedIso);
    if (seenKeys.has(key)) {
      out.push({ status: 'duplicate', entity: null, reason: 'duplicate_trend_key', idempotencyKey: key });
      continue;
    }
    const weight = Math.min(1, Math.max(0, input.weight ?? 0.5));
    let anomaly = false;
    const delta = Number(input.delta);
    if (!Number.isFinite(delta) || Math.abs(delta) > 1) {
      // Domain invariants cap delta at [-1, 1]; out-of-range rows are anomalous.
      anomaly = true;
    }
    const entity: TrendSignal = {
      id: deterministicId('ts', key),
      topicId: input.topicId,
      source: (input.source as TrendSignal['source']) ?? 'manual',
      delta: Number.isFinite(delta) ? Math.max(-1, Math.min(1, delta)) : 0,
      weight,
      capturedAt: capturedIso,
      idempotencyKey: key,
      anomaly,
    };
    seenKeys.add(key);
    out.push({
      status: 'inserted',
      entity,
      reason: anomaly ? 'trend_anomaly_out_of_range_delta' : 'trend_signal_accepted',
      idempotencyKey: key,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Batch summary (partial-failure isolation evidence)
// ---------------------------------------------------------------------------

export interface IngestionSummary {
  total: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  updated: number;
  anomalyKept: number;
}

export function summariseIngestion(outcomes: { status: IngestStatus; reason: string }[]): IngestionSummary {
  const summary: IngestionSummary = { total: outcomes.length, inserted: 0, duplicates: 0, rejected: 0, updated: 0, anomalyKept: 0 };
  for (const o of outcomes) {
    if (o.status === 'inserted') summary.inserted += 1;
    else if (o.status === 'duplicate') summary.duplicates += 1;
    else if (o.status === 'rejected') summary.rejected += 1;
    else if (o.status === 'updated') summary.updated += 1;
    if (o.reason.includes('anomaly')) summary.anomalyKept += 1;
  }
  return summary;
}
