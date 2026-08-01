import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProducts, readDeals } from '../lib/content-utils.mjs';

export const REQUIRED_REL = 'nofollow sponsored noopener noreferrer';
const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const AMAZON_HOSTS = new Set(['amazon.com', 'www.amazon.com']);
const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;
const KNOWN_DYNAMIC_HREF_PATTERN = /\b(?:affiliateUrl|amazonUrl|buildAmazonCartUrl|data-cart-page-buy)\b/;

function issue(path, reason, status = 'broken') { return { path, reason, status }; }

export function validateCommercialLink(value, path = 'unknown') {
  let url;
  try { url = new URL(value); } catch { return [issue(path, 'URL cannot be parsed')]; }
  const problems = [];
  if (url.protocol !== 'https:') problems.push(issue(path, 'URL must use HTTPS'));
  if (!AMAZON_HOSTS.has(url.hostname.toLowerCase())) problems.push(issue(path, `Amazon host is not allowed: ${url.hostname}`));
  if (url.username || url.password) problems.push(issue(path, 'URL must not include username or password credentials'));
  if (url.port) problems.push(issue(path, 'URL must not include a non-default port'));
  if (url.hash) problems.push(issue(path, 'URL must not include a fragment'));
  const isProduct = /^\/dp\/[A-Z0-9]{10}\/?$/.test(url.pathname);
  const isCart = url.pathname === '/gp/aws/cart/add.html';
  if (!isProduct && !isCart) problems.push(issue(path, 'Destination must be /dp/{ASIN} or /gp/aws/cart/add.html'));
  const entries = [...url.searchParams.entries()];
  if (isProduct && (entries.length !== 1 || entries[0][0] !== 'tag' || entries[0][1] !== 'flowhome-20')) {
    problems.push(issue(path, 'Product URL permits only tag=flowhome-20'));
  }
  if (isCart) {
    const asins = new Map();
    const quantities = new Map();
    let tags = 0;
    for (const [key, parameter] of entries) {
      if (key === 'AssociateTag' && parameter === 'flowhome-20') { tags += 1; continue; }
      const asin = /^ASIN\.([1-9]\d*)$/.exec(key);
      if (asin && ASIN_PATTERN.test(parameter) && !asins.has(asin[1])) { asins.set(asin[1], parameter); continue; }
      const quantity = /^Quantity\.([1-9]\d*)$/.exec(key);
      if (quantity && POSITIVE_INTEGER_PATTERN.test(parameter) && !quantities.has(quantity[1])) { quantities.set(quantity[1], parameter); continue; }
      problems.push(issue(path, `Cart URL has a forbidden or malformed parameter: ${key}`));
    }
    if (tags !== 1) problems.push(issue(path, 'Cart URL must include exactly one AssociateTag=flowhome-20'));
    if (!asins.size || asins.size !== quantities.size || [...asins.keys()].some((index) => !quantities.has(index))) {
      problems.push(issue(path, 'Cart URL must include paired ASIN.N and Quantity.N entries'));
    }
  }
  return problems;
}

export function validateCtaContract(cta, path = 'unknown') {
  const problems = [];
  if (cta.target !== '_blank') problems.push(issue(path, 'CTA target must be _blank'));
  if (cta.rel !== REQUIRED_REL) problems.push(issue(path, `CTA rel must exactly be ${REQUIRED_REL}`));
  if (!cta.amazonCta) problems.push(issue(path, 'CTA is missing data-fh-amazon-cta'));
  if (!cta.placement || !/^[a-z0-9_]{2,80}$/i.test(cta.placement)) problems.push(issue(path, 'CTA needs a safe data-cta-position'));
  if (cta.elementType !== 'a') problems.push(issue(path, 'Retailer CTA must be a direct anchor, not a button'));
  if (cta.hrefKind === 'literal' && typeof cta.href === 'string' && cta.href) problems.push(...validateCommercialLink(cta.href, path));
  else if (cta.hrefKind !== 'dynamic' || typeof cta.href !== 'string' || !KNOWN_DYNAMIC_HREF_PATTERN.test(cta.href)) problems.push(issue(path, 'CTA href is missing or not a recognized affiliate/cart expression'));
  return problems;
}

export function linkHealth(metadata, now = new Date()) {
  const checked = metadata.priceLastChecked || metadata.ratingLastChecked || metadata.lastChecked || metadata.updatedAt;
  if (!checked) return { status: 'unknown', reason: 'No local freshness date is recorded' };
  const date = new Date(checked);
  if (Number.isNaN(date.getTime())) return { status: 'unknown', reason: `Freshness date cannot be parsed: ${checked}` };
  const ageDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  return ageDays > 90 ? { status: 'stale', reason: `Local freshness date is ${ageDays} days old` } : { status: 'valid', reason: 'Local metadata is current' };
}

export function scanSourceCtas(source, path = 'source:unknown') {
  const candidate = /\bdata-fh-amazon-cta\b|amazon\.com|\b(?:affiliateUrl|amazonUrl|AssociateTag|data-cart-page-buy)\b|\bASIN\.\d+\b/i;
  const knownDynamic = /\b(?:affiliateUrl|amazonUrl|buildAmazonCartUrl)\b/;
  return [...source.matchAll(/<(a|button)\b[^>]*>/gi)].filter((match) => candidate.test(match[0])).map((match) => {
    const opening = match[0];
    const attribute = (name) => opening.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || '';
    const literalHref = opening.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const expressionHref = opening.match(/\bhref\s*=\s*\{([^}]+)\}/i)?.[1]?.trim() || '';
    const dynamicHref = expressionHref || (literalHref.includes('${') ? literalHref : '');
    const hrefKind = literalHref && !dynamicHref
      ? 'literal'
      : knownDynamic.test(dynamicHref)
        ? 'dynamic'
        : /\bdata-cart-page-buy\b/.test(opening)
          ? 'dynamic'
          : dynamicHref
            ? 'unknown'
            : 'missing';
    const href = literalHref || expressionHref || (hrefKind === 'dynamic' ? 'data-cart-page-buy' : '');
    return { path, elementType: match[1].toLowerCase(), href, hrefKind, target: attribute('target'), rel: attribute('rel'), placement: attribute('data-cta-position'), amazonCta: /\bdata-fh-amazon-cta\b/.test(opening) };
  });
}

async function collectAstroFiles(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) await collectAstroFiles(entryPath, files);
    else if (entry.isFile() && entry.name.endsWith('.astro')) files.push(entryPath);
  }
  return files;
}

export async function collectSourceCtas(sourceRoot = resolve(PROJECT_ROOT, 'src')) {
  const files = await collectAstroFiles(sourceRoot);
  const ctas = await Promise.all(files.map(async (file) => scanSourceCtas(await readFile(file, 'utf8'), relative(PROJECT_ROOT, file))));
  return ctas.flat();
}

export function checkCommercialLinks({ items = [], ctas = [], now = new Date() } = {}) {
  const findings = [];
  for (const item of items) {
    const path = `catalog:${item.slug || 'unknown'}`;
    const broken = validateCommercialLink(item.affiliateUrl, path);
    if (broken.length) findings.push(...broken);
    else findings.push({ path, ...linkHealth(item, now) });
  }
  for (const cta of ctas) findings.push(...validateCtaContract(cta, cta.path));
  return { findings, broken: findings.filter((finding) => finding.status === 'broken'), stale: findings.filter((finding) => finding.status === 'stale') };
}

async function main() {
  const reportPath = process.env.LINK_CHECK_REPORT_PATH ? resolve(process.env.LINK_CHECK_REPORT_PATH) : '';
  const ctas = await collectSourceCtas();
  const report = checkCommercialLinks({ items: [...readProducts(), ...readDeals()], ctas });
  if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  for (const finding of report.stale) console.warn(`STALE ${finding.path}: ${finding.reason}`);
  if (report.broken.length) {
    console.error(JSON.stringify(report.broken, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(`Affiliate link check passed (${report.stale.length} stale, ${report.findings.filter((finding) => finding.status === 'unknown').length} unknown).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
