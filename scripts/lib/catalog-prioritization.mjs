import { CANONICAL_CATEGORIES } from '../../src/lib/product-taxonomy.ts';
import { DEAL_WEIGHTS, OPPORTUNITY_WEIGHTS, TREND_WEIGHTS, scoreSignals } from './daily-scoring.mjs';

/** Own catalog classification only; never commercial, compatibility or sales evidence. */
export function scoreCatalogProduct(product) {
  const file = typeof product.file === 'string' ? product.file.replaceAll('\\', '/') : '';
  const localSource = /^src\/content\/products\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.ya?ml$/i.test(file);
  const knownCategory = CANONICAL_CATEGORIES.includes(product.category);
  const signals = localSource && knownCategory && product.catalogActive !== false
    ? { relevance: { value: 1, evidence: `${file}: recorded editorial category ${product.category}; not verified product performance` } }
    : {};
  return {
    dealScore: scoreSignals(signals, DEAL_WEIGHTS),
    trendScore: scoreSignals(signals, TREND_WEIGHTS),
    opportunityScore: scoreSignals(signals, OPPORTUNITY_WEIGHTS),
  };
}
