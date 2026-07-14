import assert from 'node:assert/strict';
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

  for (const [index, source] of sources.entries()) {
    assert.doesNotMatch(source, /<script\b[^>]*\bis:inline\b/i, `${files[index]} has an inline script`);
    assert.doesNotMatch(source, /\son[a-z]+\s*=/i, `${files[index]} has an inline event handler`);
  }
});
