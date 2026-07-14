import { listFiles, readText, frontmatterMarkdown, writeText } from '../lib/content-utils.mjs';

const dryRun = process.env.SYNDICATION_DRY_RUN !== 'false';
const platforms = ['wordpress', 'devto', 'hashnode', 'tumblr', 'bluesky'];
const reviews = listFiles('src/content/reviews', '.md').map((file) => ({ file, ...frontmatterMarkdown(readText(file)) }));
const canonicalSlug = (review) => String(review.data.slug || review.file.split(/[\\/]/).pop().replace(/\.md$/, '')).trim().replace(/^\/+|\/+$/g, '');
const queue = reviews.slice(0, Number(process.env.SYNDICATION_LIMIT || 2)).map((review) => ({
  title: review.data.title,
  source: review.file,
  canonical: `https://flowhome.dev/review/${encodeURIComponent(canonicalSlug(review))}/`,
  platforms: platforms.map((platform) => ({ platform, status: dryRun ? 'dry-run' : 'pending-api-integration' })),
}));
writeText('data/syndication-queue.json', JSON.stringify({ generatedAt: new Date().toISOString(), dryRun, queue }, null, 2));
console.log(`Prepared syndication queue for ${queue.length} articles. Dry run: ${dryRun}`);
