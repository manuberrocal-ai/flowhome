/**
 * Block 8 — Freshness & expiry windows for offer/price/trend data.
 *
 * @packageDocumentation
 *
 * Reuses the strict-UTC philosophy from `deal-state.ts` and `commerce-data.ts`,
 * but operates on Block 8 entities (`Offer`, `PriceSnapshot`, `TrendSignal`).
 * A stale or expired offer is never promotable and never receives a price-floor
 * claim; `unknown` stays `unknown`.
 */
import type { Offer, PriceSnapshot, TrendSignal, ConfidenceLevel } from './domain.ts';
import { FRESHNESS_WINDOWS_MS, toStrictUtc } from './domain.ts';
import { validateCommercialEvidence, availabilityPermissionFor, type CommercialEvidenceContext, type EvidencedOffer } from './evidence.ts';

export interface FreshnessResult {
  /** True when the entity's `capturedAt` is within its useable window. */
  fresh: boolean;
  /** True when the entity has crossed its absolute expiry boundary. */
  expired: boolean;
  /** Age in milliseconds since `capturedAt`; NaN when no usable timestamp. */
  ageMs: number;
  /** Authorised timestamp used for the computation (strict UTC). */
  reference: string;
  /** Stable reason code; surfaces to admin review without PII. */
  reason: 'fresh' | 'stale' | 'expired' | 'unknown_captured_at' | 'invalid_reference' | 'invalid_expiry';
}

function age(capturedAt: string | null | undefined, now: Date): { ageMs: number; capturedIso: string | null } {
  const capturedIso = toStrictUtc(capturedAt ?? null);
  if (!capturedIso) return { ageMs: NaN, capturedIso: null };
  return { ageMs: now.getTime() - new Date(capturedIso).getTime(), capturedIso };
}

function evaluate(
  captured: string | null | undefined,
  expiresAt: string | null | undefined,
  windowMs: number,
  now: Date | string,
): FreshnessResult {
  const reference = toStrictUtc(now);
  if (!reference) return { fresh: false, expired: false, ageMs: NaN, reference: '', reason: 'invalid_reference' };
  const at = new Date(reference);
  const { ageMs, capturedIso } = age(captured, at);
  if (!capturedIso) {
    return { fresh: false, expired: false, ageMs: NaN, reference, reason: 'unknown_captured_at' };
  }
  const fresh = ageMs >= 0 && ageMs < windowMs;
  const expiresIso = toStrictUtc(expiresAt ?? null);
  if (expiresAt != null && (!expiresIso || Date.parse(expiresIso) <= Date.parse(capturedIso) || Date.parse(expiresIso) > Date.parse(capturedIso) + windowMs)) return { fresh: false, expired: false, ageMs, reference, reason: 'invalid_expiry' };
  const expired = expiresIso != null && at.getTime() >= new Date(expiresIso).getTime();
  if (expired) return { fresh: false, expired: true, ageMs, reference, reason: 'expired' };
  if (!fresh) return { fresh: false, expired: false, ageMs, reference, reason: 'stale' };
  return { fresh: true, expired: false, ageMs, reference, reason: 'fresh' };
}

/** True when a price snapshot is within the price freshness window. */
export function isPriceSnapshotFresh(
  snapshot: Pick<PriceSnapshot, 'capturedAt'>,
  now: Date | string = new Date(),
): FreshnessResult {
  return evaluate(snapshot.capturedAt, null, FRESHNESS_WINDOWS_MS.price, now);
}

/** Evaluates offer freshness and its own `expiresAt` boundary together. */
export function evaluateOfferFreshness(
  offer: Pick<Offer, 'capturedAt' | 'expiresAt'>,
  now: Date | string = new Date(),
): FreshnessResult {
  return evaluate(offer.capturedAt, offer.expiresAt, FRESHNESS_WINDOWS_MS.price, now);
}

/** True when an offer's independently captured availability is less than 24h old. */
export function isOfferAvailabilityFresh(
  offer: Pick<Offer, 'availabilityCapturedAt'>,
  now: Date | string = new Date(),
): FreshnessResult {
  return evaluate(offer.availabilityCapturedAt, null, FRESHNESS_WINDOWS_MS.availability, now);
}

/** True when a trend signal is within its trend window. */
export function isTrendSignalFresh(
  signal: Pick<TrendSignal, 'capturedAt'>,
  now: Date | string = new Date(),
): FreshnessResult {
  return evaluate(signal.capturedAt, null, FRESHNESS_WINDOWS_MS.trend, now);
}

/** A promotable offer is active, approved, price/availability fresh, and in stock. */
export function isOfferPromotable(
  offer: EvidencedOffer,
  now: Date | string = new Date(),
  evidence?: CommercialEvidenceContext,
): { promotable: boolean; reason: string } {
  if (offer.lifecycle !== 'active') {
    return { promotable: false, reason: `lifecycle:${offer.lifecycle}` };
  }
  if (offer.review !== 'approved') {
    return { promotable: false, reason: `review:${offer.review}` };
  }
  if (!offer.lastSnapshotId) {
    return { promotable: false, reason: 'snapshot:missing_verified_snapshot' };
  }
  const f = evaluate(offer.capturedAt, offer.expiresAt, FRESHNESS_WINDOWS_MS.price, now);
  if (f.reason !== 'fresh') return { promotable: false, reason: `freshness:${f.reason}` };
  const evidenceError = validateCommercialEvidence(offer, evidence, now);
  if (evidenceError) return { promotable: false, reason: `evidence:${evidenceError}` };
  if (offer.availability !== 'in-stock') return { promotable: false, reason: `availability:${offer.availability}` };
  const availabilityFreshness = isOfferAvailabilityFresh(offer, now);
  if (availabilityFreshness.reason !== 'fresh') return { promotable: false, reason: `availability_freshness:${availabilityFreshness.reason}` };
  if (!availabilityPermissionFor({ ...offer, capturedAt: offer.availabilityCapturedAt }, evidence!, now)) return { promotable: false, reason: 'availability_permission_missing' };
  return { promotable: true, reason: 'promotable' };
}

/** Confidence degrades gracefully as the captured-at timestamp ages. */
export function confidenceFromFreshness(
  result: FreshnessResult,
  baseConfidence: ConfidenceLevel = 'medium',
): ConfidenceLevel {
  if (['unknown_captured_at', 'invalid_reference', 'invalid_expiry'].includes(result.reason)) return 'unknown';
  if (result.reason === 'expired') return 'low';
  if (result.reason === 'stale') return baseConfidence === 'high' ? 'medium' : 'low';
  return baseConfidence;
}
