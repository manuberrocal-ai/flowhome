/**
 * Block 8 — Explainable DealScore & TrendScore baselines.
 *
 * @packageDocumentation
 *
 * Design principles (mirrors the project canonical contracts):
 *
 * 1. `unknown` stays `unknown`. A score never collapses an unknown input into a
 *    confident claim — a missing sufficient authorised history yields
 *    `confidence='unknown'` and `label='unknown'`.
 * 2. **No claim without proof.** `lowest_price`, `good_deal`, `best ever` and
 *    `super deal` labels are never produced without (a) authorised history and
 *    (b) fresh verification. Stale or expired offers are scored `verified=false`
 *    and labelled `unknown` regardless of price.
 * 3. **Determinism.** The same inputs + reference instant MUST produce the same
 *    breakdown byte-for-byte. No `Math.random`, no `Date.now`, no time drift.
 * 4. **Explainability.** Every score is a list of weighted factors with stable
 *    reason strings; the visitor-facing copy is conservative ("price snapshot",
 *    "price last checked") and never manufacturer's claims.
 *
 * Inputs are pure; the caller passes the offer, its authorised price history
 * (oldest first), and the trend signals to weigh. Production activation is
 * externally blocked; see [`docs/BLOCK8_OFFER_TREND_RUNBOOK.md`](../../../docs/BLOCK8_OFFER_TREND_RUNBOOK.md).
 */
import type {
  ConfidenceLevel,
  DealScoreBreakdown,
  DealScoreFactor,
  DealScoreLabel,
  Offer,
  PriceSnapshot,
  TrendScoreBreakdown,
  TrendScoreFactor,
  TrendSignal,
} from './domain.ts';
import { FRESHNESS_WINDOWS_MS } from './domain.ts';
import { toStrictUtc } from './domain.ts';
import { isOfferPromotable } from './freshness.ts';

// ---------------------------------------------------------------------------
// Configuration: weights, rewards, penalties (documented)
// ---------------------------------------------------------------------------

export const DEAL_SCORE_WEIGHTS = {
  /** Discount relative to the offer's own `listPrice`. */
  discountVsList: 0.4,
  /** Discount relative to the *lowest* authorised historical good snapshot. */
  discountVsFloor: 0.35,
  /** Shipping penalty (only applied when shipping is non-free and known). */
  shippingPenalty: 0.10,
  /** Coupon uplift, bounded by `MAX_COUPON_UPLIFT`. */
  couponUplift: 0.15,
} as const;

export const MAX_COUPON_UPLIFT = 0.10;

/** Minimum number of authorised good snapshots required for a floor claim. */
export const MIN_HISTORY_FOR_FLOOR_CLAIM = 3;

/** Minimum freshness (ms still within the price window) required for any claim. */
export const MIN_FRESH_MS_FOR_CLAIM = 1;

export interface DealScoreInput {
  offer: Pick<Offer, 'price' | 'listPrice' | 'capturedAt' | 'expiresAt' | 'availability' | 'availabilityCapturedAt' | 'lastSnapshotId' | 'lifecycle' | 'review' | 'shipping' | 'coupons'>;
  /** Authorised good price history for this variant, oldest first. */
  history: Pick<PriceSnapshot, 'price' | 'anomaly' | 'capturedAt'>[];
  now: Date | string;
}

export interface TrendScoreInput {
  signals: Pick<TrendSignal, 'delta' | 'weight' | 'anomaly' | 'capturedAt'>[];
  now: Date | string;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function discountPct(price: number, reference: number | null | undefined): number {
  if (reference == null || reference <= 0 || price <= 0) return 0;
  return clamp((reference - price) / reference, 0, 1);
}

function lowestHistoricalPrice(
  history: DealScoreInput['history'],
  now: Date,
): { price: number | null; count: number } {
  let lowest: number | null = null;
  let count = 0;
  for (const h of history) {
    if (h.anomaly) continue;
    const capturedIso = toStrictUtc(h.capturedAt);
    const captured = capturedIso ? new Date(capturedIso).getTime() : NaN;
    if (!Number.isFinite(captured)) continue;
    const age = now.getTime() - captured;
    if (age < 0 || age > FRESHNESS_WINDOWS_MS.history) continue;
    count += 1;
    if (lowest == null || h.price < lowest) lowest = h.price;
  }
  return { price: lowest, count };
}

// ---------------------------------------------------------------------------
// DealScore (pure, deterministic)
// ---------------------------------------------------------------------------

/**
 * Compute the explainable DealScore breakdown. Returns `verified=false` and
 * `label='unknown'` whenever freshness, authorised history, or review state
 * fall short of a proof — never a price-floor claim without proof.
 */
export function computeDealScore(input: DealScoreInput): DealScoreBreakdown {
  const now = input.now instanceof Date ? input.now : new Date(input.now);
  const promotable = isOfferPromotable(input.offer, now);
  const history = input.history;
  const floor = lowestHistoricalPrice(history, now);
  const factors: DealScoreFactor[] = [];

  // 1. Discount vs list price (input value, weight, penalty)
  const dList = discountPct(input.offer.price, input.offer.listPrice ?? null);
  const listPenalty = input.offer.listPrice == null ? DEAL_SCORE_WEIGHTS.discountVsList : 0;
  const listContribution = clamp(dList * DEAL_SCORE_WEIGHTS.discountVsList - listPenalty, 0, 1);
  factors.push({
    key: 'discount_vs_list',
    value: Number(dList.toFixed(4)),
    weight: DEAL_SCORE_WEIGHTS.discountVsList,
    penalty: Number(listPenalty.toFixed(4)),
    contribution: Number(listContribution.toFixed(4)),
    reason: input.offer.listPrice == null
      ? 'listPrice missing; weight fully penalised so the offer cannot pretend a discount.'
      : `discount ${(dList * 100).toFixed(1)}% vs the offer's list price.`,
  });

  // 2. Discount vs floor (the coldest authoritative comparison)
  const canClaimFloor =
    promotable.promotable && floor.count >= MIN_HISTORY_FOR_FLOOR_CLAIM;
  const floorPenalty = canClaimFloor ? 0 : DEAL_SCORE_WEIGHTS.discountVsFloor;
  const dFloor = floor.price != null && floor.price > 0
    ? discountPct(input.offer.price, floor.price)
    : 0;
  const floorContribution = clamp(dFloor * DEAL_SCORE_WEIGHTS.discountVsFloor - floorPenalty, 0, 1);
  factors.push({
    key: 'discount_vs_floor',
    value: Number(dFloor.toFixed(4)),
    weight: DEAL_SCORE_WEIGHTS.discountVsFloor,
    penalty: Number(floorPenalty.toFixed(4)),
    contribution: Number(floorContribution.toFixed(4)),
    reason: !promotable.promotable
      ? `offer not promotable (${promotable.reason}); floor comparison suppressed.`
      : floor.count < MIN_HISTORY_FOR_FLOOR_CLAIM
        ? `only ${floor.count} authorised snapshot(s); minimum ${MIN_HISTORY_FOR_FLOOR_CLAIM} for any "lowest price" claim.`
        : `price is ${(dFloor * 100).toFixed(1)}% below the lowest authorised historical price (${floor.price}).`,
  });

  // 3. Shipping penalty
  const shipping = input.offer.shipping;
  const nonFreeShipping = shipping != null && shipping.freeShipping === false && shipping.cost != null && shipping.cost > 0;
  const shipPenalty = nonFreeShipping ? DEAL_SCORE_WEIGHTS.shippingPenalty : 0;
  factors.push({
    key: 'shipping',
    value: Number((shipping?.cost ?? 0).toFixed(4)),
    weight: DEAL_SCORE_WEIGHTS.shippingPenalty,
    penalty: Number(shipPenalty.toFixed(4)),
    contribution: Number((-shipPenalty).toFixed(4)),
    reason: nonFreeShipping
      ? `non-free shipping cost ${(shipping?.cost ?? 0).toFixed(2)} reduces the effective discount.`
      : 'free or unknown shipping; no shipping penalty applied.',
  });

  // 4. Coupon uplift (bounded)
  const couponUplift = (input.offer.coupons ?? [])
    .filter((c) => c != null)
    .reduce((sum, c) => {
      const expiresIso = toStrictUtc(c.expiresAt);
      const eligible = expiresIso != null
        && new Date(expiresIso).getTime() > now.getTime()
        && c.conditionsSatisfied === true;
      if (!eligible) return sum;
      const raw = c.pctOff != null ? clamp(c.pctOff / 100, 0, 1) : 0;
      return sum + raw;
    }, 0);
  const cappedUplift = Math.min(couponUplift, MAX_COUPON_UPLIFT);
  const couponContribution = clamp(cappedUplift * DEAL_SCORE_WEIGHTS.couponUplift, 0, 1);
  factors.push({
    key: 'coupon_uplift',
    value: Number(cappedUplift.toFixed(4)),
    weight: DEAL_SCORE_WEIGHTS.couponUplift,
    penalty: 0,
    contribution: Number(couponContribution.toFixed(4)),
    reason: input.offer.coupons == null || input.offer.coupons.length === 0
      ? 'no coupons applied.'
      : cappedUplift === 0
        ? 'no eligible coupon: expiry must be strict future UTC and all modeled conditions must be explicitly satisfied.'
        : `${(cappedUplift * 100).toFixed(1)}% eligible coupon uplift (capped at ${(MAX_COUPON_UPLIFT * 100).toFixed(0)}%).`,
  });

  const total = clamp(factors.reduce((sum, f) => sum + f.contribution, 0), 0, 1);
  const label = deriveDealLabel({
    canClaimFloor,
    promotable: promotable.promotable,
    dFloor,
    total,
  });
  const confidence = deriveDealConfidence({ promotable, floor, hasList: input.offer.listPrice != null });

  const floorClaim = label === 'lowest_price'
    ? 'Lowest authorised price verified from at least 3 good snapshots and a fresh, promotable offer.'
    : canClaimFloor && label === 'good_deal'
      ? 'Good deal: meaningful discount vs list price and proven-floor, but not the verified lowest. No "best ever" claim.'
      : 'No claim: insufficient history, freshness, or review state. Showing "Price snapshot" only.';

  return {
    total: Number(total.toFixed(4)),
    label,
    confidence,
    factors,
    verified: label !== 'unknown' && promotable.promotable,
    floorClaim,
  };
}

interface LabelInput {
  canClaimFloor: boolean;
  promotable: boolean;
  dFloor: number;
  total: number;
}

function deriveDealLabel(input: LabelInput): DealScoreLabel {
  if (!input.promotable || !input.canClaimFloor) return 'unknown';
  if (input.dFloor >= 0.001) return 'lowest_price';
  if (input.total >= 0.05) return 'good_deal';
  if (input.total > 0) return 'fair_price';
  return 'unknown';
}

interface ConfidenceInput {
  promotable: { promotable: boolean; reason: string };
  floor: { count: number; price: number | null };
  hasList: boolean;
}

function deriveDealConfidence(input: ConfidenceInput): ConfidenceLevel {
  if (!input.promotable.promotable) return 'unknown';
  if (input.floor.count >= MIN_HISTORY_FOR_FLOOR_CLAIM && input.hasList) return 'high';
  if (input.floor.count >= 1) return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// TrendScore (pure, deterministic weighted average)
// ---------------------------------------------------------------------------

export const TREND_SCORE_THRESHOLDS = {
  /** Minimum authorised signals required to publish any direction. */
  minSignalsForDirection: 2,
  /** Single-signal magnitude below which we never report a direction. */
  minAbsDeltaForDirection: 0.01,
} as const;

/**
 * Compute the explainable TrendScore breakdown. `label` collapses to
 * `unknown` whenever fewer than `minSignalsForDirection` authorised signals
 * exist or when the weighted centroid delta is within the noise band.
 */
export function computeTrendScore(input: TrendScoreInput): TrendScoreBreakdown {
  const now = input.now instanceof Date ? input.now : new Date(input.now);
  const factors: TrendScoreFactor[] = [];

  let weightSum = 0;
  let centroid = 0;
  let used = 0;

  for (const s of input.signals) {
    const sigWeight = Number.isFinite(s.weight) ? Math.min(1, Math.max(0, s.weight)) : 0;
    const capturedIso = toStrictUtc(s.capturedAt);
    const captured = capturedIso ? new Date(capturedIso).getTime() : NaN;
    if (!Number.isFinite(captured)) continue;
    const age = now.getTime() - captured;
    if (age < 0 || age > FRESHNESS_WINDOWS_MS.trend) continue;
    if (s.anomaly) {
      // Anomalies are kept on the audit trail but force-zeroed in scoring.
      factors.push({
        key: 'trend_signal_anomaly',
        value: 0,
        weight: Number(sigWeight.toFixed(4)),
        contribution: 0,
        reason: 'anomalous signal retained for audit; contributes zero to TrendScore.',
      });
      continue;
    }
    const delta = clamp(s.delta, -1, 1);
    centroid += delta * sigWeight;
    weightSum += sigWeight;
    used += 1;
    factors.push({
      key: 'trend_signal',
      value: Number(delta.toFixed(4)),
      weight: Number(sigWeight.toFixed(4)),
      contribution: Number((delta * sigWeight).toFixed(4)),
      reason: `delta ${delta.toFixed(3)} weighted ${sigWeight.toFixed(2)}.`,
    });
  }

  const verified = used >= TREND_SCORE_THRESHOLDS.minSignalsForDirection && weightSum > 0;
  const centroidDelta = weightSum > 0 ? centroid / weightSum : 0;
  const label = verified && Math.abs(centroidDelta) >= TREND_SCORE_THRESHOLDS.minAbsDeltaForDirection
    ? centroidDelta > 0 ? 'rising' : 'falling'
    : verified ? 'stable' : 'unknown';

  const confidence: ConfidenceLevel = !verified
    ? 'unknown'
    : used >= 4 ? 'high'
      : used >= 2 ? 'medium'
        : 'low';

  const total = Number(centroidDelta.toFixed(4));

  return {
    total,
    label,
    confidence,
    factors,
    verified,
  };
}
