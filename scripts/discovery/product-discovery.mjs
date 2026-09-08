import { readProducts, readText, writeText } from '../lib/content-utils.mjs';
import { scoreCatalogProduct } from '../lib/catalog-prioritization.mjs';
import { resolveCommissionClassification } from '../lib/commission-evidence.mjs';
import { toStrictUtc } from '../../src/lib/blocks/block8/domain.ts';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function buildDiscoveryReport(products, { now = new Date(), commissionClassifications = [] } = {}) {
  const generatedAt = toStrictUtc(now);
  if (!generatedAt) throw new Error('invalid_discovery_reference');
  const counts = new Map();
  const slugs = new Map();
  for (const product of products) {
    counts.set(product.asin, (counts.get(product.asin) ?? 0) + 1);
    slugs.set(product.slug, (slugs.get(product.slug) ?? 0) + 1);
  }
  const anomalies = [];
  const evaluations = [];
  for (const product of products) {
    if (!/^[A-Z0-9]{10}$/.test(product.asin ?? '') || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug ?? '')) {
      anomalies.push({ code: 'invalid_catalog_identity', file: product.file });
      continue;
    }
    if (product.market !== undefined && product.market !== 'US') {
      anomalies.push({ code: 'unsupported_catalog_market', asin: product.asin, file: product.file });
      continue;
    }
    if (counts.get(product.asin) !== 1) {
      anomalies.push({ code: 'ambiguous_catalog_asin', asin: product.asin, file: product.file });
      continue;
    }
    if (slugs.get(product.slug) !== 1) {
      anomalies.push({ code: 'ambiguous_catalog_slug', slug: product.slug, file: product.file });
      continue;
    }
    evaluations.push({
      asin: product.asin, slug: product.slug, name: product.name, category: product.category,
      market: 'US', state: product.catalogActive === false ? 'inactive' : 'needs-review',
      publicFacing: false, automatedApproval: false,
      reason: 'Review exact identity, source-backed claims and buyer usefulness. Scores never authorize publication.',
      ...scoreCatalogProduct(product),
      commission: resolveCommissionClassification({ asin: product.asin, market: 'US' }, commissionClassifications, generatedAt),
      estimatedCommission: null,
    });
  }
  evaluations.sort((a, b) => (b.opportunityScore.score ?? -1) - (a.opportunityScore.score ?? -1)
    || b.opportunityScore.coverage - a.opportunityScore.coverage || a.slug.localeCompare(b.slug));
  return {
    schemaVersion: 2, generatedAt, market: 'US', mode: 'editorial-review-only',
    note: 'Incomplete evidence-weighted review priorities, not product approval, verified deals, revenue forecasts or commission rankings.',
    totalProducts: products.length, reviewCandidates: evaluations.filter((item) => item.state === 'needs-review').length,
    automatedApprovals: 0, anomalies, evaluations,
  };
}

export function runDiscovery({ now = new Date() } = {}) {
  const registry = JSON.parse(readText('data/amazon-commission-classifications.json'));
  if (registry.schemaVersion !== 1 || registry.market !== 'US' || !Array.isArray(registry.classifications)) throw new Error('invalid_commission_registry');
  const report = buildDiscoveryReport(readProducts(), { now, commissionClassifications: registry.classifications });
  writeText('reports/discovery/product-review.json', JSON.stringify(report, null, 2) + '\n');
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 2) throw new Error('Product discovery takes no arguments; all candidates require review.');
  if (process.env.FLOWHOME_ROI_PHASE) console.warn('FLOWHOME_ROI_PHASE is retired and ignored; no commission threshold approves products.');
  const report = runDiscovery();
  console.log(`Editorial review report: ${report.totalProducts} products, ${report.reviewCandidates} candidates, 0 automated approvals, ${report.anomalies.length} identity anomalies. reports/discovery/product-review.json`);
  if (report.anomalies.length) process.exitCode = 1;
}
