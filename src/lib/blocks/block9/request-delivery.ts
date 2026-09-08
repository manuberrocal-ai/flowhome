/** Server contract only. No route, public provider, credentials or default source. */
import { activeEdgesFrom, getVerifiedConstraints, getVerifiedRelations, nodeBySlug, type CompatibilityGraph } from './resolver.ts';
import { applyVerifiedCompatibility } from './compatibility-adapter.ts';
import { CLAIM_FRESHNESS_WINDOWS_MS, toStrictUtc } from './domain.ts';
import type { CompatibilitySurface } from './runtime.ts';

export const COMPATIBILITY_LEASE_MS = 60_000;
const LOAD_TIMEOUT_MS = 3_000;
const surfaces = new Set(['product', 'quiz', 'comparison', 'alternatives']);

export interface CompatibilityRequestContext {
  slug: string;
  surface: CompatibilitySurface;
  market: 'US';
}

export interface AuthorizedCompatibilitySnapshot {
  graph: CompatibilityGraph;
  /** Must come from the server's authenticated, revocation-aware authorization check. */
  authorizationExpiresAt: string;
}

export interface CompatibilityDeliveryDependencies {
  enabled?: boolean;
  /** Trusted server integration, not a JSON body or a claim of reviewer identity. */
  readAuthorizedSnapshot?: (context: CompatibilityRequestContext, signal: AbortSignal) => Promise<AuthorizedCompatibilitySnapshot | null>;
  clock?: () => Date;
}

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(status === 405 ? { Allow: 'GET' } : {}),
  } });
}

async function readWithDeadline(request: Request, context: CompatibilityRequestContext, read: NonNullable<CompatibilityDeliveryDependencies['readAuthorizedSnapshot']>) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: () => void = () => {};
  try {
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () => { controller.abort(); reject(new Error('source-unavailable')); };
      request.signal.addEventListener('abort', onAbort, { once: true });
      timer = setTimeout(onAbort, LOAD_TIMEOUT_MS);
    });
    if (request.signal.aborted) onAbort();
    return await Promise.race([aborted, Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new Error('source-unavailable');
      return read(context, controller.signal);
    })]);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', onAbort);
  }
}

/** Recomputes every request. Headers are policy, not proof a deployed CDN obeys it. */
export async function serveCompatibilityRequest(request: Request, dependencies: CompatibilityDeliveryDependencies = {}): Promise<Response> {
  const unavailable = () => response(503, { status: 'unavailable' });
  if (request.method !== 'GET') return response(405, { status: 'method-not-allowed' });
  const url = new URL(request.url);
  const keys = [...url.searchParams.keys()];
  const slug = url.searchParams.get('slug') ?? '';
  const surface = url.searchParams.get('surface') ?? '';
  if (request.url.length > 1024 || keys.length !== 3 || new Set(keys).size !== 3
    || keys.some(key => !['slug', 'surface', 'market'].includes(key))
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120
    || !surfaces.has(surface) || url.searchParams.get('market') !== 'US') return response(400, { status: 'invalid-context' });
  if (dependencies.enabled !== true || !dependencies.readAuthorizedSnapshot || request.signal.aborted) return unavailable();
  const context: CompatibilityRequestContext = { slug, surface: surface as CompatibilitySurface, market: 'US' };
  const clock = dependencies.clock ?? (() => new Date());
  try {
    const snapshot = await readWithDeadline(request, context, dependencies.readAuthorizedSnapshot);
    if (!snapshot || request.signal.aborted) return unavailable();
    // Check time after acquisition, not before a potentially slow provider.
    const now = clock();
    const nowMs = now.getTime();
    const authorizationExpiry = toStrictUtc(snapshot.authorizationExpiresAt);
    if (!Number.isFinite(nowMs) || !authorizationExpiry || Date.parse(authorizationExpiry) <= nowMs) return unavailable();
    const node = nodeBySlug(snapshot.graph, slug, 'US');
    if (!node || node.type !== 'product') return response(404, { status: 'unknown-product' });
    const visibleLocation = `${surface}:${slug}:compatibility`;
    const options = { enabled: true, market: 'US', now, visibleLocation };
    const edges = activeEdgesFrom(snapshot.graph, node.id, now, 'US', visibleLocation);
    const deadlines = [nowMs + COMPATIBILITY_LEASE_MS, Date.parse(authorizationExpiry)];
    for (const edge of edges) {
      if (edge.expiry) deadlines.push(Date.parse(edge.expiry));
      // Recompute when fresh evidence becomes low-confidence, not just at expiry.
      const freshUntil = Date.parse(edge.verifiedAt) + CLAIM_FRESHNESS_WINDOWS_MS.claim + 1;
      if (freshUntil > nowMs) deadlines.push(freshUntil);
      const row = snapshot.graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === visibleLocation);
      const rowFreshUntil = Date.parse(row?.reviewDate ?? '') + CLAIM_FRESHNESS_WINDOWS_MS.claim + 1;
      if (rowFreshUntil > nowMs) deadlines.push(rowFreshUntil);
    }
    const validUntilMs = Math.min(...deadlines);
    const product = applyVerifiedCompatibility({ slug }, slug, { ...options, graph: snapshot.graph });
    const relations = getVerifiedRelations(snapshot.graph, slug, options);
    const constraints = getVerifiedConstraints(snapshot.graph, slug, options);
    const serverTime = clock();
    const sentAt = serverTime.getTime();
    if (!Number.isFinite(sentAt) || sentAt < nowMs || sentAt >= validUntilMs || request.signal.aborted) return unavailable();
    return response(200, {
      schemaVersion: 2, context, serverTime: serverTime.toISOString(), validUntil: new Date(validUntilMs).toISOString(), leaseMs: validUntilMs - sentAt,
      product, relations,
      substitutes: [...new Set(relations.filter(row => row.relation === 'substitutes').map(row => row.targetSlug))],
      complements: [...new Set(relations.filter(row => row.relation === 'complements').map(row => row.targetSlug))],
      // Deliberately omit internal edge IDs, owners, reviews, marketplace IDs and graph.
      notices: constraints.notices.map(({ relation, message, confidence, evidence, evidenceLabel, sourceLabel }) => ({ relation, message, confidence, evidence, evidenceLabel, sourceLabel })),
    });
  } catch {
    // No upstream body, exception text, credential or previous successful response.
    return unavailable();
  }
}
