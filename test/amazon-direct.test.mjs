import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import test from 'node:test';

const srcRoot = new URL('../src/', import.meta.url);
const productRoot = new URL('../src/content/products/', import.meta.url);
const forbidden = /Sign in before continuing to Amazon|fhRequireAuth|data-fh-amazon-link|AuthGuardModal/;
const amazonUrl = /^https:\/\/(?:www\.)?amazon\.[a-z.]+\/.+/i;

async function astroFiles(directory = srcRoot) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
    if (entry.isDirectory()) files.push(...await astroFiles(path));
    else if (entry.isFile() && path.pathname.endsWith('.astro')) files.push(path);
  }
  return files;
}

test('removes the Amazon auth interceptor and obsolete markers from src', async () => {
  const files = await astroFiles();
  const contents = await Promise.all(files.map(async (file) => [file, await readFile(file, 'utf8')]));
  for (const [file, content] of contents) {
    assert.doesNotMatch(content, forbidden, relative(new URL('../', import.meta.url).pathname, file.pathname));
  }
});

test('keeps product Amazon links tagged and direct', async () => {
  const files = await astroFiles();
  const contents = await Promise.all(files.map(async (file) => readFile(file, 'utf8')));
  const links = contents.flatMap((content) => content.match(/<a\b[\s\S]*?data-fh-amazon-cta[\s\S]*?<\/a>/g) ?? []);
  assert.ok(links.length > 0);
  for (const link of links) {
    assert.match(link, /target="_blank"/, 'Amazon CTA must open directly in a new tab');
    assert.match(link, /rel="nofollow sponsored noopener noreferrer"/, 'Amazon CTA must carry affiliate and opener protections');
    assert.doesNotMatch(link, /preventDefault|onclick\s*=/i, 'Amazon CTA must not be intercepted');
    const urls = link.match(/https:\/\/[^\s"'<>]+/gi) ?? [];
    for (const url of urls) assert.match(url, amazonUrl, `invalid Amazon URL: ${url}`);
  }

  const productFiles = (await readdir(productRoot)).filter((name) => /\.ya?ml$/i.test(name));
  const productContents = await Promise.all(productFiles.map((name) => readFile(new URL(name, productRoot), 'utf8')));
  const sourceText = productContents.join('\n');
  const affiliateUrls = [...sourceText.matchAll(/affiliateUrl:\s*["']?(https:\/\/[^\s"'<>]+)/gi)].map((match) => match[1]);
  assert.ok(affiliateUrls.length > 0, 'missing product affiliate URLs');
  assert.ok(affiliateUrls.some((url) => /amazon\./i.test(url) && /flowhome-20/i.test(url)), 'missing flowhome-20 Amazon product URL');
  for (const url of affiliateUrls) {
    assert.match(url, amazonUrl, `invalid Amazon URL: ${url}`);
    assert.match(url, /flowhome-20/i, `missing affiliate tag: ${url}`);
  }
});
