import { toStrictUtc } from './domain.ts';
import { COMMERCIAL_DATA_POLICY } from '../../commercial-policy.ts';
import { getAvailabilitySchemaUrl } from '../../commerce-data.ts';

const availabilityValues = (['in-stock', 'out-of-stock', 'preorder', 'discontinued'] as const).map(getAvailabilitySchemaUrl);

export interface CommerceEnvelope {
  asin: string;
  price: { value: number; capturedAt: string; expiresAt: string };
  availability?: { value: string; expiresAt: string };
  priceLeaseMs: number;
  availabilityLeaseMs?: number;
}
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const keys = (value: Record<string, unknown>, allowed: string[], required = allowed) => Object.keys(value).every(key => allowed.includes(key)) && required.every(key => Object.hasOwn(value, key));
const timestamp = (value: unknown) => typeof value === 'string' && toStrictUtc(value) ? Date.parse(value) : NaN;

/** Validates a bounded JSON response, not the authenticity of the same-origin server. */
export function parseCommerceEnvelope(value: unknown, asin: string): CommerceEnvelope | null {
  if (!record(value) || !keys(value, ['status', 'asin', 'market', 'currency', 'serverTime', 'validUntil', 'price', 'availability'], ['status', 'asin', 'market', 'currency', 'serverTime', 'validUntil', 'price'])
    || value.status !== 'available' || !/^[A-Z0-9]{10}$/.test(asin) || value.asin !== asin || value.market !== 'US' || value.currency !== 'USD') return null;
  const at = timestamp(value.serverTime); const end = timestamp(value.validUntil);
  if (!Number.isFinite(at) || !Number.isFinite(end) || end <= at || end - at > 60_000) return null;
  const price = value.price;
  if (!record(price) || !keys(price, ['value', 'capturedAt', 'expiresAt']) || typeof price.value !== 'number' || !Number.isFinite(price.value) || price.value <= 0
    || timestamp(price.expiresAt) !== end || !Number.isFinite(timestamp(price.capturedAt)) || timestamp(price.capturedAt) > at || end > timestamp(price.capturedAt) + COMMERCIAL_DATA_POLICY.priceMs) return null;
  const result: CommerceEnvelope = { asin, price: { value: price.value, capturedAt: price.capturedAt as string, expiresAt: price.expiresAt as string }, priceLeaseMs: end - at };
  if (Object.hasOwn(value, 'availability')) {
    const availability = value.availability;
    if (!record(availability) || !keys(availability, ['value', 'expiresAt']) || typeof availability.value !== 'string' || !availabilityValues.includes(availability.value)) return null;
    const expires = timestamp(availability.expiresAt);
    if (!Number.isFinite(expires) || expires <= at || expires > end) return null;
    result.availability = { value: availability.value as string, expiresAt: availability.expiresAt as string };
    result.availabilityLeaseMs = expires - at;
  }
  return result;
}
