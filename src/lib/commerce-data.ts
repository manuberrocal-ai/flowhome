import { COMMERCIAL_DATA_POLICY } from './commercial-policy.ts';

// Replaced in every Astro server/client bundle. Unbundled policy consumers
// retain observation evaluation; connected serving needs its own rights gate.
declare const __FLOWHOME_STATIC_COMMERCE__: boolean;

export type PriceSource = 'manual' | 'amazon-creators-api' | 'affiliate-feed';
export type AvailabilityStatus = 'in-stock' | 'out-of-stock' | 'preorder' | 'discontinued';

export const COMMERCE_FRESHNESS = Object.freeze({
  // Amazon Product Advertising Content must not be presented beyond its
  // permitted cache window. A generic feed or manual date grants no rights.
  priceMs: COMMERCIAL_DATA_POLICY.priceMs,
  availabilityMs: COMMERCIAL_DATA_POLICY.availabilityMs,
  ratingMs: COMMERCIAL_DATA_POLICY.ratingMs,
});
export const PRICE_SOURCES = ['manual', 'amazon-creators-api', 'affiliate-feed'] as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const UTC_ISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?Z$/;

export interface CommerceProduct {
  price?: number;
  originalPrice?: number;
  discountPct?: number;
  priceLastChecked?: string;
  priceSource?: PriceSource;
  priceValidUntil?: string;
  affiliateUrl?: string;
  asin?: string;
  availabilityStatus?: AvailabilityStatus;
  availabilityLastChecked?: string;
  availabilitySource?: string;
  availabilityValidUntil?: string;
  ownerRating?: number;
  ownerRatingCount?: number;
  ratingLastChecked?: string;
  ratingSource?: string;
  ratingValidUntil?: string;
}

function parseUtc(value?: string): Date | undefined {
  if (typeof value !== 'string') return undefined;
  const match = UTC_ISO.exec(value);
  if (!match) return undefined;
  const date = new Date(value);
  const expected = `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`;
  return Number.isFinite(date.valueOf()) && date.toISOString() === expected ? date : undefined;
}

function freshObservation(value: string | undefined, validUntil: string | undefined, maxAgeMs: number, nowMs: number) {
  const captured = parseUtc(value);
  const explicitExpiry = parseUtc(validUntil);
  if (!captured || !Number.isFinite(nowMs) || (validUntil !== undefined && !explicitExpiry)) return undefined;
  const expiresMs = Math.min(captured.valueOf() + maxAgeMs, explicitExpiry?.valueOf() ?? Infinity);
  if (nowMs < captured.valueOf() || nowMs >= expiresMs) return undefined;
  return { capturedAt: captured.toISOString(), expiresAt: new Date(expiresMs).toISOString() };
}

function isPublishableSource(value?: string): boolean {
  // Keep legacy source names readable, but do not interpret their presence as
  // permission to publish Amazon data. Provider authentication is upstream.
  return value === 'amazon-creators-api';
}

function hasMatchingAmazonLink(product: CommerceProduct): boolean {
  try {
    const url = new URL(product.affiliateUrl ?? '');
    const asin = /^\/(?:dp|gp\/product)\/([A-Z0-9]{10})\/?$/.exec(url.pathname)?.[1];
    return url.protocol === 'https:' && ['amazon.com', 'www.amazon.com'].includes(url.hostname)
      && !url.username && !url.password && !url.port && !url.hash && Boolean(asin)
      && (product.asin === undefined || product.asin === asin);
  } catch {
    return false;
  }
}

export function formatCommerceDate(value?: string): string | undefined {
  const date = parseUtc(typeof value === 'string' && DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value);
  return date ? date.toISOString().slice(0, 10) : undefined;
}

/**
 * The optional display fields are the public projection, not the raw catalog.
 * A source name alone does not authenticate data: callers must populate API
 * observations only from their authorized provider and re-check this gate at
 * display time. Expired/manual/unknown-feed values remain non-public.
 */
export function getCommerceData(product: CommerceProduct, now: Date | string = new Date()) {
  // Never materialize commercial observations into indefinitely lived HTML,
  // schema, search payloads or client bundles, even when fresh at build time.
  if (typeof __FLOWHOME_STATIC_COMMERCE__ !== 'undefined' && __FLOWHOME_STATIC_COMMERCE__) product = {};
  const reference = now instanceof Date ? now : parseUtc(now);
  const nowMs = reference?.valueOf() ?? NaN;
  const matchingLink = hasMatchingAmazonLink(product);
  const priceObservation = freshObservation(product.priceLastChecked, product.priceValidUntil, COMMERCE_FRESHNESS.priceMs, nowMs);
  const priceFresh = isPublishableSource(product.priceSource) && matchingLink && Boolean(priceObservation)
    && typeof product.price === 'number' && Number.isFinite(product.price) && product.price > 0;
  const availabilityObservation = freshObservation(product.availabilityLastChecked, product.availabilityValidUntil, COMMERCE_FRESHNESS.availabilityMs, nowMs);
  const availabilityFresh = isPublishableSource(product.availabilitySource) && matchingLink && Boolean(availabilityObservation);
  const availability = availabilityFresh && product.availabilityStatus
    ? getAvailabilitySchemaUrl(product.availabilityStatus)
    : undefined;
  const originalPrice = product.originalPrice;
  const discountPct = product.discountPct;
  const actualDiscount = priceFresh && typeof originalPrice === 'number' && Number.isFinite(originalPrice) && originalPrice > product.price!
    ? (originalPrice - product.price!) / originalPrice * 100 : NaN;
  const coherentDiscount = typeof discountPct === 'number' && Number.isFinite(discountPct) && discountPct > 0 && discountPct <= 100
    && (Number.isInteger(discountPct) ? discountPct === Math.round(actualDiscount) : Math.abs(discountPct - actualDiscount) <= 0.01);
  const promotion = priceFresh && coherentDiscount && Boolean(availability) && product.availabilityStatus === 'in-stock';
  const ratingObservation = freshObservation(product.ratingLastChecked, product.ratingValidUntil, COMMERCE_FRESHNESS.ratingMs, nowMs);
  const ratingFresh = isPublishableSource(product.ratingSource) && matchingLink && Boolean(ratingObservation)
    && typeof product.ownerRating === 'number' && Number.isFinite(product.ownerRating) && product.ownerRating > 0 && product.ownerRating <= 5
    && typeof product.ownerRatingCount === 'number' && Number.isSafeInteger(product.ownerRatingCount) && product.ownerRatingCount > 0;

  return {
    isPriceFresh: priceFresh,
    showPromotion: promotion,
    hasOffer: priceFresh,
    priceLabel: priceFresh ? 'Price snapshot' : 'Check price on Amazon',
    priceLastCheckedLabel: formatCommerceDate(product.priceLastChecked),
    priceSourceLabel: product.priceSource ?? 'unknown',
    priceValidUntil: priceFresh ? priceObservation?.expiresAt : undefined,
    priceCapturedAt: priceFresh ? priceObservation?.capturedAt : undefined,
    priceExpiresAt: priceFresh ? priceObservation?.expiresAt : undefined,
    displayPrice: priceFresh ? product.price : undefined,
    displayOriginalPrice: promotion ? originalPrice : undefined,
    displayDiscountPct: promotion ? discountPct : undefined,
    availability,
    isAvailabilityFresh: Boolean(availability),
    availabilityExpiresAt: availability ? availabilityObservation?.expiresAt : undefined,
    isRatingFresh: ratingFresh,
    displayRating: ratingFresh ? product.ownerRating : undefined,
    displayRatingCount: ratingFresh ? product.ownerRatingCount : undefined,
    ratingLastCheckedLabel: ratingFresh ? formatCommerceDate(product.ratingLastChecked) : undefined,
    ratingCapturedAt: ratingFresh ? ratingObservation?.capturedAt : undefined,
    ratingExpiresAt: ratingFresh ? ratingObservation?.expiresAt : undefined,
  };
}

export function getAvailabilitySchemaUrl(status: AvailabilityStatus): string | undefined {
  const paths: Record<AvailabilityStatus, string> = {
    'in-stock': 'InStock',
    'out-of-stock': 'OutOfStock',
    preorder: 'PreOrder',
    discontinued: 'Discontinued',
  };
  return Object.hasOwn(paths, status) ? `https://schema.org/${paths[status]}` : undefined;
}
