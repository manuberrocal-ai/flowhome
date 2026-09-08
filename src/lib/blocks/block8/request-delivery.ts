/** Unregistered server contract. No public route, provider, credentials or cache. */
import type { Offer } from './domain.ts';
import { toStrictUtc } from './domain.ts';
import type { CommercialEvidenceContext } from './evidence.ts';
import { projectAuthorizedCommerce } from './public-projection.ts';

const LOAD_TIMEOUT_MS = 3_000;
export const COMMERCE_RESPONSE_LEASE_MS = 60_000;
export interface CommerceRequestContext { asin: string; market: 'US' }
export interface AuthorizedCommerceSnapshot {
  offer: Offer;
  evidence: CommercialEvidenceContext;
  authorizationExpiresAt: string;
}
export interface CommerceDeliveryDependencies {
  enabled?: boolean;
  /** Trusted integration must authenticate rights/review and enforce provider quotas.
   * createGatedCommerceReader coordinates pre/post authorization and quota attempts;
   * its injected backends still require authenticated, account-wide implementations.
   * Never deserialize this snapshot from request parameters or reuse a stale fallback. */
  readAuthorizedSnapshot?: (context: CommerceRequestContext, signal: AbortSignal) => Promise<AuthorizedCommerceSnapshot | null>;
  clock?: () => Date;
}

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    ...(status === 405 ? { Allow: 'GET' } : {}),
  } });
}

async function acquire(request: Request, context: CommerceRequestContext, read: NonNullable<CommerceDeliveryDependencies['readAuthorizedSnapshot']>) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort = () => {};
  try {
    const cancelled = new Promise<never>((_, reject) => {
      abort = () => { controller.abort(); reject(new Error('unavailable')); };
      request.signal.addEventListener('abort', abort, { once: true });
      timer = setTimeout(abort, LOAD_TIMEOUT_MS);
    });
    if (request.signal.aborted) abort();
    return await Promise.race([cancelled, Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new Error('unavailable');
      return read(context, controller.signal);
    })]);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}

export async function serveCommerceRequest(request: Request, dependencies: CommerceDeliveryDependencies = {}): Promise<Response> {
  const unavailable = () => reply(503, { status: 'unavailable' });
  if (request.method !== 'GET') return reply(405, { status: 'method-not-allowed' });
  const url = new URL(request.url); const keys = [...url.searchParams.keys()];
  const asin = url.searchParams.get('asin') ?? '';
  if (request.url.length > 1024 || url.hash || keys.length !== 2 || new Set(keys).size !== 2
    || keys.some(key => !['asin', 'market'].includes(key)) || !/^[A-Z0-9]{10}$/.test(asin)
    || url.searchParams.get('market') !== 'US') return reply(400, { status: 'invalid-context' });
  if (dependencies.enabled !== true || !dependencies.readAuthorizedSnapshot || request.signal.aborted) return unavailable();
  try {
    const snapshot = await acquire(request, { asin, market: 'US' }, dependencies.readAuthorizedSnapshot);
    if (!snapshot || request.signal.aborted) return unavailable();
    const clock = dependencies.clock ?? (() => new Date());
    const projectedAt = clock();
    const authorization = toStrictUtc(snapshot.authorizationExpiresAt);
    if (!toStrictUtc(projectedAt) || !authorization || Date.parse(authorization) <= projectedAt.getTime()) return unavailable();
    const data = projectAuthorizedCommerce(asin, snapshot.offer, snapshot.evidence, projectedAt);
    // Recheck after projection so processing cannot silently renew an expired field.
    const sentAt = clock(); const at = sentAt.getTime();
    if (!Number.isFinite(at) || at < projectedAt.getTime() || request.signal.aborted || data.displayPrice === undefined || !data.priceExpiresAt) return unavailable();
    const deadline = Math.min(projectedAt.getTime() + COMMERCE_RESPONSE_LEASE_MS, Date.parse(authorization), Date.parse(data.priceExpiresAt));
    if (at >= deadline) return unavailable();
    const availabilityDeadline = Math.min(deadline, Date.parse(data.availabilityExpiresAt ?? ''));
    return reply(200, {
      status: 'available', asin, market: 'US', currency: 'USD', serverTime: sentAt.toISOString(),
      validUntil: new Date(deadline).toISOString(),
      price: { value: data.displayPrice, capturedAt: data.priceCapturedAt, expiresAt: new Date(deadline).toISOString() },
      ...(data.availability && availabilityDeadline > at ? { availability: { value: data.availability, expiresAt: new Date(availabilityDeadline).toISOString() } } : {}),
    });
  } catch { return unavailable(); }
}
