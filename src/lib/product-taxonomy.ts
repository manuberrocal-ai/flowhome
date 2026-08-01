import { verifiedSubstitutes } from './blocks/block9/compatibility-adapter.ts';
export const CANONICAL_CATEGORIES = [
  'video-doorbell',
  'smart-thermostat',
  'smart-speaker',
  'smart-plug',
  'smart-lock',
  'smart-lighting',
  'smart-hub',
  'smart-display',
  'security-camera',
  'robot-vacuum',
  'motion-sensor',
  'air-purifier',
  'garage-door-opener',
  'smart-blinds',
] as const;

export type CanonicalCategory = (typeof CANONICAL_CATEGORIES)[number];
export const RELATIONSHIP_TYPES = [
  'direct-alternative',
  'compatible-accessory',
  'same-ecosystem',
  'frequently-paired',
  'editorial-content',
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface ProductRelationship {
  type: RelationshipType;
  targetSlug: string;
  label?: string;
  source?: string;
  verifiedAt?: string;
}

export interface RelatedProduct {
  product: any;
  relationship: ProductRelationship;
}

const productData = (product: any) => product?.data ?? product;

export function getRelationshipLabel(type: RelationshipType): string {
  return {
    'direct-alternative': 'Direct alternative',
    'compatible-accessory': 'Compatible accessory',
    'same-ecosystem': 'Same ecosystem',
    'frequently-paired': 'Frequently paired',
    'editorial-content': 'Editorial content',
  }[type];
}

export function selectDirectAlternatives(current: any, products: any[], limit = 4): RelatedProduct[] {
  const currentData = productData(current);
  const blockedTargets = new Set(
    (currentData.relationships ?? [])
      .filter((relationship: ProductRelationship) => relationship.type !== 'direct-alternative')
      .map((relationship: ProductRelationship) => relationship.targetSlug),
  );
  const candidates = products.filter((candidate) => {
    const data = productData(candidate);
    return data.slug !== currentData.slug
      && data.category === currentData.category
      && data.catalogActive === true
      && !blockedTargets.has(data.slug);
  });

  const explicitTargets = new Set(
    (currentData.relationships ?? [])
      .filter((relationship: ProductRelationship) => relationship.type === 'direct-alternative')
      .map((relationship: ProductRelationship) => relationship.targetSlug),
  );

  return candidates
    .sort((a, b) => Number(explicitTargets.has(productData(b).slug)) - Number(explicitTargets.has(productData(a).slug)))
    .map((product) => ({
      product,
      relationship: { type: 'direct-alternative' as const, targetSlug: productData(product).slug },
    }))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Block 9 ? Verified direct alternatives (flag-gated, optional)
// ---------------------------------------------------------------------------

/**
 * Selects direct alternatives for a product, augmenting the curated catalog
 * relationships with verified `substitutes` edges from the Block 9 graph
 * when the flag is on. Verified substitutes are surfaced first (sorted by
 * the existing scoring), then any remaining same-category active candidates.
 *
 * When the environment is missing or `enabled === false`, this is inert and
 * delegates to the existing `selectDirectAlternatives` (legacy behavior
 * preserved). Name-based inference is never used; only explicit
 * `substitutes` edges contribute.
 */
export function selectVerifiedDirectAlternatives(
  current: any,
  products: any[],
  env?: { graph: any; enabled: boolean; market?: string; now?: Date | string },
  limit = 4,
): RelatedProduct[] {
  const base = selectDirectAlternatives(current, products, limit);
  if (!env || !env.enabled || !env.graph) return base;
  const currentSlug = productData(current)?.slug;
  if (!currentSlug) return base;
  const verifiedSlugs = verifiedSubstitutes(env, currentSlug);
  if (verifiedSlugs.length === 0) return base;

  // Promote verified substitutes to the front; keep the rest ordered by the legacy sort.
  const verifiedSet = new Set(verifiedSlugs);
  const verified = products
    .filter((candidate) => {
      const data = productData(candidate);
      return verifiedSet.has(data.slug) && data.catalogActive === true && data.slug !== currentSlug;
    })
    .map((product) => ({
      product,
      relationship: { type: 'direct-alternative' as const, targetSlug: productData(product).slug },
    }));

  // Deduplicate: only include verified ones not already in base.
  const baseSlugs = new Set(base.map((r) => productData(r.product).slug));
  const uniqueVerified = verified.filter((r) => !baseSlugs.has(productData(r.product).slug));

  return [...uniqueVerified, ...base]
    .slice(0, limit) as RelatedProduct[];
}
