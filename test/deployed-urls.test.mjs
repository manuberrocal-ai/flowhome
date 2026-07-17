import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { collectDeployedUrls, decodeXml, readCurrentSitemapUrls, urlToHtmlPath, validateExplicitUrls, writeUrlsFile } from '../scripts/deploy/deployed-urls.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'flowhome-deployed-urls-'));
  const current = path.join(root, 'current');
  const previous = path.join(root, 'previous');
  await Promise.all([mkdir(current), mkdir(previous)]);
  return { root, current, previous };
}

async function page(dist, pathname, content) {
  const file = urlToHtmlPath(dist, `https://flowhome.dev${pathname}`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}

async function sitemap(dist, urls) {
  const entries = urls.map((url) => `<url><loc>${url}</loc></url>`).join('');
  await writeFile(path.join(dist, 'sitemap-0.xml'), `<urlset>${entries}</urlset>`);
}

test('collects only new or byte-changed current HTML pages and excludes deleted pages', async (t) => {
  const { root, current, previous } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const urls = ['https://flowhome.dev/', 'https://flowhome.dev/changed/', 'https://flowhome.dev/new/', 'https://flowhome.dev/unchanged/'];
  await Promise.all([sitemap(current, urls), sitemap(previous, [...urls, 'https://flowhome.dev/deleted/'])]);
  await Promise.all([
    page(current, '/', 'same'), page(previous, '/', 'same'),
    page(current, '/changed/', 'after'), page(previous, '/changed/', 'before'),
    page(current, '/new/', 'new'),
    page(current, '/unchanged/', 'same'), page(previous, '/unchanged/', 'same'),
    page(previous, '/deleted/', 'deleted'),
  ]);

  assert.deepEqual(collectDeployedUrls({ currentDist: current, previousDist: previous }), [
    'https://flowhome.dev/changed/',
    'https://flowhome.dev/new/',
  ]);
});

test('maps root and trailing-slash routes to directory HTML output', async (t) => {
  const { root, current } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(urlToHtmlPath(current, 'https://flowhome.dev/'), path.join(current, 'index.html'));
  assert.equal(urlToHtmlPath(current, 'https://flowhome.dev/guides/'), path.join(current, 'guides', 'index.html'));
  assert.equal(urlToHtmlPath(current, 'https://flowhome.dev/guides'), path.join(current, 'guides', 'index.html'));
});

test('reads XML-escaped canonical loc values and ignores sitemap-index entries', async (t) => {
  const { root, current } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(current, 'sitemap-index.xml'), '<sitemapindex><sitemap><loc>https://flowhome.dev/sitemap-0.xml</loc></sitemap></sitemapindex>');
  await writeFile(path.join(current, 'sitemap-0.xml'), '<urlset><url><loc>https://flowhome.dev/a?x=one&amp;y=two</loc></url></urlset>');
  assert.deepEqual(readCurrentSitemapUrls(current), ['https://flowhome.dev/a?x=one&y=two']);
});

test('decodes valid decimal and hexadecimal XML entities without decoding invalid code points', () => {
  assert.equal(decodeXml('&#65;&#x1F4A1;'), 'A💡');
  assert.equal(decodeXml('&#xD800; &#1114112;'), '&#xD800; &#1114112;');
});

test('excludes foreign and unsafe sitemap entries while retaining current canonical pages', async (t) => {
  const { root, current, previous } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await Promise.all([
    sitemap(current, ['https://flowhome.dev/valid/', 'https://example.com/foreign/', 'https://flowhome.dev/%2e%2e/escape/', 'https://flowhome.dev/%5Cescape/']),
    sitemap(previous, ['https://flowhome.dev/valid/']),
    page(current, '/valid/', 'current'),
    page(previous, '/valid/', 'previous'),
  ]);
  assert.deepEqual(readCurrentSitemapUrls(current), ['https://flowhome.dev/valid/']);
  assert.deepEqual(collectDeployedUrls({ currentDist: current, previousDist: previous }), ['https://flowhome.dev/valid/']);
});

test('rejects encoded separators and traversal without escaping the dist root', async (t) => {
  const { root, current } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const pathname of ['/%5Cescape/', '/%2Fescape/', '/%2e%2e/escape/', '/safe%252fescape/', '/%2e%2e%5Cescape/']) {
    assert.throws(() => urlToHtmlPath(current, `https://flowhome.dev${pathname}`), /Unsafe URL path|escapes dist directory/);
  }
  const safe = urlToHtmlPath(current, 'https://flowhome.dev/safe/path/');
  assert.ok(safe.startsWith(`${path.resolve(current)}${path.sep}`));
});

test('rejects missing, foreign, and absent explicit URLs while deduplicating valid URLs', () => {
  const sitemapUrls = ['https://flowhome.dev/a/', 'https://flowhome.dev/b/'];
  assert.throws(() => validateExplicitUrls('', sitemapUrls), /missing or empty/i);
  assert.throws(() => validateExplicitUrls('https://example.com/a/', sitemapUrls), /HTTPS flowhome\.dev/i);
  assert.throws(() => validateExplicitUrls('https://flowhome.dev/missing/', sitemapUrls), /current dist sitemap/i);
  assert.deepEqual(validateExplicitUrls('https://flowhome.dev/b/\nhttps://flowhome.dev/a/\nhttps://flowhome.dev/a/', sitemapUrls), sitemapUrls);
});

test('writes an explicit newline URL file', async (t) => {
  const { root } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = path.join(root, 'nested', 'urls.txt');
  writeUrlsFile(['https://flowhome.dev/a/'], output);
  assert.equal(await readFile(output, 'utf8'), 'https://flowhome.dev/a/\n');
});
