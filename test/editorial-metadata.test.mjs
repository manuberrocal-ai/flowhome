import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const editorial = readFileSync('src/lib/editorial.ts', 'utf8');
const review = readFileSync('src/layouts/ReviewLayout.astro', 'utf8');
const product = readFileSync('src/pages/product/[slug].astro', 'utf8');
const about = readFileSync('src/pages/about.astro', 'utf8');
const contentConfig = readFileSync('src/content.config.ts', 'utf8');
const aboutPolicy = readFileSync('docs/BLOCK5_COMPLETION_REPORT.md', 'utf8');
const robots = readFileSync('public/robots.txt', 'utf8');
const llms = readFileSync('public/llms.txt', 'utf8');
const baseLayout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
const seo = readFileSync('src/lib/seo.ts', 'utf8');

test('editorial metadata has an organization fallback and safe sources', () => {
  assert.match(editorial, /EDITORIAL_TEAM/);
  assert.match(editorial, /resolveAuthor\(authorId\?: string\)/);
  assert.match(editorial, /: EDITORIAL_TEAM/);
  assert.match(editorial, /protocol === 'https:'/);
  assert.match(editorial, /reviewedBy\?: string/);
  assert.match(editorial, /humanReviewedDate\?: string/);
  assert.match(editorial, /EDITORIAL_AUTHORS/);
  assert.ok((contentConfig.match(/authorId: z\.string\(\)\.optional\(\)/g) ?? []).length >= 2, 'products and reviews must both support authors');
  assert.ok((contentConfig.match(/humanReviewedDate: z\.string\(\)\.optional\(\)/g) ?? []).length >= 2, 'products and reviews must both support explicit human review dates');
});

test('editorial pages distinguish publication, update, and explicit human review dates', () => {
  assert.match(review, /Published/);
  assert.match(review, /Content updated/);
  assert.match(review, /Human reviewed/);
  assert.match(product, /Product data updated/);
  assert.match(product, /not a human review/);
});

test('editorial copy does not invent a person, credential, or hands-on test', () => {
  assert.match(about, /not an individual person/);
  assert.match(about, /No hands-on testing is implied/);
  assert.match(editorial, /does not represent a personal professional credential/);
  assert.match(editorial, /hasStructuredData = false/);
  assert.match(editorial, /return 'not-verified'/);
  assert.match(about, /hands-on tested.*only when documented physical testing exists/i);
  assert.doesNotMatch(about, /FlowHome (?:has|performs|conducts|completed).*hands-on tested/i);
});

test('Block 5 preserves truthful crawl, localization, and authority contracts', () => {
  assert.match(aboutPolicy, /sameAs.*verified/i);
  assert.match(aboutPolicy, /reciprocal.*hreflang/i);
  assert.match(aboutPolicy, /llms\.txt.*optional.*not a ranking factor/i);
  assert.match(aboutPolicy, /assistant-referral measurement/i);
  assert.match(aboutPolicy, /Digital PR\/backlink/i);
  assert.match(robots, /User-agent: OAI-SearchBot\r?\nAllow: \/\r?\n/);
  assert.match(robots, /User-agent: OAI-SearchBot[\s\S]*?Disallow: \/account\/\r?\nDisallow: \/cart\/\r?\nDisallow: \/search\/\r?\n/);
  assert.match(robots, /User-agent: GPTBot\r?\nDisallow: \/\r?\n/);
  assert.doesNotMatch(llms, /US\/Canada/);
  assert.match(llms, /US readers.*USD snapshots/i);
  assert.match(aboutPolicy, /llms\.txt.*optional convenience file.*not a ranking factor/i);
  assert.doesNotMatch(baseLayout, /Expert smart home product reviews/i);
  assert.doesNotMatch(product, /reliable .*broad ecosystem compatibility|Strong owner feedback|Good value inside current category/i);
  assert.match(seo, /author = 'FlowHome Editorial Team'/);
  assert.match(seo, /hasEditorialRating/);
  assert.match(seo, /getValidEditorialRating/);
  assert.match(review, /getValidEditorialRating/);
  assert.match(review, /Editorial rating:/);
});
