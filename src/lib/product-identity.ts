/** Documentary identity claims, not physical verification or compatibility signals. */
export const IDENTITY_FIELDS = {
  model: 'Model',
  asin: 'Amazon ASIN',
  generation: 'Generation / hardware revision',
  bundle: 'Package contents',
  market: 'Market / regional variant',
  firmware: 'Firmware version',
  role: 'Device, bridge or controller role',
  subscription: 'Service / subscription conditions',
} as const;

export type IdentityField = keyof typeof IDENTITY_FIELDS;
export interface IdentitySource { label: string; url: string; accessedAt: string }
export interface IdentityClaim {
  value: string;
  conditions: string;
  sources: IdentitySource[];
  /** Required for version-dependent firmware and service observations. */
  validUntil?: string;
}
export interface ProductIdentityEvidence {
  model: string;
  asin: string;
  claims: Partial<Record<IdentityField, IdentityClaim>>;
}
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
function date(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? parsed.getTime() : NaN;
}

export function getIdentityClaim(product: { model?: unknown; asin?: unknown; identityEvidence?: unknown }, field: IdentityField, now = new Date()): IdentityClaim | null {
  if (!Object.hasOwn(IDENTITY_FIELDS, field) || !Number.isFinite(now.getTime())) return null;
  const evidence = product.identityEvidence;
  if (!object(evidence) || !text(product.model) || !text(product.asin)
    || evidence.model !== product.model || evidence.asin !== product.asin || !/^[A-Z0-9]{10}$/.test(product.asin)
    || !object(evidence.claims) || !Object.hasOwn(evidence.claims, field)) return null;
  const claim = evidence.claims[field];
  if (!object(claim) || !text(claim.value) || !text(claim.conditions) || !Array.isArray(claim.sources) || !claim.sources.length) return null;
  if ((field === 'model' && claim.value !== product.model) || (field === 'asin' && claim.value !== product.asin)) return null;
  const today = date(now.toISOString().slice(0, 10));
  const expiry = date(claim.validUntil);
  if ((field === 'firmware' || field === 'subscription' || claim.validUntil !== undefined) && (!Number.isFinite(expiry) || expiry < today)) return null;
  for (const source of claim.sources) {
    if (!object(source) || !text(source.label) || !text(source.url)) return null;
    const observed = date(source.accessedAt);
    if (!Number.isFinite(observed) || observed > today || (Number.isFinite(expiry) && expiry < observed)) return null;
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    } catch { return null; }
  }
  return claim as unknown as IdentityClaim;
}

export function getIdentityRows(product: Parameters<typeof getIdentityClaim>[0], now = new Date()) {
  return (Object.entries(IDENTITY_FIELDS) as [IdentityField, string][]).map(([field, label]) => ({
    field, label, claim: getIdentityClaim(product, field, now),
  }));
}
