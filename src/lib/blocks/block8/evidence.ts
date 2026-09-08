/** Reviewed local evidence, supplied by a trusted caller, never inferred from payload labels. */
import { FRESHNESS_WINDOWS_MS, toStrictUtc, type Merchant, type Offer, type PriceSnapshot, type ProductVariant } from './domain.ts';
import { canonicalContent } from './idempotency.ts';

export type KnownVariants = ReadonlyArray<Pick<ProductVariant, 'id' | 'marketplaceId' | 'marketplaceIdType' | 'market' | 'currency'>>;
export type KnownMerchants = ReadonlyArray<Pick<Merchant, 'id' | 'authorised' | 'market' | 'currency'>>;
export type CommercialObservation = Pick<PriceSnapshot, 'variantId' | 'merchantId' | 'market' | 'currency' | 'source' | 'price' | 'listPrice' | 'capturedAt'>;
export type EvidencedOffer = CommercialObservation & Pick<Offer, 'lastSnapshotId' | 'availability' | 'availabilityCapturedAt' | 'expiresAt' | 'lifecycle' | 'review'>;

export interface SourcePermission {
  permissionId: string;
  source: 'amazon-creators-api' | 'affiliate-feed';
  merchantId: string;
  market: Merchant['market'];
  currency: Merchant['currency'];
  state: 'approved' | 'revoked' | 'unknown';
  validFrom: string;
  validUntil: string;
  currentPriceAllowed: boolean;
  /** May narrow, never extend the 24-hour current-price ceiling. */
  maxAgeMs: number;
  /** Separate documented rights, not implied by API access or cache permission. */
  history?: { permissionId: string; floorClaimsAllowed: boolean; retainForMs: number };
}

export interface CommercialEvidenceContext {
  knownMerchants: KnownMerchants;
  knownVariants: KnownVariants;
  snapshotsById: ReadonlyMap<string, PriceSnapshot>;
  sourcePermissions?: readonly SourcePermission[];
}

const safeId = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9:_-]{1,160}$/i.test(value);
export const validPrice = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function validateObservationIdentity(observation: CommercialObservation, context: CommercialEvidenceContext): string | null {
  if (!validPrice(observation.price) || (observation.listPrice != null && (!validPrice(observation.listPrice) || observation.listPrice < observation.price))) return 'invalid_price';
  const merchants = context.knownMerchants.filter((item) => item.id === observation.merchantId);
  if (merchants.length !== 1 || merchants[0].authorised !== true) return 'merchant_not_authorised';
  const variants = context.knownVariants.filter((item) => item.id === observation.variantId);
  if (variants.length !== 1) return 'unknown_or_ambiguous_variant';
  if (observation.market === 'unknown' || variants[0].market !== observation.market || merchants[0].market !== observation.market) return 'market_mismatch';
  if (observation.currency === 'unknown' || variants[0].currency !== observation.currency || merchants[0].currency !== observation.currency) return 'currency_mismatch';
  return null;
}

export function sourcePermissionFor(observation: CommercialObservation, context: CommercialEvidenceContext, now: Date | string, historical = false): SourcePermission | null {
  const current = toStrictUtc(now); const captured = toStrictUtc(observation.capturedAt);
  if (!current || !captured || !['amazon-creators-api', 'affiliate-feed'].includes(observation.source)) return null;
  const grants = (context.sourcePermissions ?? []).filter((grant) => grant.source === observation.source && grant.merchantId === observation.merchantId && grant.market === observation.market && grant.currency === observation.currency);
  if (grants.length !== 1) return null;
  const grant = grants[0]; const starts = toStrictUtc(grant.validFrom); const ends = toStrictUtc(grant.validUntil);
  if (grant.state !== 'approved' || grant.currentPriceAllowed !== true || !safeId(grant.permissionId) || !starts || !ends) return null;
  const at = Date.parse(current); const capture = Date.parse(captured);
  if (Date.parse(starts) > capture || capture > at || at >= Date.parse(ends) || Date.parse(starts) >= Date.parse(ends)) return null;
  if (!Number.isSafeInteger(grant.maxAgeMs) || grant.maxAgeMs <= 0 || grant.maxAgeMs > FRESHNESS_WINDOWS_MS.price) return null;
  let maxAge = grant.maxAgeMs;
  if (historical) {
    const history = grant.history;
    if (!history || history.floorClaimsAllowed !== true || !safeId(history.permissionId) || history.permissionId === grant.permissionId || !Number.isSafeInteger(history.retainForMs) || history.retainForMs <= 0) return null;
    if (grant.source === 'amazon-creators-api' && history.retainForMs > FRESHNESS_WINDOWS_MS.price) return null;
    maxAge = history.retainForMs;
  }
  return at - capture < maxAge ? grant : null;
}

function sameObservation(left: CommercialObservation, right: CommercialObservation): boolean {
  return left.variantId === right.variantId && left.merchantId === right.merchantId && left.market === right.market && left.currency === right.currency && left.source === right.source && left.price === right.price && (left.listPrice ?? null) === (right.listPrice ?? null) && toStrictUtc(left.capturedAt) === toStrictUtc(right.capturedAt);
}

/** Re-resolves the original observation on every ingest, promotion and score. */
export function validateCommercialEvidence(offer: CommercialObservation & { lastSnapshotId?: string | null; expiresAt?: string | null }, context: CommercialEvidenceContext | undefined, now: Date | string): string | null {
  if (!context) return 'commercial_evidence_required';
  if (!toStrictUtc(now)) return 'invalid_reference';
  const identityError = validateObservationIdentity(offer, context);
  if (identityError) return identityError;
  if (!offer.lastSnapshotId) return 'missing_authorised_snapshot';
  const snapshot = context.snapshotsById.get(offer.lastSnapshotId);
  if (!snapshot || snapshot.id !== offer.lastSnapshotId) return 'unknown_snapshot';
  if (snapshot.anomaly !== false) return 'snapshot_anomalous';
  if (!sameObservation(snapshot, offer)) return 'snapshot_incoherent';
  const grant = sourcePermissionFor(snapshot, context, now);
  if (!grant) return 'source_permission_or_freshness_missing';
  if (offer.expiresAt != null) {
    const expires = toStrictUtc(offer.expiresAt); const capture = Date.parse(toStrictUtc(offer.capturedAt)!);
    if (!expires || Date.parse(expires) <= capture || Date.parse(expires) > Math.min(capture + grant.maxAgeMs, Date.parse(grant.validUntil))) return 'expiry_exceeds_permission';
  }
  return null;
}

/** Returns only distinct, linked, permitted observations. Any incoherent row fails closed. */
export function authorisedHistory(offer: CommercialObservation, history: readonly PriceSnapshot[], context: CommercialEvidenceContext | undefined, now: Date | string): PriceSnapshot[] {
  if (!context || !sourcePermissionFor(offer, context, now, true)) return [];
  const observations = new Map<string, string>(); const ids = new Set<string>(); const keys = new Set<string>(); const accepted: PriceSnapshot[] = [];
  for (const snapshot of history) {
    const stored = context.snapshotsById.get(snapshot.id);
    if (!stored || stored.id !== snapshot.id || snapshot.anomaly !== false || validateObservationIdentity(snapshot, context) || !sourcePermissionFor(snapshot, context, now, true)) return [];
    if (snapshot.variantId !== offer.variantId || snapshot.merchantId !== offer.merchantId || snapshot.market !== offer.market || snapshot.currency !== offer.currency || snapshot.source !== offer.source || !sameObservation(snapshot, stored) || stored.anomaly !== false || snapshot.idempotencyKey !== stored.idempotencyKey || !safeId(snapshot.id) || !safeId(snapshot.idempotencyKey)) return [];
    const observationKey = canonicalContent([snapshot.source, snapshot.variantId, snapshot.merchantId, snapshot.market, snapshot.currency, toStrictUtc(snapshot.capturedAt)]);
    const content = canonicalContent([snapshot.price, snapshot.listPrice ?? null]);
    if (observations.has(observationKey)) {
      if (observations.get(observationKey) !== content) return [];
      continue;
    }
    if (ids.has(snapshot.id) || keys.has(snapshot.idempotencyKey)) return [];
    observations.set(observationKey, content); ids.add(snapshot.id); keys.add(snapshot.idempotencyKey); accepted.push(snapshot);
  }
  return accepted;
}
