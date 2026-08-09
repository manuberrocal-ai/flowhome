import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test } from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = ['layouts', 'components', 'pages'];

async function readProjectFile(...segments) {
  return readFile(path.join(projectRoot, ...segments), 'utf8');
}

async function astroSources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return astroSources(entryPath);
    return entry.name.endsWith('.astro') ? [entryPath] : [];
  }));
  return files.flat();
}

function directive(csp, name) {
  return csp.match(new RegExp(`${name}\\s+[^;]+`))?.[0] || '';
}

test('CSP uses external processed scripts and preserves required script origins', async () => {
  const [headers, astroConfig] = await Promise.all([
    readProjectFile('public', '_headers'),
    readProjectFile('astro.config.mjs'),
  ]);
  const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] || '';
  const scriptSrc = directive(csp, 'script-src');

  assert.doesNotMatch(scriptSrc, /'unsafe-inline'/);
  assert.match(directive(csp, 'style-src'), /'unsafe-inline'/);
  for (const origin of [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://accounts.google.com',
    'https://translate.google.com',
    'https://translate.googleapis.com',
    'https://translate.googleusercontent.com',
    'https://*.clarity.ms',
    'https://scripts.clarity.ms',
  ]) {
    assert.ok(scriptSrc.includes(origin), `script-src must retain ${origin}`);
  }
  assert.match(astroConfig, /assetsInlineLimit:\s*0/);
});

test('Astro source has no executable inline scripts or event-handler attributes', async () => {
  const files = (await Promise.all(sourceRoots.map((root) => astroSources(path.join(projectRoot, 'src', root))))).flat();
  const sources = await Promise.all(files.map((file) => readFile(file, 'utf8')));
  const layoutPath = path.join(projectRoot, 'src', 'layouts', 'BaseLayout.astro');
  const layout = await readFile(layoutPath, 'utf8');
  const consentScript = layout.match(/const CONSENT_PREPAINT_SCRIPT = `([^`]*)`;/)?.[1];
  assert.ok(consentScript, 'BaseLayout must define the approved consent prepaint script constant');
  const expectedHash = `sha256-${createHash('sha256').update(consentScript).digest('base64')}`;
  const headers = await readProjectFile('public', '_headers');
  const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] || '';
  assert.ok(directive(csp, 'script-src').split(/\s+/).includes(`'${expectedHash}'`), 'CSP must contain the exact consent script hash');
  let approvedPrepaintScripts = 0;

  for (const [index, source] of sources.entries()) {
    for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const [, attributes, body] = match;
      if (!/\bis:inline\b/i.test(attributes)) continue;
      if (/\bset:html\s*=\s*\{CONSENT_PREPAINT_SCRIPT\}/i.test(attributes)) {
        assert.equal(files[index], layoutPath, 'only BaseLayout may render the approved prepaint script');
        assert.doesNotMatch(attributes, /\bsrc\s*=/i);
        assert.equal(body.trim(), '');
        approvedPrepaintScripts += 1;
        continue;
      }
      assert.doesNotMatch(attributes, /\bset:html\s*=/i, `${files[index]} has an unapproved set:html inline script`);
      const src = attributes.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
      assert.ok(src && /^\/(?!\/)/.test(src), `${files[index]} has is:inline without a same-origin src`);
      assert.equal(body.trim(), '', `${files[index]} has executable content in an is:inline script`);
    }
    assert.doesNotMatch(source, /\son[a-z]+\s*=/i, `${files[index]} has an inline event handler`);
  }
  assert.equal(approvedPrepaintScripts, 1, 'BaseLayout must render exactly one approved prepaint script');
});
