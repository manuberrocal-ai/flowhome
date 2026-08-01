export type PriceSource = 'manual' | 'amazon-creators-api' | 'affiliate-feed';
export type AvailabilityStatus = 'in-stock' | 'out-of-stock' | 'preorder' | 'discontinued';

export const COMMERCE_FRESHNESS = {
  priceMs: 7 * 24 * 60 * 60 * 1000,
  availabilityMs: 24 * 60 * 60 * 1000,
} as const;
export const PRICE_SOURCES = ['manual', 'amazon-creators-api', 'affiliate-feed'] as const;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const UTC_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export interface CommerceProduct {
  price?: number;
  originalPrice?: number;
  discountPct?: number;
  priceLastChecked?: string;
  priceSource?: PriceSource;
  priceValidUntil?: string;
  affiliateUrl?: string;
  availabilityStatus?: AvailabilityStatus;
  availabilityLastChecked?: string;
  availabilitySource?: string;
}

function parseUtc(value?: string): Date | undefined {
  if (!value || (!DATE_ONLY.test(value) && !UTC_ISO.test(value))) return undefined;
  const normalized = DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

function isFresh(value: string | undefined, maxAgeMs: number, now: Date): boolean {
  const date = parseUtc(value);
  if (!date) return false;
  const age = now.valueOf() - date.valueOf();
  return age >= 0 && age <= maxAgeMs;
}

function isPriceSource(value?: string): value is PriceSource {
  return PRICE_SOURCES.includes(value as PriceSource);
}

function isHttpsUrl(value?: string): boolean {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatCommerceDate(value?: string): string | undefined {
  const date = parseUtc(value);
  return date ? date.toISOString().slice(0, 10) : undefined;
}

export function getCommerceData(product: CommerceProduct, now = new Date()) {
  const price = Number(product.price);
  const priceFresh = isPriceSource(product.priceSource) && isFresh(product.priceLastChecked, COMMERCE_FRESHNESS.priceMs, now);
  const validUntil = parseUtc(product.priceValidUntil);
  const priceStillValid = !validUntil || validUntil.valueOf() > now.valueOf();
  const discountPct = Number(product.discountPct);
  const promotion = priceFresh
    && priceStillValid
    && Number(product.originalPrice) > price
    && Number.isFinite(discountPct)
    && discountPct > 0
    && discountPct <= 100;
  const offer = priceFresh && priceStillValid && price > 0 && isHttpsUrl(product.affiliateUrl);
  const availabilityFresh = Boolean(product.availabilitySource)
    && isFresh(product.availabilityLastChecked, COMMERCE_FRESHNESS.availabilityMs, now);
  const availability = availabilityFresh && product.availabilityStatus
    ? getAvailabilitySchemaUrl(product.availabilityStatus)
    : undefined;

  return {
    isPriceFresh: priceFresh,
    showPromotion: promotion,
    hasOffer: offer,
    priceLabel: priceFresh ? 'Price snapshot' : 'Historical price snapshot',
    priceLastCheckedLabel: formatCommerceDate(product.priceLastChecked),
    priceSourceLabel: product.priceSource ?? 'unknown',
    priceValidUntil: validUntil && validUntil.valueOf() > now.valueOf() ? validUntil.toISOString() : undefined,
    availability,
    isAvailabilityFresh: Boolean(availability),
  };
}

export function getAvailabilitySchemaUrl(status: AvailabilityStatus): string | undefined {
  const paths: Record<AvailabilityStatus, string> = {
    'in-stock': 'InStock',
    'out-of-stock': 'OutOfStock',
    preorder: 'PreOrder',
    discontinued: 'Discontinued',
  };
  return `https://schema.org/${paths[status]}`;
}
