/** Server-only orchestration; no installed authority, quota store or provider.
 * Dependencies must be authenticated server integrations, never request JSON.
 */
import { toStrictUtc } from './domain.ts';
import type { AuthorizedCommerceSnapshot, CommerceRequestContext } from './request-delivery.ts';

export interface CommerceReadGrant {
  asin: string;
  market: 'US';
  accountRef: string;
  /** Revision must change on revocation, review or scope changes, including ABA. */
  revision: string;
  expiresAt: string;
}

export interface GatedCommerceReaderDependencies {
  enabled?: boolean;
  /** Authenticate account rights and reviewed identity/scope from current server state. */
  authorize: (context: CommerceRequestContext, signal: AbortSignal) => Promise<CommerceReadGrant | null>;
  /** Atomically consume an attempt in the account-wide budget. False/error denies.
   * No refunds here: cancellation/failure may have already reached the provider.
   */
  reserveAttempt: (grant: CommerceReadGrant, signal: AbortSignal) => Promise<boolean>;
  /** Bind credentials/review to this grant's accountRef; acquire/review in memory.
   * Do not persist raw content or return a stale fallback.
   */
  acquireReviewedSnapshot: (context: CommerceRequestContext, grant: CommerceReadGrant, signal: AbortSignal) => Promise<AuthorizedCommerceSnapshot | null>;
  clock?: () => Date;
}

const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9:_-]{1,160}$/i.test(value);

/** Plug into serveCommerceRequest, which supplies timeout/cancellation and applies
 * field-level projection. This workflow is not itself an authentication system.
 */
export function createGatedCommerceReader(dependencies: GatedCommerceReaderDependencies) {
  return async (context: CommerceRequestContext, signal: AbortSignal): Promise<AuthorizedCommerceSnapshot | null> => {
    if (dependencies.enabled !== true || signal.aborted || !context || context.market !== 'US' || typeof context.asin !== 'string' || !/^[A-Z0-9]{10}$/.test(context.asin)) return null;
    try {
      const clock = dependencies.clock ?? (() => new Date());
      const started = clock().getTime();
      if (!Number.isFinite(started)) return null;
      const input = { asin: context.asin, market: 'US' as const };
      const validGrant = (grant: CommerceReadGrant | null, at: number): grant is CommerceReadGrant => Boolean(grant
        && grant.asin === input.asin && grant.market === input.market
        && identifier(grant.accountRef) && identifier(grant.revision)
        && toStrictUtc(grant.expiresAt) && Date.parse(grant.expiresAt) > at);
      const initial = structuredClone(await dependencies.authorize({ ...input }, signal));
      const authorizedAt = clock().getTime();
      if (signal.aborted || !Number.isFinite(authorizedAt) || authorizedAt < started || !validGrant(initial, authorizedAt)) return null;
      if (await dependencies.reserveAttempt(structuredClone(initial), signal) !== true || signal.aborted) return null;
      const acquiredAt = clock().getTime();
      if (!Number.isFinite(acquiredAt) || acquiredAt < authorizedAt || !validGrant(initial, acquiredAt)) return null;
      const snapshot = structuredClone(await dependencies.acquireReviewedSnapshot({ ...input }, structuredClone(initial), signal));
      if (!snapshot || signal.aborted) return null;
      const current = await dependencies.authorize({ ...input }, signal);
      const completedAt = clock().getTime();
      if (signal.aborted || !Number.isFinite(completedAt) || completedAt < acquiredAt
        || !validGrant(current, completedAt) || !validGrant(initial, completedAt)
        || current.accountRef !== initial.accountRef || current.revision !== initial.revision
        || !toStrictUtc(snapshot.authorizationExpiresAt)) return null;
      const deadline = Math.min(Date.parse(initial.expiresAt), Date.parse(current.expiresAt), Date.parse(snapshot.authorizationExpiresAt));
      if (completedAt >= deadline) return null;
      return { ...snapshot, authorizationExpiresAt: new Date(deadline).toISOString() };
    } catch { return null; }
  };
}
