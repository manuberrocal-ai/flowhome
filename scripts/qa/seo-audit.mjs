import { mkdtemp, opendir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://flowhome.dev';
const UTILITY_ROUTES = new Set(['/account/', '/cart/', '/search/']);
async function outputPath() {
  const output = process.env.SEO_AUDIT_REPORT_PATH
    ? resolve(process.env.SEO_AUDIT_REPORT_PATH)
    : join(await mkdtemp(join(tmpdir(), 'flowhome-seo-audit-')), 'report.json');
  if (!relative(ROOT, output).startsWith('..')) throw new Error('SEO_AUDIT_REPORT_PATH must be outside the repository.');
  return output;
}

export function normalizedPath(value) {
  const url = new URL(value, SITE);
  const pathname = url.pathname.replace(/\/+/g, '/');
  return pathname === '/' ? '/' : `${pathname.replace(/\/$/, '')}/`;
}

export function isActionableImage(attrs) {
  const width = Number(attrs.get('width')) || 0;
  const height = Number(attrs.get('height')) || 0;
  return attrs.get('alt') !== '' && !attrs.has('hidden') && attrs.get('aria-hidden') !== 'true'
    && Math.max(width, height) > 64 && attrs.get('fetchpriority') !== 'high';
}

export function isPermittedUtilityQuery(sourceIsNoindex, target) {
  return sourceIsNoindex && UTILITY_ROUTES.has(target);
}

export function parseRedirects(source) {
  const seen = new Set();
  return source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line, index) => {
    const [from, to, status, ...extra] = line.split(/\s+/);
    if (!from || !to || !status || extra.length || !/^\d{3}$/.test(status)) throw new Error(`_redirects line ${index + 1} is malformed.`);
    if (seen.has(from)) throw new Error(`_redirects source is duplicated: ${from}`);
    seen.add(from);
    return { from, to, status: Number(status) };
  });
}

async function files(directory) {
  const result = [];
  const entries = await opendir(directory);
  for await (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

function routeForHtml(file) {
  const local = relative(DIST, file).replaceAll('\\', '/');
  if (local === 'index.html') return '/';
  if (local === '404.html') return '/404/';
  if (basename(local) === 'index.html') return `/${dirname(local).replaceAll('\\', '/')}/`;
  return `/${local.replace(/\.html$/, '')}/`;
}

function targetForFile(file) {
  const local = relative(DIST, file).replaceAll('\\', '/');
  if (local === 'index.html') return '/';
  if (basename(local) === 'index.html') return `/${dirname(local).replaceAll('\\', '/')}/`;
  return `/${local}`;
}

function attributes(tag) {
  const values = new Map();
  for (const match of tag.matchAll(/\s([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) values.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  return values;
}

function visibleText(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isVerificationHtml(file) {
  return /^google[a-z0-9]+\.html$/i.test(basename(file));
}

function isInternalHref(value) {
  return value.startsWith('/') && !value.startsWith('//');
}

function external(value) {
  return /^https?:\/\//i.test(value);
}

function pathFromHref(value) {
  return normalizedPath(value);
}

function metric(report, key, value) {
  report.observed[key] = Math.max(report.observed[key] || 0, value);
}

async function main() {
  const output = await outputPath();
  try { await stat(DIST); } catch { throw new Error('dist/ is missing. Run npm.cmd run build before npm.cmd run seo:audit.'); }
  const report = {
    generatedAt: new Date().toISOString(), site: SITE, dist: DIST, reportPath: output,
    budgets: { maxHtmlBytes: 300000, maxInlineScriptBytes: 120000, maxFirstPartyCssJsBytes: 800000, maxExternalScripts: 0, maxExternalStylesheets: 0, maxRemoteImages: 64 },
    observed: { maxHtmlBytes: 0, maxInlineScriptBytes: 0, maxFirstPartyCssJsBytes: 0, maxRemoteImages: 0 }, pages: [], errors: [], warnings: [], redirects: [],
  };
  const addError = (route, message) => report.errors.push({ route, message });
  const addWarning = (route, message) => report.warnings.push({ route, message });
  const allFiles = await files(DIST);
  const targets = new Set(allFiles.map(targetForFile));
  const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
  const contentFiles = htmlFiles.filter((file) => !isVerificationHtml(file));
  const pagesByRoute = new Map(contentFiles.map((file) => [routeForHtml(file), file]));
  const incoming = new Map([...pagesByRoute.keys()].map((route) => [route, 0]));
  const indexableRoutes = new Set();
  const canonicalRoutes = new Map();
  const titleRoutes = new Map();
  const descriptionRoutes = new Map();

  function assertKnownTarget(route, href) {
    const target = pathFromHref(href);
    if (pagesByRoute.has(target) || targets.has(new URL(href, SITE).pathname)) return target;
    addError(route, `Internal link target is missing from build: ${href}.`);
    return undefined;
  }

  function validateSchema(route, schema, text) {
    const allowed = new Set(['Organization', 'WebSite', 'BreadcrumbList', 'ItemList', 'Product', 'Offer', 'Review', 'Article', 'HowTo', 'FAQPage', 'Question', 'Answer', 'HowToStep', 'ListItem']);
    const validate = (node) => {
      if (!node || typeof node !== 'object') return;
      const type = node['@type'];
      if (!allowed.has(type)) addError(route, `Unsupported JSON-LD type: ${String(type)}.`);
      if (type === 'Organization' && node.sameAs) addError(route, 'Organization sameAs requires verified public profiles and must be omitted when unverified.');
      if (type === 'Product') {
        if (!node.name || !text.includes(String(node.name))) addError(route, 'Product schema name is absent from visible content.');
        if (node.aggregateRating) addError(route, 'Product aggregateRating is unsupported by the source model.');
        for (const offer of Array.isArray(node.offers) ? node.offers : [node.offers]) validate(offer);
      }
      if (type === 'Offer') {
        for (const field of ['price', 'priceCurrency', 'url']) if (node[field] === undefined) addError(route, `Offer schema lacks ${field}.`);
        if (node.price !== undefined && !text.includes(String(node.price))) addError(route, 'Offer price is absent from visible content.');
      }
      if (type === 'Review') {
        if (node.reviewRating && !text.includes(String(node.reviewRating.ratingValue))) addError(route, 'Review rating is absent from visible content.');
        validate(node.itemReviewed);
      }
      if (type === 'BreadcrumbList') for (const item of node.itemListElement || []) if (!item.name || !text.includes(String(item.name))) addError(route, 'Breadcrumb schema item is absent from visible content.');
      if (type === 'ItemList') for (const item of node.itemListElement || []) {
        if (!item.name || !text.includes(String(item.name))) addError(route, 'ItemList name is absent from visible content.');
        if (item.url) assertKnownTarget(route, item.url);
      }
      if (type === 'FAQPage') for (const question of node.mainEntity || []) {
        if (!text.includes(String(question.name || '')) || !text.includes(String(question.acceptedAnswer?.text || ''))) addError(route, 'FAQ schema question or answer is absent from visible content.');
      }
      if (type === 'HowTo') for (const step of node.step || []) if (!text.includes(String(step.name || step.text || ''))) addError(route, 'HowTo step is absent from visible content.');
      if (type === 'Article') {
        if (!node.headline || !text.includes(String(node.headline))) addError(route, 'Article headline is absent from visible content.');
        for (const field of ['datePublished', 'dateModified']) if (node[field] && Number.isNaN(Date.parse(node[field]))) addError(route, `Article ${field} is invalid.`);
      }
    };
    for (const node of Array.isArray(schema) ? schema : [schema]) validate(node);
  }

  for (const [route, file] of pagesByRoute) {
    const html = await readFile(file, 'utf8');
    const text = visibleText(html);
    const special404 = route === '/404/';
    const page = { route, bytes: Buffer.byteLength(html), schemas: [], links: 0, images: 0, firstPartyCssJsBytes: 0, externalScripts: 0, externalStylesheets: 0, remoteImages: 0 };
    report.pages.push(page);
    metric(report, 'maxHtmlBytes', page.bytes);
    if (page.bytes > report.budgets.maxHtmlBytes) addError(route, `HTML is ${page.bytes} bytes; budget is ${report.budgets.maxHtmlBytes}.`);

    const titles = [...html.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((match) => visibleText(match[1]));
    const descriptions = [...html.matchAll(/<meta\b[^>]*>/gi)].filter((match) => attributes(match[0]).get('name') === 'description').map((match) => attributes(match[0]).get('content') || '');
    const robotsTag = [...html.matchAll(/<meta\b[^>]*>/gi)].find((match) => attributes(match[0]).get('name') === 'robots');
    const robots = attributes(robotsTag?.[0] || '').get('content') || '';
    const noindex = /\bnoindex\b/i.test(robots);
    const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].find((match) => (attributes(match[0]).get('rel') || '').split(/\s+/).includes('canonical'));
    const canonical = attributes(canonicalTag?.[0] || '').get('href');
    if (titles.length !== 1 || !titles[0]) addError(route, 'Exactly one non-empty title is required.');
    if (descriptions.length !== 1 || !descriptions[0]) addError(route, 'Exactly one non-empty meta description is required.');
    if (!canonical?.startsWith(`${SITE}/`)) addError(route, 'Canonical must be an absolute FlowHome URL.');
    if (!special404 && !noindex && canonical && (new URL(canonical).search || new URL(canonical).hash || normalizedPath(canonical) !== route)) addError(route, `Indexable canonical drifts from rendered route: ${canonical}.`);
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
    if (h1s.length !== 1) addError(route, `Expected one H1, found ${h1s.length}.`);
    if (special404 && !noindex) addError(route, '404 output must be noindex.');
    if (UTILITY_ROUTES.has(route) && (!noindex || !/\bnofollow\b/i.test(robots))) addError(route, 'Utility route must be noindex, nofollow.');
    if (!noindex && !special404) {
      indexableRoutes.add(route);
      if (titleRoutes.has(titles[0])) addError(route, `Duplicate indexable title with ${titleRoutes.get(titles[0])}.`); else titleRoutes.set(titles[0], route);
      if (descriptionRoutes.has(descriptions[0])) addError(route, `Duplicate indexable description with ${descriptionRoutes.get(descriptions[0])}.`); else descriptionRoutes.set(descriptions[0], route);
      if (canonicalRoutes.has(canonical)) addError(route, `Duplicate indexable canonical with ${canonicalRoutes.get(canonical)}.`); else canonicalRoutes.set(canonical, route);
    }

    const inlineBytes = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].reduce((total, match) => total + Buffer.byteLength(match[1]), 0);
    metric(report, 'maxInlineScriptBytes', inlineBytes);
    if (inlineBytes > report.budgets.maxInlineScriptBytes) addError(route, `Inline JavaScript is ${inlineBytes} bytes; budget is ${report.budgets.maxInlineScriptBytes}.`);
    const assets = new Set();
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*>/gi)) {
      const attrs = attributes(match[0]); const href = attrs.get('src') || attrs.get('href') || ''; const rel = attrs.get('rel') || '';
      const script = /^<script/i.test(match[0]); const stylesheet = rel.split(/\s+/).includes('stylesheet');
      if (!script && !stylesheet && !rel.split(/\s+/).includes('modulepreload')) continue;
      if (external(href)) { if (script) page.externalScripts += 1; if (stylesheet) page.externalStylesheets += 1; continue; }
      if (href.startsWith('/')) assets.add(new URL(href, SITE).pathname);
    }
    for (const asset of assets) {
      const assetFile = allFiles.find((candidate) => targetForFile(candidate) === asset);
      if (assetFile) page.firstPartyCssJsBytes += (await stat(assetFile)).size;
    }
    metric(report, 'maxFirstPartyCssJsBytes', page.firstPartyCssJsBytes);
    if (page.firstPartyCssJsBytes > report.budgets.maxFirstPartyCssJsBytes) addError(route, `First-party CSS/JS is ${page.firstPartyCssJsBytes} bytes; budget is ${report.budgets.maxFirstPartyCssJsBytes}.`);
    if (page.externalScripts) addError(route, `External scripts are ${page.externalScripts}; budget is 0.`);
    if (page.externalStylesheets) addError(route, `External stylesheets are ${page.externalStylesheets}; budget is 0.`);

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      page.images += 1; const attrs = attributes(match[0]); const src = attrs.get('src') || '';
      if (!attrs.has('alt')) addError(route, 'Image lacks alt attribute.');
      if (!attrs.get('width') || !attrs.get('height')) addError(route, 'Image lacks explicit width and height.');
      if (external(src)) page.remoteImages += 1;
      if (isActionableImage(attrs) && !attrs.get('loading')) addWarning(route, 'Non-critical content image lacks an explicit loading contract.');
      if (isActionableImage(attrs) && !attrs.get('decoding')) addWarning(route, 'Non-critical content image lacks an explicit decoding contract.');
    }
    metric(report, 'maxRemoteImages', page.remoteImages);
    if (page.remoteImages > report.budgets.maxRemoteImages) addError(route, `Remote images are ${page.remoteImages}; budget is ${report.budgets.maxRemoteImages}.`);

    for (const match of html.matchAll(/<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')/gi)) {
      const href = match[1] ?? match[2] ?? ''; if (!isInternalHref(href)) continue;
      page.links += 1; const target = assertKnownTarget(route, href);
      if (target && incoming.has(target)) incoming.set(target, (incoming.get(target) || 0) + 1);
      if (new URL(href, SITE).search && !isPermittedUtilityQuery(noindex, target)) addError(route, `Crawl-trap query link is not permitted: ${href}.`);
    }
    for (const match of html.matchAll(/<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { const schema = JSON.parse(match[1]); page.schemas.push(schema['@type'] ?? 'unknown'); validateSchema(route, schema, text); } catch (error) { addError(route, `Invalid JSON-LD: ${error.message}`); }
    }
  }

  for (const route of indexableRoutes) if (route !== '/' && (incoming.get(route) || 0) === 0) addError(route, 'Indexable sitemap route has no discovered internal inbound link.');

  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
  for (const route of UTILITY_ROUTES) if (!new RegExp(`^Disallow: ${route.replaceAll('/', '\\/')}$`, 'm').test(robots)) addError(route, 'robots.txt must disallow this utility route.');
  const sitemapIndex = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8');
  const sitemapFiles = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname.replace(/^\//, ''));
  const sitemapRoutes = new Set();
  for (const sitemapFile of sitemapFiles) {
    const xml = await readFile(join(DIST, sitemapFile), 'utf8');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapRoutes.add(normalizedPath(match[1]));
  }
  for (const route of indexableRoutes) if (!sitemapRoutes.has(route)) addError(route, 'Indexable canonical route is missing from sitemap.');
  for (const route of sitemapRoutes) if (!indexableRoutes.has(route)) addError(route, 'Sitemap contains a noindex, 404, verification, or unknown route.');

  try {
    const redirects = parseRedirects(await readFile(join(ROOT, 'public', '_redirects'), 'utf8'));
    report.redirects = redirects;
    for (const redirect of redirects) {
      if (![301, 302].includes(redirect.status)) addError('/_redirects', `Redirect ${redirect.from} must use 301 or 302.`);
      const destination = new URL(redirect.to.replace(':splat', 'example'), SITE);
      if (destination.origin === SITE && !redirect.to.includes(':splat') && !pagesByRoute.has(normalizedPath(destination.href))) addError('/_redirects', `Redirect destination is not a built route: ${redirect.to}.`);
    }
  } catch (error) { addError('/_redirects', error.message); }

  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`SEO audit report: ${output}`);
  console.log(`SEO audit summary: ${report.pages.length} content pages, ${report.errors.length} error(s), ${report.warnings.length} warning(s)`);
  if (report.errors.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
