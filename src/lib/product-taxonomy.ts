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
