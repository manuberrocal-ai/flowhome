/**
 * Block 9 ? Verified comparison insights (flag-gated, optional).
 *
 * @packageDocumentation
 *
 * Wraps `buildComparisonInsights` from `../comparison-insights.ts` with the
 * Block 9 verified compatibility graph. When the flag is on, catalog booleans
 * are overridden by verified claims (or degraded to Unknown), and verified
 * constraints/conflicts are added to the tradeoffs and a new
 * `verifiedConstraints`/`verifiedConflicts` list. When the environment is
 * missing or `enabled === false`, this is inert and delegates to the existing
 * `buildComparisonInsights` (legacy behavior preserved).
 *
 * Visible content and the verified flag source agree: an unverified catalog
 * boolean is never presented as fact.
 */
import { buildComparisonInsights } from '../../comparison-insights.ts';
import { applyVerifiedCompatibility, type CompatibilityEnvironment } from './compatibility-adapter.ts';
import { getVerifiedConstraints } from './resolver.ts';
import type { ComparisonInsightProduct } from '../../comparison-insights.ts';
import type { VerifiedNotice } from './resolver.ts';
import { forCompatibilitySurface } from './runtime.ts';

export interface VerifiedComparisonNotice extends VerifiedNotice {
  slug: string;
}

/**
 * Prepares the exact products rendered by comparison tables and cards.
 *
 * The comparison surface has its own ledger location per product, so no claim
 * recorded for another surface can alter visible comparison compatibility.
 */
export function prepareVerifiedComparisonProducts<T extends ComparisonInsightProduct>(
  products: ReadonlyArray<T> = [],
  env?: CompatibilityEnvironment,
): T[] {
  if (!env || !env.enabled || !env.graph) return [...products];
  return products.map((product) => {
    const slug = typeof product.slug === 'string' ? product.slug : '';
    if (!slug) return product;
    return applyVerifiedCompatibility(product as unknown as Parameters<typeof applyVerifiedCompatibility>[0], slug, forCompatibilitySurface(env, 'comparison', slug)) as unknown as T;
  });
}

export function buildVerifiedComparisonInsights(
  products: ReadonlyArray<ComparisonInsightProduct> = [],
  env?: CompatibilityEnvironment,
) {
  if (!env || !env.enabled || !env.graph) {
    return buildComparisonInsights(products);
  }
  const verifiedProducts = prepareVerifiedComparisonProducts(products, env);
  const base = buildComparisonInsights(verifiedProducts);
  const verifiedConstraints: string[] = [];
  const verifiedConflicts: string[] = [];
  const verifiedNoticeDetails: VerifiedComparisonNotice[] = [];
  for (const product of verifiedProducts) {
    const slug = typeof product.slug === 'string' ? product.slug : '';
    if (!slug) continue;
    const cons = getVerifiedConstraints(env.graph!, slug, forCompatibilitySurface(env, 'comparison', slug));
    for (const notice of cons.constraints) {
      verifiedConstraints.push(`${slug}: ${notice}`);
    }
    for (const notice of cons.conflicts) {
      verifiedConflicts.push(`${slug}: ${notice}`);
    }
    for (const notice of cons.notices) {
      verifiedNoticeDetails.push({ ...notice, slug });
    }
  }
  return {
    ...base,
    tradeoffs: [...new Set([...base.tradeoffs, ...verifiedConstraints])],
    verifiedConstraints: [...new Set(verifiedConstraints)],
    verifiedConflicts: [...new Set(verifiedConflicts)],
    verifiedNoticeDetails: [...new Map(verifiedNoticeDetails
      .sort((a, b) => a.edgeId.localeCompare(b.edgeId) || a.message.localeCompare(b.message) || a.slug.localeCompare(b.slug))
      .map((notice) => [`${notice.edgeId}\u0000${notice.message}`, notice]))
      .values()],
    evidenceLimits:
      verifiedConflicts.length > 0
        ? [...base.evidenceLimits, 'Verified conflicts were detected for one or more products; review before considering them comparable.']
        : base.evidenceLimits,
  };
}
