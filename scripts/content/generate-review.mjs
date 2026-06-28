import { readProducts, writeText } from '../lib/content-utils.mjs';

const slug = process.argv[2];
if (!slug) throw new Error('Usage: node scripts/content/generate-review.mjs <product-slug>');
const product = readProducts().find((p) => p.slug === slug);
if (!product) throw new Error(`Product not found: ${slug}`);
const file = `src/content/reviews/${slug}-generated-review.md`;
const content = `---\ntitle: "${product.name} Review: Specs, Setup, Alternatives, and Deal Timing"\ndescription: "A practical FlowHome review of ${product.name} for smart home buyers."\npubDate: ${new Date().toISOString().slice(0, 10)}\nproductSlug: ${slug}\ncategory: ${product.category}\ntags: ["smart home", "${product.category}", "review"]\nfeatured: false\nqualityScore: 7\n---\n\n## Quick verdict\n\n${product.name} is worth considering when the current price is close to $${product.price} and it fits your preferred smart home ecosystem.\n\n## Specifications\n\nTrack compatibility, setup steps, app requirements, and any subscription limitations before publishing.\n\n## Pros and cons\n\nPros: useful category, known brand, clear setup path. Cons: price changes, ecosystem lock-in, and possible premium feature gates.\n\n## Comparison\n\nCompare it against at least two products in the same category before publishing the final article.\n\n## FAQ\n\nFlowHome may earn an affiliate commission from qualifying Amazon purchases.\n`;
writeText(file, content);
console.log(`Generated ${file}`);
