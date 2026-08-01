type PlatformField = 'matter' | 'alexaCompatible' | 'googleHomeCompatible' | 'appleHomeKit';

export interface ComparisonInsightProduct {
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
export function buildComparisonInsights(products: readonly ComparisonInsightProduct[] = []) {
  const safeProducts = products.filter(Boolean);
  const categories = [...new Set(safeProducts.map((product) => product.category).filter(Boolean))];
  const forms = [...new Set(safeProducts.map((product) => product.formFactor).filter(Boolean))];
  const tradeoffs: string[] = [];
  const evidenceLimits = [
    'No controlled outcome, installation, total ownership cost, renter-fit, or advanced-user study is recorded for these products.',
    'Price and Amazon owner-feedback snapshots provide context, not an editorial score or a best-value verdict.',
  ];

  if (categories.length > 1) tradeoffs.push(`Category mismatch disclosed: ${categories.join(' vs ')}; compare use case and form factor before treating these as direct alternatives.`);
  if (forms.length > 1) tradeoffs.push(`Form factor differs across the options: ${forms.join(' vs ')}.`);
  if (safeProducts.length > 1) {
    const prices = safeProducts.map((product) => product.price).filter(hasNumber);
    if (prices.length === safeProducts.length) {
      const low = Math.min(...prices);
      const high = Math.max(...prices);
      if (low !== high) tradeoffs.push(`Price snapshots span $${low} to $${high}; the lowest snapshot is not a best-value finding.`);
    } else evidenceLimits.push('Price snapshot differences are incomplete because one or more products have no verified price.');
  }

  for (const [platformName, field] of platforms) {
    const supported = safeProducts.filter((product) => product[field] === true);
    if (supported.length === 1) {
      const product = supported[0];
      tradeoffs.push(`${label(product)} is the only option marked compatible with ${platformName}.`);
    }
  }

  const buyerFits = safeProducts.map((product) => {
    const reasons = [];
    for (const [platformName, field] of platforms) if (product[field] === true) reasons.push(`marked compatible with ${platformName}`);
    if (product.category) reasons.push(`listed in the ${product.category.replaceAll('-', ' ')} category`);
    if (product.formFactor) reasons.push(`uses the ${product.formFactor} form factor`);
    if (hasNumber(product.ownerRating) && hasNumber(product.ownerRatingCount)) reasons.push(`Amazon owner signals show ${product.ownerRating}/5 from ${product.ownerRatingCount.toLocaleString()} ratings`);
    if (hasNumber(product.price)) reasons.push(`has a $${product.price} price snapshot`);
    return { slug: product.slug, reasons: reasons.length ? reasons : ['No concrete verified signal is available.'] };
  });

  for (const product of safeProducts) {
    const missing = [];
    if (!product.category) missing.push('category');
    if (!hasNumber(product.price)) missing.push('price snapshot');
    if (!hasNumber(product.ownerRating) || !hasNumber(product.ownerRatingCount)) missing.push('Amazon owner rating/count');
    if (missing.length) evidenceLimits.push(`${label(product)} is missing verified ${missing.join(', ')}.`);
  }
  if (!safeProducts.length) evidenceLimits.push('No products were supplied for a verified comparison.');

  return {
    tradeoffs: [...new Set(tradeoffs)],
    buyerFits,
    ecosystemLeaders: platforms.flatMap(([platformName, field]) => {
      const matches = safeProducts.filter((product) => product[field] === true);
      return matches.length === 1 ? [{ platform: platformName, slug: matches[0].slug, reason: `Only option marked compatible with ${platformName}.` }] : [];
    }),
    evidenceLimits: [...new Set(evidenceLimits)],
    bestFitBySignal: 'Not assigned / insufficient verified evidence',
    finalRecommendation: 'Conditional by requirements. Best overall, best value, renters, and advanced-user labels are not assigned because verified evidence is insufficient.',
  };
}
