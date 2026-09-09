import assert from 'node:assert/strict';
import test from 'node:test';
import { bindTransientLifecycle } from '../src/lib/transient-lifecycle.ts';
import { bindCommerceLifecycle, createCommerceClient } from '../src/lib/blocks/block8/delivery-client.ts';
import { bindCompatibilityLifecycle } from '../src/lib/blocks/block9/delivery-client.ts';

function hosts() { const doc = new EventTarget(); doc.visibilityState = 'visible'; const win = new EventTarget(); win.navigator = { onLine: true }; return { doc, win }; }
const emit = (target, name) => target.dispatchEvent(new Event(name));

test('both clients share the same lifecycle controller', () => {
  assert.equal(bindCommerceLifecycle, bindTransientLifecycle); assert.equal(bindCompatibilityLifecycle, bindTransientLifecycle);
});

test('resume and pageshow clear only their own suspension cause in either event order', () => {
  for (const first of ['resume', 'pageshow']) {
    const { doc, win } = hosts(); const states = []; let disposed = 0;
    const cleanup = bindTransientLifecycle({ setPermitted: value => states.push(value), dispose: () => disposed++ }, doc, win);
    emit(doc, 'freeze'); emit(win, 'pagehide');
    emit(first === 'resume' ? doc : win, first); assert.equal(states.at(-1), false);
    emit(first === 'resume' ? win : doc, first === 'resume' ? 'pageshow' : 'resume'); assert.equal(states.at(-1), true);
    cleanup(); cleanup(); assert.equal(disposed, 1);
    const count = states.length; emit(doc, 'resume'); emit(win, 'online'); assert.equal(states.length, count);
  }
});

test('visibility and connectivity cannot override freeze or navigation suspension', () => {
  const { doc, win } = hosts(); const states = [];
  const cleanup = bindTransientLifecycle({ setPermitted: value => states.push(value), dispose() {} }, doc, win);
  try {
    emit(doc, 'freeze'); emit(win, 'online'); emit(doc, 'visibilitychange'); assert.equal(states.at(-1), false);
    emit(doc, 'resume'); win.navigator.onLine = false; emit(win, 'offline'); assert.equal(states.at(-1), false);
    doc.visibilityState = 'hidden'; win.navigator.onLine = true; emit(win, 'online'); assert.equal(states.at(-1), false);
    doc.visibilityState = 'visible'; emit(doc, 'visibilitychange'); assert.equal(states.at(-1), true);
  } finally { cleanup(); }
});

test('commerce state is discarded on pagehide and remains empty after pageshow until explicitly refreshed', async () => {
  const { doc, win } = hosts(); let requests = 0;
  const client = createCommerceClient({ endpoint: '/test-only', pageUrl: 'https://flowhome.dev/', fetch: async () => {
    requests++;
    return new Response(JSON.stringify({ status: 'available', asin: 'B0FIXTUR01', market: 'US', currency: 'USD', serverTime: '2026-07-30T12:00:00Z', validUntil: '2026-07-30T12:01:00Z', price: { value: 100, capturedAt: '2026-07-30T11:00:00Z', expiresAt: '2026-07-30T12:01:00Z' } }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } });
  const cleanup = bindCommerceLifecycle(client, doc, win);
  try {
    assert.equal(await client.refresh('B0FIXTUR01'), true); assert.equal(client.read().price.value, 100);
    emit(win, 'pagehide'); assert.equal(client.read(), null); assert.equal(await client.refresh('B0FIXTUR01'), false);
    emit(win, 'pageshow'); assert.equal(client.read(), null); assert.equal(requests, 1);
    assert.equal(await client.refresh('B0FIXTUR01'), true); assert.equal(requests, 2);
  } finally { cleanup(); }
});
