import { readProducts, writeText } from '../lib/content-utils.mjs';

const products = readProducts();
const approved = products.filter((p) => p.roiApproved !== false).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
const report = {
  generatedAt: new Date().toISOString(),
  totalProducts: products.length,
  approvedProducts: approved.length,
  heroProducts: approved.filter((p) => p.priority === 'hero').map((p) => p.slug),
  nextCandidates: approved.slice(0, 10).map((p) => ({ slug: p.slug, name: p.name, category: p.category, priorityScore: p.priorityScore, price: p.price })),
};
writeText('data/product-discovery-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
