import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_ORIGIN = 'https://flowhome.dev';
export const ZERO_SHA = '0000000000000000000000000000000000000000';

function assertDirectory(directory, label) {
  if (!directory || !existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(`${label} directory is missing or invalid: ${directory || '(not provided)'}`);
  }
}

export function decodeXml(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    const lower = entity.toLowerCase();
    if (named[lower]) return named[lower];
    const codePoint = lower.startsWith('#x') ? Number.parseInt(lower.slice(2), 16) : Number.parseInt(lower.slice(1), 10);
    return isValidXmlCodePoint(codePoint) ? String.fromCodePoint(codePoint) : `&${entity};`;
  });
}

export function isValidXmlCodePoint(codePoint) {
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10FFFF && (codePoint < 0xD800 || codePoint > 0xDFFF);
}

export function normalizeFlowHomeUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid canonical URL: ${value}`);
  }

  if (url.protocol !== 'https:' || url.hostname !== 'flowhome.dev' || url.port || url.username || url.password) {
    throw new Error(`URL must be an HTTPS flowhome.dev URL: ${value}`);
  }
  if (url.hash) throw new Error(`Canonical URL must not include a fragment: ${value}`);
  return url.href;
}

export function readCurrentSitemapUrls(distDir) {
  assertDirectory(distDir, 'Current dist');
  const sitemapFiles = readdirSync(distDir).filter((file) => /^sitemap.*\.xml$/i.test(file)).sort();
  if (!sitemapFiles.length) throw new Error(`No sitemap XML files found in current dist directory: ${distDir}`);

  const urls = new Set();
  for (const file of sitemapFiles) {
    const xml = readFileSync(join(distDir, file), 'utf8');
    for (const entry of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)) {
      const match = entry[1].match(/<loc\b[^>]*>([\s\S]*?)<\/loc>/i);
      if (!match) continue;
      const value = decodeXml(match[1].trim());
      if (!value) continue;
      try {
        const url = normalizeFlowHomeUrl(value);
        urlToHtmlPath(distDir, value);
        urls.add(url);
      } catch {
        // Sitemap entries outside the canonical origin or unsafe output paths are not deployable pages.
      }
    }
  }
  if (!urls.size) throw new Error(`No canonical page URLs found in sitemap XML files in ${distDir}.`);
  return [...urls].sort();
}

export function urlToHtmlPath(distDir, canonicalUrl) {
  const url = new URL(normalizeFlowHomeUrl(canonicalUrl));
  const rawPathname = rawPathFromUrl(canonicalUrl);
  const segments = safePathSegments(rawPathname, canonicalUrl);
  const root = resolve(distDir);
  const output = resolve(root, ...(segments.length && segments.at(-1).endsWith('.html') ? segments : [...segments, 'index.html']));
  const outputRelative = relative(root, output);
  if (outputRelative === '..' || outputRelative.startsWith(`..${sep}`) || isAbsolute(outputRelative)) {
    throw new Error(`URL path escapes dist directory: ${canonicalUrl}`);
  }
  return output;
}

function rawPathFromUrl(value) {
  const authorityStart = value.indexOf('//');
  if (authorityStart === -1) return '/';
  const pathStart = value.slice(authorityStart + 2).search(/[/?#]/);
  if (pathStart === -1) return '/';
  const raw = value.slice(authorityStart + 2 + pathStart);
  return raw.startsWith('/') ? raw.split(/[?#]/, 1)[0] : '/';
}

function safePathSegments(rawPathname, canonicalUrl) {
  let decoded = rawPathname;
  for (let depth = 0; depth < 4; depth += 1) {
    if (/%(?:2f|5c)/i.test(decoded) || decoded.includes('\\') || decoded.includes('\0')) throw new Error(`Unsafe URL path: ${canonicalUrl}`);
    let next;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      throw new Error(`Invalid URL path encoding: ${canonicalUrl}`);
    }
    if (next === decoded) break;
    decoded = next;
  }
  if (decoded.includes('%') || decoded.includes('\\') || decoded.includes('\0')) throw new Error(`Unsafe URL path: ${canonicalUrl}`);
  const segments = decoded.split('/').filter(Boolean);
  if (segments.some((segment) => segment === '.' || segment === '..')) throw new Error(`Unsafe URL path: ${canonicalUrl}`);
  return segments;
}

export function collectDeployedUrls({ currentDist, previousDist }) {
  assertDirectory(currentDist, 'Current dist');
  assertDirectory(previousDist, 'Previous dist');

  const changed = [];
  for (const url of readCurrentSitemapUrls(currentDist)) {
    const currentPath = urlToHtmlPath(currentDist, url);
    if (!existsSync(currentPath) || !statSync(currentPath).isFile()) continue;
    const previousPath = urlToHtmlPath(previousDist, url);
    if (!existsSync(previousPath) || !readFileSync(currentPath).equals(readFileSync(previousPath))) changed.push(url);
  }
  return [...new Set(changed)].sort();
}

export function validateExplicitUrls(input, sitemapUrls) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Explicit URL list is missing or empty.');
  const sitemap = new Set(sitemapUrls);
  const selected = new Set();
  for (const line of input.split(/\r?\n/)) {
    const value = line.trim();
    if (!value) continue;
    const url = normalizeFlowHomeUrl(value);
    if (!sitemap.has(url)) throw new Error(`URL is not present in the current dist sitemap: ${url}`);
    selected.add(url);
  }
  if (!selected.size) throw new Error('Explicit URL list is missing or empty.');
  return [...selected].sort();
}

export function writeUrlsFile(urls, outputFile) {
  if (!outputFile) throw new Error('An output URL file is required.');
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, urls.length ? `${urls.join('\n')}\n` : '', 'utf8');
}

export function prepareDeploymentUrls({ eventName, beforeSha, currentDist, previousDist, manualInput = '' }) {
  if (eventName === 'push') {
    return beforeSha === ZERO_SHA ? [] : collectDeployedUrls({ currentDist, previousDist });
  }
  if (eventName === 'workflow_dispatch') {
    return manualInput.trim() ? validateExplicitUrls(manualInput, readCurrentSitemapUrls(currentDist)) : [];
  }
  return [];
}

export function shouldNotifyDeployment({ eventName, deployOutcome, hasUrls }) {
  return (eventName === 'push' || eventName === 'workflow_dispatch')
    && deployOutcome === 'success'
    && hasUrls === true;
}

export function appendGithubOutput(outputFile, name, value) {
  if (!outputFile) throw new Error('GITHUB_OUTPUT is required.');
  if (!['has_urls', 'notify'].includes(name) || typeof value !== 'boolean') {
    throw new Error('Only boolean has_urls or notify GitHub outputs are supported.');
  }
  appendFileSync(outputFile, `${name}=${value}\n`, 'utf8');
}

function option(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

export function main(args = process.argv.slice(2), env = process.env) {
  const currentDist = option(args, '--current-dist') || 'dist';
  const outputFile = option(args, '--output');
  const githubOutput = option(args, '--github-output') || env.GITHUB_OUTPUT;
  if (args.includes('--prepare')) {
    const urls = prepareDeploymentUrls({
      eventName: option(args, '--event-name') || env.GITHUB_EVENT_NAME,
      beforeSha: option(args, '--before-sha') || env.GITHUB_EVENT_BEFORE,
      currentDist,
      previousDist: option(args, '--previous-dist'),
      manualInput: env.DEPLOYED_URLS_MANUAL_INPUT || '',
    });
    writeUrlsFile(urls, outputFile);
    appendGithubOutput(githubOutput, 'has_urls', urls.length > 0);
    console.log(`Deployment notification URLs prepared: ${urls.length}`);
    return urls;
  }

  if (args.includes('--decide-notifications')) {
    const hasUrls = (option(args, '--has-urls') || env.DEPLOYMENT_HAS_URLS) === 'true';
    const notify = shouldNotifyDeployment({
      eventName: option(args, '--event-name') || env.GITHUB_EVENT_NAME,
      deployOutcome: option(args, '--deploy-outcome') || env.DEPLOYMENT_OUTCOME,
      hasUrls,
    });
    appendGithubOutput(githubOutput, 'notify', notify);
    console.log(`Deployment notifications enabled: ${notify}`);
    return notify;
  }

  if (args.includes('--manual-from-env')) {
    const input = env.DEPLOYED_URLS_MANUAL_INPUT || '';
    const urls = input.trim() ? validateExplicitUrls(input, readCurrentSitemapUrls(currentDist)) : [];
    writeUrlsFile(urls, outputFile);
    console.log(`Explicit notification URLs prepared: ${urls.length}`);
    return urls;
  }

  const previousDist = option(args, '--previous-dist');
  if (!previousDist) throw new Error('Previous dist directory is required when deriving a deployment URL delta.');
  const urls = collectDeployedUrls({ currentDist, previousDist });
  writeUrlsFile(urls, outputFile);
  console.log(`Deployment URL delta prepared: ${urls.length}`);
  return urls;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
