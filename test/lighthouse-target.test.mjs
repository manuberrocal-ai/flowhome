import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseLighthouseRoutes, verifyLighthouseTarget } from '../scripts/qa/lighthouse-mobile.mjs';

const base = 'http://127.0.0.1:4342';
const html = '<!doctype html><title>FlowHome — compiled</title>';
const fixture = {
  readBuiltPage: async () => Buffer.from(html),
  fetchPage: async () => new Response(html),
};

test('Lighthouse verifies every selected compiled HTML page and records its hash', async () => {
  const calls = [];
  const routes = parseLighthouseRoutes();
  const result = await verifyLighthouseTarget(base, routes, {
    ...fixture,
    fetchPage: async (url, options) => {
      calls.push(url);
      assert.equal(options.redirect, 'error');
      assert.ok(options.signal instanceof AbortSignal);
      return new Response(html);
    },
  });
  assert.deepEqual(calls, routes.map(route => base + route));
  assert.deepEqual(result, routes.map(route => ({ route, htmlSha256: createHash('sha256').update(html).digest('hex') })));
});

test('Lighthouse rejects dev injection, another build, and a mismatch beyond the home page', async () => {
  for (const wrongHtml of [html + '<script src="/@vite/client"></script>', html.replace('compiled', 'old build')]) {
    await assert.rejects(verifyLighthouseTarget(base, parseLighthouseRoutes(), {
      ...fixture,
      fetchPage: async url => new Response(url === base + '/' ? html : wrongHtml),
    }), /does not match dist HTML/);
  }
});

test('Lighthouse rejects HTTP errors, fetch failures and missing builds', async () => {
  for (const status of [301, 404, 500]) {
    await assert.rejects(verifyLighthouseTarget(base, ['/'], { ...fixture, fetchPage: async () => new Response(html, { status }) }), /returned HTTP/);
  }
  await assert.rejects(verifyLighthouseTarget(base, ['/'], { ...fixture, fetchPage: async () => { throw new Error('timeout'); } }), /timeout/);
  await assert.rejects(verifyLighthouseTarget(base, ['/'], { ...fixture, readBuiltPage: async () => { throw new Error('ENOENT'); } }), /ENOENT/);
});

test('Lighthouse target validation refuses external origins, credentials and unknown routes before fetch', async () => {
  let called = false;
  const options = { ...fixture, fetchPage: async () => { called = true; return new Response(html); } };
  for (const target of ['https://example.com', 'http://user:password@localhost', base + '/other', base + '?x=1']) {
    await assert.rejects(verifyLighthouseTarget(target, ['/'], options), /loopback HTTP origin/);
  }
  await assert.rejects(verifyLighthouseTarget(base, ['/../private'], options), /unique routes/);
  assert.equal(called, false);
});

test('Lighthouse runs target verification before collecting any samples', async () => {
  const source = await readFile(new URL('../scripts/qa/lighthouse-mobile.mjs', import.meta.url), 'utf8');
  assert.match(source, /summary\.targetVerification = await verifyLighthouseTarget\(BASE_URL, requestedRoutes\);\s+for \(const route of requestedRoutes\)/);
});
