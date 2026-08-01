import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { aggregateLighthouseSamples, classifyLighthouseOutcome, isCompleteLighthouseReport, median, parseLighthouseRuns } from '../scripts/qa/lighthouse-mobile.mjs';
import { isActionableImage, isPermittedUtilityQuery, normalizedPath, parseRedirects } from '../scripts/qa/seo-audit.mjs';

const root = new URL('..', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');

test('SEO audit normalizes routes, keeps non-content images out of loading noise, and rejects duplicate redirects', () => {
  assert.equal(normalizedPath('/compare/?x=1'), '/compare/');
  assert.equal(isActionableImage(new Map([['alt', 'Product'], ['width', '420'], ['height', '420']])), true);
  assert.equal(isActionableImage(new Map([['alt', ''], ['width', '420'], ['height', '420']])), false);
  assert.equal(isActionableImage(new Map([['alt', 'Avatar'], ['width', '32'], ['height', '32']])), false);
  assert.throws(() => parseRedirects('/old /new 301\n/old /other 301'), /duplicated/);
  assert.deepEqual(parseRedirects('/old /new 301'), [{ from: '/old', to: '/new', status: 301 }]);
});

test('query links are limited to noindex utility routes', () => {
  assert.equal(isPermittedUtilityQuery(true, '/account/'), true);
  assert.equal(isPermittedUtilityQuery(false, '/account/'), false);
  assert.equal(isPermittedUtilityQuery(true, '/products/'), false);
});

test('comparison hub, breadcrumb, replacement links, and compatibility redirect use actual curated routes', async () => {
  const [hub, layout, header, home, redirects] = await Promise.all([read('src/pages/compare/index.astro'), read('src/layouts/CompareLayout.astro'), read('src/components/Header.astro'), read('src/pages/index.astro'), read('public/_redirects')]);
  assert.match(hub, /<h1[^>]*>Smart home product comparisons<\/h1>/);
  assert.match(hub, /amazon-smart-thermostat.*ecobee-smart-thermostat-premium/);
  assert.match(layout, /name: 'Comparisons', href: '\/compare\/'/);
  assert.doesNotMatch(header, /echo-dot-5th-gen-vs-google-nest-hub-2nd-gen-vs-tp-link-kasa-smart-plug-mini/);
  assert.doesNotMatch(home, /echo-dot-5th-gen-vs-google-nest-hub-2nd-gen-vs-tp-link-kasa-smart-plug-mini/);
  assert.match(redirects, /^\/compare\/echo-dot-5th-gen-vs-google-nest-hub-2nd-gen-vs-tp-link-kasa-smart-plug-mini\/ \/compare\/ 301$/m);
});

test('Lighthouse uses the local dependency, loopback preview, lab budgets, and isolated reports', async () => {
  const [pkg, runner, docs] = await Promise.all([read('package.json'), read('scripts/qa/lighthouse-mobile.mjs'), read('docs/SEO_PERFORMANCE_AUDIT.md')]);
  assert.match(pkg, /"lighthouse": "\^13\.4\.1"/);
  assert.match(runner, /node_modules', '.bin'/);
  assert.match(runner, /startPreview\(\)/);
  assert.match(runner, /CHROME_PATH: chrome/);
  assert.match(runner, /--no-enable-error-reporting/);
  assert.doesNotMatch(runner, /--chrome-path=/);
  assert.match(runner, /lcp: 2500, cls: 0\.1, tbt: 200/);
  assert.match(runner, /TEMP: PROFILE_DIR, TMP: PROFILE_DIR/);
  assert.match(runner, /maxRetries: 4, retryDelay: 250/);
  assert.match(runner, /--quiet/);
  assert.match(runner, /LIGHTHOUSE_RUNS \|\| '3'/);
  assert.match(runner, /sample-\$\{sampleIndex\}\.json/);
  assert.match(docs, /blocks external network requests/);
  assert.match(docs, /Verified local lab evidence/);
  assert.match(docs, /three complete samples per route/);
  assert.match(docs, /not field Core Web Vitals/);
});

test('Lighthouse sample count and median aggregation are deterministic', () => {
  assert.equal(parseLighthouseRuns(), 3);
  assert.equal(parseLighthouseRuns('1'), 1);
  assert.equal(parseLighthouseRuns('5'), 5);
  assert.throws(() => parseLighthouseRuns('0'), /1 through 5/);
  assert.throws(() => parseLighthouseRuns('2.5'), /1 through 5/);
  assert.equal(median([9, 1, 5]), 5);
  assert.equal(median([1, 3, 5, 7]), 4);
  const aggregate = aggregateLighthouseSamples([
    { scores: { performance: 90, accessibility: 95, 'best-practices': 100, seo: 100 }, lab: { lcp: 2400, cls: 0, tbt: 0, inp: null } },
    { scores: { performance: 92, accessibility: 97, 'best-practices': 100, seo: 100 }, lab: { lcp: 2500, cls: 0.02, tbt: 20, inp: null } },
    { scores: { performance: 94, accessibility: 99, 'best-practices': 100, seo: 100 }, lab: { lcp: 2600, cls: 0.04, tbt: 40, inp: null } },
  ]);
  assert.equal(aggregate.scores.performance, 92);
  assert.equal(aggregate.lab.lcp, 2500);
  assert.equal(aggregate.lab.inp, null);
  assert.throws(() => aggregateLighthouseSamples([
    { scores: { performance: 90, accessibility: 95, 'best-practices': 100, seo: 100 }, lab: { lcp: null, cls: 0, tbt: 0, inp: null } },
  ]), /median requires/);
});

test('browser QA records loopback HTTP status contracts before Brave cases', async () => {
  const [browserQa, completion] = await Promise.all([read('scripts/qa/browser-smoke.mjs'), read('docs/BLOCK4_COMPLETION_REPORT.md')]);
  assert.match(browserQa, /const HTTP_CHECKS = \[/);
  assert.match(browserQa, /\{ path: '\/', expectedStatus: 200 \}/);
  assert.match(browserQa, /\{ path: '\/robots\.txt', expectedStatus: 200 \}/);
  assert.match(browserQa, /\{ path: '\/sitemap-index\.xml', expectedStatus: 200 \}/);
  assert.match(browserQa, /\{ path: '\/__flowhome-block4-missing__\/', expectedStatus: 404 \}/);
  assert.match(browserQa, /await startPreview\(\);\s+await runHttpChecks\(\);\s+await launchBrave\(\);/);
  assert.match(browserQa, /actualStatus: response\.status/);
  assert.match(completion, /16\/16 Brave cases passed with 0 failures, 0 setup errors, and 0 cleanup errors/);
  assert.match(completion, /home 200, robots 200, sitemap 200, and the deterministic missing path 404/);
  assert.doesNotMatch(completion, /HTTP status checks is pending|HTTP-check rerun pending/);
});

test('Lighthouse retains a complete post-report result but rejects incomplete nonzero exits', () => {
  const requestedUrl = 'http://127.0.0.1:4321/';
  const complete = { finalUrl: requestedUrl, categories: { performance: { score: 0.9 }, accessibility: { score: 1 }, 'best-practices': { score: 1 }, seo: { score: 1 } }, audits: { 'largest-contentful-paint': { numericValue: 2000 }, 'cumulative-layout-shift': { numericValue: 0 }, 'total-blocking-time': { numericValue: 0 } } };
  assert.equal(isCompleteLighthouseReport(complete, requestedUrl), true);
  assert.equal(classifyLighthouseOutcome(1, complete, requestedUrl).usable, true);
  assert.match(classifyLighthouseOutcome(1, complete, requestedUrl).warning, /post-report cleanup warning/);
  assert.equal(classifyLighthouseOutcome(1, undefined, requestedUrl).usable, false);
  for (const audit of ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time']) {
    const incomplete = structuredClone(complete);
    delete incomplete.audits[audit];
    assert.equal(isCompleteLighthouseReport(incomplete, requestedUrl), false);
    assert.equal(classifyLighthouseOutcome(0, incomplete, requestedUrl).usable, false);
  }
});

test('prepaint consent, deferred authenticated sync, and SVG logos preserve public-page boundaries', async () => {
  const [layout, prepaint, banner, header, footer] = await Promise.all([read('src/layouts/BaseLayout.astro'), read('public/consent-prepaint.js'), read('src/components/ConsentBanner.astro'), read('src/components/Header.astro'), read('src/components/Footer.astro')]);
  assert.match(layout, /<script is:inline src="\/consent-prepaint\.js"><\/script>/);
  assert.match(prepaint, /window\.localStorage\.getItem\('flowhome-consent'\)/);
  assert.match(prepaint, /preference\?\.version === 1/);
  assert.match(prepaint, /document\.documentElement\.dataset\.flowhomeConsent = choice/);
  assert.match(layout, /const safePreloadImage = \(\(\) =>/);
  assert.match(layout, /candidate\.origin === Astro\.url\.origin/);
  assert.match(layout, /type="image\/svg\+xml" href="\/favicon\.svg"/);
  assert.match(layout, /import\('\.\.\/lib\/cart-sync\.ts'\)/);
  assert.match(layout, /import\('\.\.\/lib\/supabase-client'\)/);
  assert.doesNotMatch(layout, /import \{ createCartSync \}/);
  assert.match(header, /Object\.keys\(window\.localStorage\).*auth-token/);
  assert.match(header, /import\('\.\.\/lib\/auth-channel\.js'\)/);
  assert.doesNotMatch(header, /import \{ subscribeToAuthChanges \}/);
  assert.match(header, /window\.addEventListener\('focus'/);
  assert.doesNotMatch(banner, /data-consent-banner[^>]*hidden/);
  assert.match(banner, /banner\.dataset\.consentBannerOpen/);
  assert.match(header, /src="\/images\/flowhome-logo\.svg"/);
  assert.match(footer, /src="\/images\/flowhome-logo\.svg"/);
});

test('home caps initial featured-card DOM as an LCP performance budget while preserving the six-product hero', async () => {
  const home = await read('src/pages/index.astro');
  assert.match(home, /const featuredProducts = products\.filter\(\(p\) => p\.data\.catalogActive\)\.slice\(0, 8\);/);
  assert.match(home, /const showcaseProducts = featuredProducts\.slice\(0, 6\);/);
  assert.match(home, /featuredProducts\.map\(\(product\) => <ProductCard product=\{product\} \/>\)/);
  assert.match(home, /<style is:inline>/);
});
