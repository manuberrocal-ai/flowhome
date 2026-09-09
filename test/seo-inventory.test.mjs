import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { analyzeLinkGraph, auditBuild, inspectPageMetadata, inventoryCsv, requiredSchemaTypes, resolveInternalLink } from '../scripts/qa/seo-audit.mjs';

const SITE = 'https://flowhome.dev';
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
function html({ route, title = route === '/' ? 'Home' : route, h1 = title, body = '', schemas = [], robots = 'index, follow', canonical = `${SITE}${route}`, lang = 'en' }) {
  return `<!doctype html><html${lang ? ` lang="${lang}"` : ''}><head><title>${escape(title)}</title><meta name="description" content="${escape(`Description of ${route}`)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${escape(canonical)}"></head><body><h1>${escape(h1)}</h1>${body}${schemas.map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`).join('')}</body></html>`;
}

async function fixture(t, pages) {
  const root = await mkdtemp(join(tmpdir(), 'flowhome-seo-inventory-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dist = join(root, 'dist');
  await mkdir(dist);
  for (const page of pages) {
    const file = join(dist, page.route.replace(/^\//, ''), 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html(page));
  }
  await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /account/\nDisallow: /cart/\nDisallow: /search/\n');
  await writeFile(join(dist, 'sitemap-index.xml'), `<sitemapindex><sitemap><loc>${SITE}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
  await writeFile(join(dist, 'sitemap-0.xml'), `<urlset>${pages.filter((page) => !/noindex|none/.test(page.robots || '')).map((page) => `<url><loc>${SITE}${page.route}</loc></url>`).join('')}</urlset>`);
  const redirectsPath = join(root, '_redirects');
  await writeFile(redirectsPath, '');
  return { dist, redirectsPath, reportPath: join(root, 'audit', 'report.json') };
}

test('inventory records decoded metadata, language and noindex without fabricating missing values', () => {
  const value = inspectPageMetadata(html({ route: '/example/', title: 'A & B', h1: 'A < B', robots: 'noindex, follow', lang: 'en-US' }), '/example/');
  assert.equal(value.title, 'A & B');
  assert.equal(value.h1, 'A < B');
  assert.equal(value.canonical, `${SITE}/example/`);
  assert.equal(value.lang, 'en-US');
  assert.equal(value.indexable, false);
  assert.equal(value.noindex, true);
  assert.deepEqual(value.counts, { titles: 1, descriptions: 1, h1s: 1, canonicals: 1 });
  const missing = inspectPageMetadata('<html><body></body></html>', '/empty/');
  assert.equal(missing.title, null);
  assert.equal(missing.lang, null);
  assert.equal(missing.canonical, null);
  assert.equal(inspectPageMetadata(html({ route: '/404/' }), '/404/').indexable, false);
  assert.equal(inspectPageMetadata(html({ route: '/private/', robots: 'none' }), '/private/').indexable, false);
  const scriptOnly = inspectPageMetadata(`${html({ route: '/' })}<script>const template = '<h1>Not rendered</h1>';</script><!-- <title>Not rendered</title> -->`, '/');
  assert.equal(scriptOnly.counts.h1s, 1);
  assert.equal(scriptOnly.counts.titles, 1);
});

test('internal links resolve absolute, protocol-relative, path-relative and fragment URLs', () => {
  assert.equal(resolveInternalLink('../target/#section', '/category/source/').pathname, '/category/target/');
  assert.equal(resolveInternalLink('//flowhome.dev/target/', '/').pathname, '/target/');
  assert.equal(resolveInternalLink(`${SITE}/target/`, '/').pathname, '/target/');
  assert.equal(resolveInternalLink('#section', '/same/').pathname, '/same/');
  for (const href of ['https://example.com/', '//example.com/', 'javascript:alert(1)', 'mailto:test@example.com', '', undefined]) assert.equal(resolveInternalLink(href), null);
});

test('graph deduplicates links, ignores self-links, measures shortest depth and detects disconnected cycles', () => {
  const graph = new Map(analyzeLinkGraph([
    { route: '/', outlinks: ['/', '/a/', '/a/', '/missing/'] },
    { route: '/a/', outlinks: ['/a/', '/b/', '/deep/'] },
    { route: '/b/', outlinks: ['/deep/'] },
    { route: '/deep/', outlinks: [] },
    { route: '/island-a/', outlinks: ['/island-b/'] },
    { route: '/island-b/', outlinks: ['/island-a/', '/island-b/'] },
  ]).map((page) => [page.route, page]));
  assert.deepEqual(graph.get('/').outlinks, ['/a/']);
  assert.deepEqual(graph.get('/a/').inlinks, ['/']);
  assert.equal(graph.get('/a/').inlinkCount, 1);
  assert.equal(graph.get('/deep/').depth, 2);
  assert.deepEqual(graph.get('/deep/').inlinks, ['/a/', '/b/']);
  assert.equal(graph.get('/island-a/').depth, null);
  assert.equal(graph.get('/island-b/').depth, null);
  assert.equal(graph.get('/island-a/').inlinkCount, 1);
});

test('crawl depth respects nofollow links and page directives but permits noindex-follow transit', () => {
  const graph = new Map(analyzeLinkGraph([
    { route: '/', outlinks: ['/blocked/', '/utility/', '/follow/'], crawlOutlinks: ['/utility/', '/follow/'] },
    { route: '/blocked/', outlinks: [] },
    { route: '/utility/', robots: 'noindex, nofollow', outlinks: ['/hidden/'] },
    { route: '/follow/', robots: 'noindex, follow', outlinks: ['/reachable/'] },
    { route: '/hidden/', outlinks: [] },
    { route: '/reachable/', outlinks: [] },
  ]).map((page) => [page.route, page]));
  assert.equal(graph.get('/blocked/').depth, null);
  assert.equal(graph.get('/hidden/').depth, null);
  assert.equal(graph.get('/reachable/').depth, 2);
});

test('schema requirements follow visible page families and do not invent offers, ratings or articles', () => {
  assert.deepEqual(requiredSchemaTypes('/best/a/', { hasProducts: true }), ['BreadcrumbList', 'ItemList']);
  assert.deepEqual(requiredSchemaTypes('/category/a/', { hasProducts: false }), ['BreadcrumbList']);
  assert.deepEqual(requiredSchemaTypes('/product/a/'), ['BreadcrumbList', 'Product']);
  assert.deepEqual(requiredSchemaTypes('/review/a/', { hasReviewProduct: true }), ['BreadcrumbList', 'Review']);
  assert.deepEqual(requiredSchemaTypes('/review/a/'), ['BreadcrumbList']);
  assert.deepEqual(requiredSchemaTypes('/best/'), []);
});

test('CSV preserves quoted text and empty depth, sorts routes and neutralizes formulas', () => {
  const csv = inventoryCsv([
    { route: '/z/', title: '=HYPERLINK("https://example.com")', description: 'comma, "quote"\nsecond line', depth: null, indexable: true, inlinks: ['/a/', '/b/'] },
    { route: '/', title: 'Home', depth: 0 },
  ]);
  assert.match(csv, /^route,canonical,title,description,h1,robots,indexable,lang,schemas,requiredSchemas,inlinkCount,outlinkCount,depth,inlinks,outlinks\r\n/);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.com""\)"/);
  assert.match(csv, /"comma, ""quote""\nsecond line"/);
  assert.ok(csv.indexOf('"/",') < csv.indexOf('"/z/",'));
  assert.match(csv, /"\/a\/ \| \/b\/"/);
});

test('full audit reports disconnected islands, unique graph inventory and duplicate H1', async (t) => {
  const options = await fixture(t, [
    { route: '/', body: `<a href="/connected/">One</a><a href="${SITE}/connected/">Two</a><a href="#self">Self</a><script>const template = '<a href="/island-a/">Client-only link</a>';</script><!-- <a href="/island-b/">Comment</a> -->` },
    { route: '/connected/', h1: 'Repeated heading', body: '<a href="/connected/">Self</a>' },
    { route: '/island-a/', h1: 'Repeated heading', body: '<a href="/island-b/">Island B</a>' },
    { route: '/island-b/', body: '<a href="/island-a/">Island A</a>' },
  ]);
  const report = await auditBuild(options);
  assert.deepEqual(report.errors.filter((error) => /unreachable from home/.test(error.message)).map((error) => error.route).sort(), ['/island-a/', '/island-b/']);
  assert.equal(report.errors.filter((error) => /Duplicate indexable H1/.test(error.message)).length, 1);
  const connected = report.pages.find((page) => page.route === '/connected/');
  assert.equal(connected.depth, 1);
  assert.equal(connected.inlinkCount, 1);
  assert.equal(connected.outlinkCount, 0);
  assert.equal(report.pages.find((page) => page.route === '/island-a/').inlinkCount, 1);
  assert.equal(report.inventoryPath, join(dirname(options.reportPath), 'inventory.csv'));
  assert.equal(JSON.parse(await readFile(options.reportPath, 'utf8')).pages.length, 4);
  assert.match(await readFile(report.inventoryPath, 'utf8'), /"\/island-a\/"/);
});

test('full audit requires actual product/list/review schemas and accepts matching graph schemas', async (t) => {
  const routes = ['/best/guide/', '/category/hubs/', '/category/empty/', '/product/sample/', '/review/sample/'];
  const breadcrumb = (title) => ({ '@type': 'BreadcrumbList', itemListElement: [{ name: title, position: 1, item: `${SITE}/` }] });
  const list = { '@type': 'ItemList', itemListElement: [{ name: 'Sample', url: `${SITE}/product/sample/`, position: 1 }] };
  const reviewed = { '@type': 'Product', name: 'Sample' };
  const pages = [
    { route: '/', body: routes.map((route) => `<a href="${route}">${route}</a>`).join('') },
    { route: '/best/guide/', body: '<article class="product-card"><a href="/product/sample/">Sample</a></article><!-- <script type="application/ld+json">{"@type":"ItemList"}</script> -->' },
    { route: '/category/hubs/', body: '<article class="product-card">Sample</article>' },
    { route: '/category/empty/' },
    { route: '/product/sample/', h1: 'Sample' },
    { route: '/review/sample/', body: '<a data-cta-position="review_summary">Sample</a>' },
  ];
  const options = await fixture(t, pages);
  const failed = await auditBuild(options);
  assert.equal(failed.errors.filter((error) => /Required ItemList/.test(error.message)).length, 2);
  assert.equal(failed.errors.filter((error) => /Required Product/.test(error.message)).length, 1);
  assert.equal(failed.errors.filter((error) => /Required Review/.test(error.message)).length, 1);
  for (const page of pages.slice(1)) {
    const nodes = [breadcrumb(page.h1 ?? page.route)];
    if (['/best/guide/', '/category/hubs/'].includes(page.route)) nodes.push(list);
    if (page.route.startsWith('/product/')) nodes.push(reviewed);
    if (page.route.startsWith('/review/')) nodes.push({ '@type': 'Review', itemReviewed: reviewed });
    await writeFile(join(options.dist, page.route.slice(1), 'index.html'), html({ ...page, schemas: [{ '@context': 'https://schema.org', '@graph': nodes }] }));
  }
  const passed = await auditBuild(options);
  assert.deepEqual(passed.errors, []);
});

test('bad canonical and missing language remain reportable without aborting inventory', async (t) => {
  const options = await fixture(t, [{ route: '/', canonical: 'not a URL', lang: '' }]);
  const report = await auditBuild(options);
  assert.ok(report.errors.some((error) => /canonical URL/.test(error.message)));
  assert.ok(report.errors.some((error) => /language/.test(error.message)));
  assert.equal(report.pages[0].canonical, 'not a URL');
  assert.equal(report.pages[0].lang, null);
});
