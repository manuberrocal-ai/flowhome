import { getCommerceData, type CommerceProduct } from './commerce-data.ts';
import { getFeatureEvidenceLabel, hasFeatureEvidence } from './product-feature-evidence.ts';

type PlatformField = 'matter' | 'alexaCompatible' | 'googleHomeCompatible' | 'appleHomeKit';

export interface ComparisonFeatureState {
  matter?: boolean;
  thread?: boolean;
  smartthingsIntegration?: boolean;
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
  energyMonitoring?: boolean;
  compatibilityVerificationEnabled?: boolean;
  compatibilityProvenance?: Record<string, string | null>;
  compatibilityConditions?: Record<string, string | null>;
}

function hasComparisonEvidence(product: ComparisonFeatureState, field: PlatformField): boolean {
  return hasFeatureEvidence(product, field);
}

/** Formats already-prepared surface data; this does not validate or install a graph. */
export function getComparisonFeatureLabel(product: ComparisonFeatureState, field: PlatformField | 'energyMonitoring' | 'thread' | 'smartthingsIntegration'): string {
  return getFeatureEvidenceLabel(product, field);
}

function platformReason(product: ComparisonInsightProduct, platform: string, field: PlatformField): string {
  const conditions = product.compatibilityConditions?.[field];
  return hasComparisonEvidence(product, field)
    ? `${platform}: evidence-backed signal from ${product.compatibilityProvenance?.[field]}; ${typeof conditions === 'string' && conditions.trim() ? conditions : 'check the exact supported function and conditions'}`
    : `${platform}: unverified catalog signal; confirm the exact model, role and requirements`;
}

export interface ComparisonInsightProduct extends CommerceProduct, ComparisonFeatureState {
  slug: string;
  name?: string;
  category?: string;
  formFactor?: string;
  price?: number;
  ownerRating?: number;
  ownerRatingCount?: number;
  matter?: boolean;
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
}

const platforms: ReadonlyArray<readonly [string, PlatformField]> = [
  ['Matter', 'matter'],
  ['Alexa', 'alexaCompatible'],
  ['Google Home', 'googleHomeCompatible'],
  ['Apple HomeKit', 'appleHomeKit'],
];

const label = (product: ComparisonInsightProduct) => product.name ?? product.slug;
const hasNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * Builds deterministic, evidence-limited comparison guidance from product data.
 * This deliberately reports signals and tradeoffs instead of ranking products.
 */
export function buildComparisonInsights(products: readonly ComparisonInsightProduct[] = [], now = new Date()) {
  const safeProducts = products.filter(Boolean).map((product) => {
    const commerce = getCommerceData(product, now);
    return { ...product, price: commerce.displayPrice, ownerRating: commerce.displayRating, ownerRatingCount: commerce.displayRatingCount };
  });
  const categories = [...new Set(safeProducts.map((product) => product.category).filter(Boolean))];
  const forms = [...new Set(safeProducts.map((product) => product.formFactor).filter(Boolean))];
  const tradeoffs: string[] = [];
  const evidenceLimits = [
    'No controlled outcome, installation, total ownership cost, renter-fit, or advanced-user study is recorded for these products.',
    'Only current authorized price and Amazon owner-feedback observations provide context; they are not an editorial score or a best-value verdict.',
    'A catalog yes/no is not verification of a supported function. A missing or negative catalog entry does not establish incompatibility; confirm model, firmware, bridge/controller roles and required services.',
  ];

  if (categories.length > 1) tradeoffs.push(`Category mismatch disclosed: ${categories.join(' vs ')}; compare use case and form factor before treating these as direct alternatives.`);
  if (forms.length > 1) tradeoffs.push(`Form factor differs across the options: ${forms.join(' vs ')}.`);
  if (safeProducts.length > 1) {
    const prices = safeProducts.map((product) => product.price).filter(hasNumber);
    if (prices.length === safeProducts.length) {
      const low = Math.min(...prices);
      const high = Math.max(...prices);
      if (low !== high) tradeoffs.push(`Price snapshots span $${low} to $${high}; the lowest snapshot is not a best-value finding.`);
    } else evidenceLimits.push('Current authorized price differences are unavailable for one or more products. Check price on Amazon; no budget or value comparison is verified.');
  }

  for (const [platformName, field] of platforms) {
    const supported = safeProducts.filter((product) => product[field] === true);
    if (supported.length === 1) {
      const product = supported[0];
      tradeoffs.push(`${label(product)} — ${platformReason(product, platformName, field)}.`);
    }
  }

  const buyerFits = safeProducts.map((product) => {
    const reasons = [];
    for (const [platformName, field] of platforms) if (product[field] === true) reasons.push(platformReason(product, platformName, field));
    // Documented roles are displayed, never promoted to ecosystem leaders or accessory-fit filters.
    for (const [role, field] of [['Thread role / integration', 'thread'], ['SmartThings role / integration', 'smartthingsIntegration']]) {
      if (hasFeatureEvidence(product, field)) reasons.push(`${role}: ${getFeatureEvidenceLabel(product, field)}`);
    }
    if (product.category) reasons.push(`listed in the ${product.category.replaceAll('-', ' ')} category`);
    if (product.formFactor) reasons.push(`uses the ${product.formFactor} form factor`);
    if (hasNumber(product.ownerRating) && hasNumber(product.ownerRatingCount)) reasons.push(`Amazon owner signals show ${product.ownerRating}/5 from ${product.ownerRatingCount.toLocaleString()} ratings`);
    if (hasNumber(product.price)) reasons.push(`has a $${product.price} price snapshot`);
    return { slug: product.slug, reasons: reasons.length ? reasons : ['No concrete verified signal is available.'] };
  });

  for (const product of safeProducts) {
    const missing = [];
    if (!product.category) missing.push('category');
    if (!hasNumber(product.price)) missing.push('current authorized price');
    if (!hasNumber(product.ownerRating) || !hasNumber(product.ownerRatingCount)) missing.push('current authorized Amazon owner rating/count');
    if (missing.length) evidenceLimits.push(`${label(product)} is missing verified ${missing.join(', ')}.`);
  }
  if (!safeProducts.length) evidenceLimits.push('No products were supplied for a verified comparison.');

  return {
    tradeoffs: [...new Set(tradeoffs)],
    buyerFits,
    ecosystemLeaders: platforms.flatMap(([platformName, field]) => {
      const matches = safeProducts.filter((product) => hasComparisonEvidence(product, field));
      return matches.map((product) => ({ platform: platformName, slug: product.slug, reason: `${label(product)} — ${platformReason(product, platformName, field)}.` }));
    }),
    evidenceLimits: [...new Set(evidenceLimits)],
    bestFitBySignal: 'Not assigned / insufficient verified evidence',
    finalRecommendation: 'Conditional by requirements. Best overall, best value, renters, and advanced-user labels are not assigned because verified evidence is insufficient.',
  };
}
