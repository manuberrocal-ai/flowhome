import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { readProducts } from '../lib/content-utils.mjs';

export function renderReviewDraft(product) {
  if (!product || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || typeof product.name !== 'string' || !product.name.trim()) {
    throw new Error('A catalog product with a safe slug and name is required');
  }
  const metadata = stringify({ status: 'draft', publication: 'blocked-pending-human-review', title: `${product.name} — research draft`, productSlug: product.slug });
  return `---\n${metadata}---\n\n# Research draft — not ready to publish\n\nThis is an unverified editorial checklist, not a recommendation, physical test or completed review.\n\n## Evidence required\n\n- Confirm the exact model, generation, ASIN, marketplace and bundle.\n- Record primary source URLs, access dates, supported functions and limitations.\n- Verify firmware, required hubs, installation and subscription conditions.\n- Compare at least two relevant alternatives without unsupported rankings.\n- Obtain human review of any safety, privacy, security or financial claim.\n\n## Commercial information\n\nDo not embed prices, discounts, stock or customer ratings in prose. Any future display must use the authorized, current commerce-data layer.\n\n## Publication gate\n\nThis file remains outside the published content collections. A human must resolve the checklist, review the claims and explicitly approve any transfer to publishable content. No author, publication date or quality score has been fabricated.\n`;
}

export function writeReviewDraft(product, projectRoot = process.cwd()) {
  const content = renderReviewDraft(product);
  const file = join(projectRoot, 'reports', 'content-drafts', `${product.slug}-review.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, { encoding: 'utf8', flag: 'wx' });
  return file;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug || process.argv.length !== 3) throw new Error('Usage: node scripts/content/generate-review.mjs <product-slug>');
  const product = readProducts().find((item) => item.slug === slug);
  if (!product) throw new Error('Product not found');
  console.log(`Created review-only draft: ${writeReviewDraft(product)}`);
}
