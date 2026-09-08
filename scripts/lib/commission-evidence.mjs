import { toStrictUtc } from '../../src/lib/blocks/block8/domain.ts';

// Dated reference subset of the US standard schedule, not a product mapping.
// Recheck the official schedule when recording a classification. No fallback.
export const COMMISSION_SCHEDULE = Object.freeze({
  version: 'us-standard-2026-09-05',
  observedAt: '2026-09-05T00:00:00Z',
  source: 'https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ',
  rates: Object.freeze({
    'amazon-echo-devices': 0.04, 'ring-devices': 0.04,
    'amazon-fire-tv-devices': 0.04, home: 0.03, 'home-improvement': 0.03,
    'lawn-garden': 0.03, pets: 0.03, kitchen: 0.045, televisions: 0.02,
    'all-other': 0.04, 'gift-cards': 0,
  }),
});
const unknown = () => ({ status: 'unknown', amazonCategory: null, rate: null, evidence: null });

/** Trusted, separately reviewed records; product payload fields cannot grant classification. */
export function resolveCommissionClassification(product, reviews = [], now = new Date()) {
  const reference = toStrictUtc(now);
  if (!reference || !/^[A-Z0-9]{10}$/.test(product.asin ?? '') || product.market !== 'US' || !Array.isArray(reviews)) return unknown();
  const matches = reviews.filter((review) => review?.asin === product.asin && review.market === 'US');
  if (matches.length !== 1) return unknown();
  const review = matches[0];
  const reviewed = toStrictUtc(review.reviewedAt); const expiry = toStrictUtc(review.validUntil);
  if (review.state !== 'approved' || !reviewed || !expiry
    || reviewed < toStrictUtc(COMMISSION_SCHEDULE.observedAt) || reviewed > reference || reference >= expiry
    || review.scheduleVersion !== COMMISSION_SCHEDULE.version
    || review.rateSource !== COMMISSION_SCHEDULE.source
    || !Object.hasOwn(COMMISSION_SCHEDULE.rates, review.amazonCategory)
    || review.rate !== COMMISSION_SCHEDULE.rates[review.amazonCategory]
    || typeof review.classificationEvidence !== 'string' || !review.classificationEvidence.trim()
    || review.classificationEvidence === review.rateSource) return unknown();
  return {
    status: 'reviewed', amazonCategory: review.amazonCategory, rate: review.rate,
    evidence: { classification: review.classificationEvidence, rateSource: review.rateSource,
      reviewedAt: reviewed, validUntil: expiry, scheduleVersion: review.scheduleVersion },
  };
}
