import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createCartStore } from '../src/lib/cart-store.js';

async function loadCartSync() {
  const source = await readFile(new URL('../src/lib/cart-sync.ts', import.meta.url), 'utf8');
  return import(`data:text/javascript,${encodeURIComponent(source)}`);
}

function createTarget() {
  const listeners = new Map();
  return {
    navigator: { onLine: true },
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
    trigger(type) { listeners.get(type)?.(); },
  };
}

function createSupabase({ response = null, error = null } = {}) {
  let authCallback;
  const calls = [];
  return {
    calls,
    client: {
      rpc: async (name, args) => { calls.push([name, args]); return { data: response, error }; },
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange(callback) { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
      },
    },
    auth(session) { authCallback?.('SIGNED_IN', session); },
  };
}

function createPendingSupabase() {
  const requests = [];
  return {
    requests,
    client: {
      rpc: () => new Promise((resolve) => { requests.push(resolve); }),
      auth: {},
    },
    respond(data, index = 0) { requests[index]({ data, error: null }); },
  };
}

function createNamespacedStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

function remoteState() {
  return {
    version: 2,
    deviceId: 'device-remote',
    clock: 7,
    entries: [{ asin: 'B012345678', quantity: 1, slug: '', name: 'Remote', price: 0, image: '', url: '', clock: 7, deviceId: 'device-remote' }],
  };
}

test('uses the authenticated RPC and keeps local state when the RPC fails', async () => {
  const { createCartSync } = await loadCartSync();
  const store = createCartStore({ storage: null });
  store.add({ asin: 'B012345678' });
  const remote = createSupabase({ error: new Error('offline') });
  const sync = createCartSync({ store, supabase: remote.client, eventTarget: createTarget(), debounceMs: 60_000 }).start();
  sync.handleSession({ user: { id: 'user-1234' } });
  assert.equal(await sync.flush(), false);
  assert.equal(store.getItems()[0].asin, 'B012345678');
  assert.equal(remote.calls[0][0], 'sync_cart');
  sync.stop();
});

test('does not call the RPC for corrupt local state and retries on focus', async () => {
  const { createCartSync } = await loadCartSync();
  const storage = { getItem: () => '{broken', setItem() {} };
  const store = createCartStore({ storage });
  const target = createTarget();
  const remote = createSupabase();
  const sync = createCartSync({ store, supabase: remote.client, eventTarget: target, debounceMs: 60_000 }).start();
  sync.handleSession({ user: { id: 'user-1234' } });
  assert.equal(await sync.flush(), false);
  assert.equal(remote.calls.length, 0);
  target.trigger('focus');
  assert.equal(remote.calls.length, 0);
  sync.stop();
});

test('does not apply an old user response after sign-out while the RPC is pending', async () => {
  const { createCartSync } = await loadCartSync();
  const store = createCartStore({ storage: createNamespacedStorage() });
  const remote = createPendingSupabase();
  let applied = 0;
  const applyRemoteState = store.applyRemoteState.bind(store);
  store.applyRemoteState = (state) => { applied += 1; return applyRemoteState(state); };
  const sync = createCartSync({ store, supabase: remote.client, eventTarget: createTarget() });
  sync.handleSession({ user: { id: 'user-aaaa' } });
  const request = sync.flush();
  sync.handleSession(null);
  remote.respond(remoteState());
  await request;
  assert.equal(store.getNamespace(), 'anonymous');
  assert.equal(store.getItems().length, 0);
  assert.equal(applied, 0);
});

test('starts a fresh account sync after an account switch while discarding the old response', async () => {
  const { createCartSync } = await loadCartSync();
  const store = createCartStore({ storage: createNamespacedStorage() });
  const remote = createPendingSupabase();
  let applied = 0;
  const applyRemoteState = store.applyRemoteState.bind(store);
  store.applyRemoteState = (state) => { applied += 1; return applyRemoteState(state); };
  const sync = createCartSync({ store, supabase: remote.client, eventTarget: createTarget(), debounceMs: 60_000 });
  sync.handleSession({ user: { id: 'user-aaaa' } });
  const request = sync.flush();
  sync.handleSession({ user: { id: 'user-bbbb' } });
  remote.respond(remoteState());
  await request;
  assert.equal(remote.requests.length, 2);
  remote.respond(remoteState(), 1);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(store.getNamespace(), 'user:user-bbbb');
  assert.equal(store.getItems()[0].name, 'Remote');
  assert.equal(applied, 1);
});
