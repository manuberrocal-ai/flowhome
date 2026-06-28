import { readProducts, writeText } from '../lib/content-utils.mjs';
import { evaluateInternalProduct } from '../lib/internal-roi.mjs';

const phase = process.env.FLOWHOME_ROI_PHASE || 'seed';
const products = readProducts();
const evaluations = products
  .map((product) => evaluateInternalProduct(product, phase))
  .sort((a, b) => b.internalScore - a.internalScore || b.estimatedCommission - a.estimatedCommission);

const approved = evaluations.filter((item) => item.approved);
const report = {
  generatedAt: new Date().toISOString(),
  note: 'Internal-only product selection report. Do not expose ROI, commission, or score language in public site copy.',
  phase,
  totalProducts: products.length,
  approvedProducts: approved.length,
  leadCandidates: approved.filter((item) => item.internalTier === 'lead').slice(0, 10),
  testCandidates: approved.filter((item) => item.internalTier === 'test').slice(0, 10),
  watchlist: evaluations.filter((item) => item.internalTier === 'watchlist').slice(0, 10),
  rejected: evaluations.filter((item) => item.internalTier === 'reject').slice(0, 10),
};

writeText('data/internal-product-radar.json', JSON.stringify(report, null, 2));
writeText('data/product-discovery-report.json', JSON.stringify({
  generatedAt: report.generatedAt,
  totalProducts: report.totalProducts,
  approvedProducts: report.approvedProducts,
  note: report.note,
  nextCandidates: [...report.leadCandidates, ...report.testCandidates].slice(0, 10).map((item) => ({
    slug: item.slug,
    name: item.name,
    category: item.category,
    price: item.price,
    internalTier: item.internalTier,
    internalScore: item.internalScore,
    estimatedCommission: item.estimatedCommission,
    publicFacing: false,
  })),
}, null, 2));

if (process.env.FLOWHOME_DEBUG_INTERNAL === 'true') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Internal product discovery complete. Products: ${report.totalProducts}. Approved: ${report.approvedProducts}. Detailed operator report written to data/internal-product-radar.json.`);
}
