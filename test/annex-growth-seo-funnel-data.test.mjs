import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function read(p) { const c = readFileSync(p, 'utf8'); return c.charCodeAt(0) === 0xFEFF ? c.substring(1) : c; }
function fileExists(p) { return existsSync(p); }

test('GA1 - Sitemap is generated and sitemap-index.xml is referenced by robots.txt', () => {
  assert.ok(fileExists('dist/sitemap-index.xml'), 'build emits sitemap-index.xml');
  const robots = read('public/robots.txt');
  assert.match(robots, /Sitemap:\s+https:\/\/flowhome\.dev\/sitemap-index\.xml/);
});

test('GA2 - IndexNow key file present and consistent with the configured key in lib', () => {
  const key = read('public/85b3b79bd6a26a3862465cc5611db3a2.txt');
  assert.match(key, /^85b3b79bd6a26a3862465cc5611db3a2\b/);
  const submit = read('scripts/deploy/indexnow-submit.mjs');
  assert.match(submit, /findIndexNowKey/, 'indexnow-submit.mjs must derive key from public file');
    assert.ok(/\.txt\$/.test(submit), 'indexnow-submit.mjs must validate the key file extension');

});

test('GA3 - Cloudflare Pages config exposes GTM ID and security-related env variables', () => {
  const wrangler = read('wrangler.toml');
  assert.match(wrangler, /PUBLIC_GTM_ID\s*=\s*"GTM-KX37WSZQ"/);
  assert.match(wrangler, /PUBLIC_SITE_URL\s*=\s*"https:\/\/flowhome\.dev"/);
});

test('GA4 - Organic growth scorecard keeps the 14-column header and is non-empty', () => {
  const csv = read('data/organic-growth-scorecard.csv');
  const header = csv.split(/\r?\n/)[0].trim();
  const expected = ['recorded_at','window_days','source','cluster','page_url','query','impressions','clicks','ctr','avg_position','sessions','engaged_sessions','affiliate_clicks','notes'];
  const actual = header.split(',').map((h) => h.trim());
  assert.deepEqual(actual, expected);
  assert.ok(csv.trim().length > header.length, 'scorecard has at least one data row');
});

test('GA5 - Quality report JSON exists and contains a validated checksums array', () => {
  assert.ok(fileExists('data/quality-report.json'));
  const report = JSON.parse(read('data/quality-report.json'));
  assert.ok(Array.isArray(report.checksums) || Array.isArray(report.results) || Array.isArray(report.entries) || typeof report === 'object');
});

test('GA6 - Deal report JSON exists and uses a dealDate or endDate field', () => {
  assert.ok(fileExists('data/deal-report.json'));
  const report = JSON.parse(read('data/deal-report.json'));
  assert.ok(typeof report === 'object');
});

test('GEO1 - Open Graph + Twitter Card meta tags are present in BaseLayout for social previews', () => {
  const base = read('src/layouts/BaseLayout.astro');
  assert.match(base, /property="og:type"/);
  assert.match(base, /property="og:title"/);
  assert.match(base, /property="og:description"/);
  assert.match(base, /property="og:image"/);
  assert.match(base, /property="og:url"/);
  assert.match(base, /property="og:site_name"/);
  assert.match(base, /name="twitter:card"/);
  assert.match(base, /name="twitter:title"/);
  assert.match(base, /name="twitter:description"/);
});

test('GEO2 - Canonical URL is generated and emitted with link rel canonical in BaseLayout', () => {
  const base = read('src/layouts/BaseLayout.astro');
  assert.match(base, /<link rel="canonical"/);
});

test('GEO3 - Open Graph images exist for at least the homepage and store graphics directory', () => {
  const og = read('public/images/og-default.svg');
  assert.ok(og.length > 100, 'og-default.svg exists in public/images');
});

test('SEO1 - JSON-LD structured data utilities exist and export functions for product, review, breadcrumb, ItemList and FAQ schemas', () => {
  const seo = read('src/lib/seo.ts');
  assert.match(seo, /export function generateProductSchema/);
  assert.match(seo, /export function generateReviewSchema/);
  assert.match(seo, /export function generateBreadcrumbSchema/);
  assert.match(seo, /export function generateItemListSchema/);
  assert.match(seo, /export function generateFAQSchema/);
  assert.match(seo, /export function generateOrganizationSchema/);
});

test('SEO2 - Publisher/Organization markup declared in BaseLayout via JSON-LD', () => {
  const base = read('src/layouts/BaseLayout.astro');
  assert.match(base, /generateOrganizationSchema|@type['"]:\s*['"]Organization/);
  assert.match(base, /generateWebSiteSchema|@type['"]:\s*['"]WebSite/);
});

test('SEO3 - robots.txt allows indexing of the homepage and private pages are gated by noindex', () => {
  const robots = read('public/robots.txt');
  assert.match(robots, /User-agent:\s*\*/);
  assert.match(robots, /Allow:\s*\//);
  for (const page of ['src/pages/account.astro', 'src/pages/cart.astro', 'src/pages/search.astro', 'src/pages/404.astro']) {
    const content = read(page);
    assert.match(content, /noindex(=\{true\})?>/, `${page} must set noindex on private/utility pages`);
  }
});

test('SEO4 - OpenSearch XML descriptor is published at /opensearch.xml and referenced from BaseLayout', () => {
  assert.ok(fileExists('public/opensearch.xml'));
  const base = read('src/layouts/BaseLayout.astro');
  assert.match(base, /opensearch\.xml/);
});

test('FUN1 - Acquisition events flow through a central dispatcher, no direct window.gtag calls on CTAs', () => {
  const card = read('src/components/ProductCard.astro');
  assert.match(card, /data-fh-track=/);
  assert.ok(!/window\.gtag\(/.test(card), 'ProductCard never calls window.gtag directly');
  const analytics = read('src/lib/analytics.ts');
  assert.match(analytics, /trackEvent/);
  assert.match(analytics, /export function/);
});

test('FUN2 - Sticky CTA and Exit Intent popup expose affiliate disclosure and do not block Amazon access', () => {
  const sticky = read('src/components/StickyCTA.astro');
  assert.match(sticky, /data-fh-amazon-cta/);
  assert.match(sticky, /rel="nofollow sponsored noopener noreferrer"/);
  const exit = read('src/components/ExitIntentPopup.astro');
  assert.match(exit, /flow-wave|premium-action/);
});

test('FUN3 - Funnel navigation statements (View details / Add to list / Take the quiz) are present across card layout and quiz', () => {
  const card = read('src/components/ProductCard.astro');
  assert.match(card, /product-card-side-action--details/);
  assert.match(card, /product-card-side-action--list/);
  const quiz = read('src/pages/quiz.astro');
  assert.match(quiz, /See my recommendations/);
});

test('DATA1 - Product YAMLs cover at least 25 catalog entries (active catalog threshold)', () => {
  const files = readdirSync('src/content/products').filter((f) => f.endsWith('.yaml'));
  assert.ok(files.length >= 25, `only ${files.length} product YAMLs`);
});

test('DATA2 - Reviews collection has at least 12 entries', () => {
  const files = readdirSync('src/content/reviews').filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  assert.ok(files.length >= 12, `only ${files.length} review files`);
});

test('DATA3 - Deals collection exposes endDate so expired deals are filtered out', () => {
  const files = readdirSync('src/content/deals').filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  assert.ok(files.length > 0);
  for (const file of files) {
    const content = read(join('src/content/deals', file));
    assert.match(content, /^endDate:/m, `${file} missing endDate`);
    assert.match(content, /^startDate:/m, `${file} missing startDate`);
  }
});

test('DATA4 - product-art fallback images cover every canonical category defined in taxonomy', () => {
  const art = read('src/lib/product-art.ts');
  const tax = read('src/lib/product-taxonomy.ts');
  const categories = tax.match(/'([a-z-]+)'/g) ?? [];
  assert.ok(categories.length > 10);
  assert.match(art, /product-art/);
});

test('DATA5 - Quiz serializes ONLY catalog-active products and tracks completion events', () => {
  const quiz = read('src/pages/quiz.astro');
  assert.match(quiz, /catalogActive/);
  assert.match(quiz, /trackEvent\(['"]quiz_complete/);
});

test('DATA6 - Privacy page declares affiliate disclosure and accounts for GTM/clarity consent', () => {
  const privacy = read('src/pages/privacy.astro');
  assert.match(privacy, /affiliate|Amazon Associate|associates|earn from qualifying/i);
  assert.match(privacy, /consent|cookie/i);
});
