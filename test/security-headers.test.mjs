import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readProjectFile(...segments) {
  return readFile(path.join(projectRoot, ...segments), 'utf8');
}

function directive(csp, name) {
  return csp.match(new RegExp(`${name}\\s+[^;]+`))?.[0] || '';
}

test('public headers include the required security hardening', async () => {
  const headers = await readProjectFile('public', '_headers');

  for (const header of [
    'Strict-Transport-Security:',
    'Content-Security-Policy:',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy:',
    'Permissions-Policy:',
    'X-Permitted-Cross-Domain-Policies: none',
    'Cross-Origin-Opener-Policy: same-origin-allow-popups',
  ]) {
    assert.match(headers, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('CSP permits the current integrations while keeping restrictive defaults', async () => {
  const headers = await readProjectFile('public', '_headers');
  const csp = headers.match(/Content-Security-Policy:\s*(.+)/)?.[1] || '';

  for (const expected of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self' https://www.amazon.com",
    'upgrade-insecure-requests',
  ]) {
    assert.match(csp, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(directive(csp, 'script-src'), /'unsafe-inline'/);
  assert.match(directive(csp, 'script-src'), /https:\/\/accounts\.google\.com/);
  assert.match(directive(csp, 'script-src'), /https:\/\/www\.googletagmanager\.com/);
  assert.match(directive(csp, 'style-src'), /https:\/\/fonts\.googleapis\.com/);
  assert.match(directive(csp, 'font-src'), /https:\/\/fonts\.gstatic\.com/);
  assert.match(directive(csp, 'connect-src'), /https:\/\/lbiuwknkrbyzrujarslh\.supabase\.co/);
});

for (const workflow of ['quality-check.yml', 'batched-deploy.yml']) {
  test(`${workflow} runs diff-check and tests before build`, async () => {
    const content = await readProjectFile('.github', 'workflows', workflow);
    const diffCheck = content.indexOf('run: npm run diff-check');
    const tests = content.indexOf('run: npm test');
    const build = content.indexOf('run: npm run build');

    assert.notEqual(diffCheck, -1);
    assert.notEqual(tests, -1);
    assert.notEqual(build, -1);
    assert.ok(diffCheck < build);
    assert.ok(tests < build);
  });
}

test('Supabase client only exposes public configuration and no service role key', async () => {
  const source = await readProjectFile('src', 'lib', 'supabase-client.ts');

  assert.match(source, /supabaseAnonKey/);
  assert.doesNotMatch(source, /service_role/);
});
