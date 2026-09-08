import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompatibilityClient, bindCompatibilityLifecycle } from '../src/lib/blocks/block9/delivery-client.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';

const context = { slug: 'tapo-c120-security-camera', surface: 'product', market: 'US' };
const config = { endpoint: '/compatibility', pageUrl: 'https://flowhome.invalid/product/test/' };
const deps = { enabled: true, clock: () => new Date('2026-09-07T01:40:00Z'), readAuthorizedSnapshot: async () => ({ graph: documentaryCandidateProvider.getGraph(), authorizationExpiresAt: '2026-10-01T00:00:00Z' }) };
const fetchServer = (url, init) => serveCompatibilityRequest(new Request(url, init), deps);

test('server → fetch → validation → lease; later server denial clears prior success', async () => {
  let enabled = true;
  const client = createCompatibilityClient({ ...config, fetch: (url, init) => {
    assert.equal(init.credentials, 'omit'); assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error'); assert.equal(init.mode, 'same-origin');
    return serveCompatibilityRequest(new Request(url, init), { ...deps, enabled });
  } });
  try {
    assert.equal(await client.refresh(context), true); assert.equal(client.read().product.alexaCompatible, true);
    enabled = false; assert.equal(await client.refresh(context), false); assert.equal(client.read(), null);
  } finally { client.dispose(); }
});

test('rejects cross-origin, insecure remote, credentials and preconfigured queries', () => {
  for (const endpoint of ['https://other.invalid/data', 'https://user:pass@flowhome.invalid/data', '/data?approved=true', '/data#hash']) assert.throws(() => createCompatibilityClient({ ...config, endpoint }));
  assert.throws(() => createCompatibilityClient({ endpoint: '/data', pageUrl: 'http://example.com/' }));
  const local = createCompatibilityClient({ endpoint: '/data', pageUrl: 'http://127.0.0.1:8080/' }); local.dispose();
});

test('older unresolved request cannot override a newer result even if fetch ignores abort', async () => {
  let release; let calls = 0;
  const client = createCompatibilityClient({ ...config, fetch: async (url, init) => {
    if (++calls === 1) await new Promise(resolve => { release = resolve; });
    return fetchServer(url, { ...init, signal: undefined });
  } });
  try {
    const old = client.refresh(context); const current = client.refresh({ ...context, surface: 'quiz' });
    assert.equal(await old, false); assert.equal(await current, true); release();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(client.read().context.surface, 'quiz');
  } finally { release?.(); client.dispose(); }
});

test('status, missing no-store, MIME and oversized streamed bodies fail closed', async () => {
  for (const response of [
    new Response('{}', { status: 503 }),
    new Response('{}', { headers: { 'content-type': 'application/json' } }),
    new Response('{}', { headers: { 'content-type': 'text/html', 'cache-control': 'no-store' } }),
    new Response('x'.repeat(65_537), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } }),
  ]) {
    const client = createCompatibilityClient({ ...config, fetch: async () => response });
    try { assert.equal(await client.refresh(context), false); assert.equal(client.read(), null); } finally { client.dispose(); }
  }
});

test('body read is aborted on suspension, not just header acquisition', async () => {
  let cancelled = false;
  const response = new Response(new ReadableStream({ cancel() { cancelled = true; } }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  const client = createCompatibilityClient({ ...config, fetch: async () => response });
  try {
    const pending = client.refresh(context); await new Promise(resolve => setImmediate(resolve));
    client.setPermitted(false); assert.equal(await pending, false); assert.equal(cancelled, true); assert.equal(client.read(), null);
  } finally { client.dispose(); }
});

test('unresponsive transport returns unavailable at its deadline', async () => {
  let signal;
  const client = createCompatibilityClient({ ...config, fetch: async (_url, init) => { signal = init.signal; return new Promise(() => {}); } });
  try { assert.equal(await client.refresh(context), false); assert.equal(signal.aborted, true); } finally { client.dispose(); }
});

test('lifecycle binding handles hidden/offline/freeze/page cache and cleans up without auto-fetch', () => {
  const doc = new EventTarget(); doc.visibilityState = 'visible';
  const win = new EventTarget(); win.navigator = { onLine: true };
  const states = []; let disposed = false;
  const cleanup = bindCompatibilityLifecycle({ setPermitted: value => states.push(value), dispose: () => { disposed = true; } }, doc, win);
  assert.equal(states.at(-1), true);
  doc.visibilityState = 'hidden'; doc.dispatchEvent(new Event('visibilitychange')); assert.equal(states.at(-1), false);
  doc.visibilityState = 'visible'; doc.dispatchEvent(new Event('visibilitychange')); assert.equal(states.at(-1), true);
  win.dispatchEvent(new Event('pagehide')); assert.equal(states.at(-1), false);
  doc.dispatchEvent(new Event('visibilitychange')); assert.equal(states.at(-1), false);
  win.dispatchEvent(new Event('pageshow')); assert.equal(states.at(-1), true);
  win.navigator.onLine = false; win.dispatchEvent(new Event('offline')); assert.equal(states.at(-1), false);
  doc.dispatchEvent(new Event('freeze')); win.navigator.onLine = true; win.dispatchEvent(new Event('online')); assert.equal(states.at(-1), false);
  doc.dispatchEvent(new Event('resume')); assert.equal(states.at(-1), true);
  cleanup(); assert.equal(disposed, true); const count = states.length;
  doc.dispatchEvent(new Event('freeze')); win.dispatchEvent(new Event('offline')); assert.equal(states.length, count);
});
