import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CART_STORAGE_KEY,
  CART_STORAGE_VERSION,
  buildAmazonCartUrl,
  chooseCartEntry,
  createCartStore,
  mergeCartStates,
  normalizeCartItems,
  parseCartPayload,
} from '../src/lib/cart-store.js';
import { serializeJsonLd } from '../src/lib/json-ld.js';

const ASIN = 'B012345678';
const OTHER_ASIN = 'B087654321';

function createStorage(initialValue = null) {
  const values = new Map([[CART_STORAGE_KEY, initialValue]]);
  let writes = 0;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { writes += 1; values.set(key, value); },
    value: (key = CART_STORAGE_KEY) => values.get(key) ?? null,
    setExternalValue: (value, key = CART_STORAGE_KEY) => values.set(key, value),
    writes: () => writes,
  };
}

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) { const callbacks = listeners.get(type) || new Set(); callbacks.add(listener); listeners.set(type, callbacks); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    dispatchEvent(event) { listeners.get(event.type)?.forEach((listener) => listener(event)); return true; },
  };
}

test('migrates v1 arrays to a v2 per-ASIN state', () => {
  const storage = createStorage(JSON.stringify([{ asin: ASIN.toLowerCase(), quantity: 2, name: ' Legacy product ' }]));
  const store = createCartStore({ storage });
  assert.deepEqual(store.initialize(), [{ asin: ASIN, quantity: 2, slug: '', name: 'Legacy product', price: 0, image: '', url: '' }]);
  const payload = JSON.parse(storage.value());
  assert.equal(payload.version, CART_STORAGE_VERSION);
  assert.equal(payload.entries[0].clock, 1);
  assert.match(payload.entries[0].deviceId, /^[A-Za-z0-9_-]{8,128}$/);
});

test('preserves corrupt JSON and never exposes it for synchronization', () => {
  const storage = createStorage('{broken');
  const store = createCartStore({ storage });
  assert.deepEqual(store.initialize(), []);
  assert.equal(store.getRecoveryState().hasCorruptSavedList, true);
  assert.equal(store.getSyncPayload(), null);
  assert.equal(storage.value(), '{broken');
  assert.deepEqual(parseCartPayload('{broken').hasCorruptSavedList, true);
  assert.equal(store.resetCorruptSavedList(), true);
  assert.equal(store.getRecoveryState().hasCorruptSavedList, false);
});

test('uses deterministic clock and device ID conflict winners', () => {
  const low = { asin: ASIN, quantity: 1, clock: 4, deviceId: 'device-aaa', name: 'Low' };
  const highClock = { ...low, quantity: 2, clock: 5, deviceId: 'device-aaa' };
  const highDevice = { ...low, quantity: 3, deviceId: 'device-zzz' };
  assert.equal(chooseCartEntry(low, highClock).quantity, 2);
  assert.equal(chooseCartEntry(low, highDevice).quantity, 3);
  const merged = mergeCartStates({ version: 2, deviceId: 'device-local', clock: 4, entries: [low] }, { version: 2, deviceId: 'device-remote', clock: 4, entries: [highDevice] });
  assert.equal(merged.entries[0].quantity, 3);
});

test('keeps zero-quantity tombstones out of the UI while retaining sync state', () => {
  const store = createCartStore({ storage: createStorage() });
  store.add({ asin: ASIN });
  store.decrement(ASIN);
  assert.deepEqual(store.getItems(), []);
  assert.equal(store.getSyncPayload().entries[0].quantity, 0);
  store.add({ asin: ASIN, quantity: 2 });
  assert.equal(store.getItems()[0].quantity, 2);
});

test('keeps anonymous and authenticated namespaces separate and merges once', () => {
  const storage = createStorage();
  const store = createCartStore({ storage });
  store.add({ asin: ASIN });
  store.setAuthenticatedUser('user-1234');
  assert.deepEqual(store.getItems().map((item) => item.asin), [ASIN]);
  store.add({ asin: OTHER_ASIN });
  store.setAnonymousNamespace();
  assert.deepEqual(store.getItems().map((item) => item.asin), [ASIN]);
  store.setAuthenticatedUser('user-1234');
  assert.deepEqual(store.getItems().map((item) => item.asin).sort(), [ASIN, OTHER_ASIN]);
  assert.equal(storage.value(`${CART_STORAGE_KEY}:merged:user-1234`), '1');
});

test('normalizes invalid values and retains existing cart interactions', () => {
  assert.deepEqual(normalizeCartItems([{ asin: ASIN, quantity: Number.NaN, price: -3, name: 'Name\u0000', url: 'javascript:alert(1)' }]), [{ asin: ASIN, quantity: 1, slug: '', name: 'Name', price: 0, image: '', url: '' }]);
  const target = createEventTarget();
  const store = createCartStore({ storage: createStorage(), eventTarget: target });
  const notifications = [];
  store.subscribe((items) => notifications.push(items));
  store.add({ asin: ASIN });
  store.increment(ASIN);
  store.remove(ASIN);
  assert.equal(store.getItems().length, 0);
  assert.equal(notifications.length, 3);
});

test('keeps an in-memory cart when storage is unavailable', () => {
  const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  const store = createCartStore({ storage });
  assert.equal(store.add({ asin: ASIN })[0].asin, ASIN);
  assert.doesNotThrow(() => store.setAuthenticatedUser('user-1234'));
  assert.equal(store.getNamespace(), 'user:user-1234');
  assert.deepEqual(store.getItems().map((item) => item.asin), [ASIN]);
  store.add({ asin: OTHER_ASIN });
  store.setAnonymousNamespace();
  assert.deepEqual(store.getItems().map((item) => item.asin), [ASIN]);
  store.setAuthenticatedUser('user-1234');
  assert.deepEqual(store.getItems().map((item) => item.asin).sort(), [ASIN, OTHER_ASIN]);
});

test('builds an Amazon cart URL only for a non-empty cart', () => {
  assert.equal(buildAmazonCartUrl([]), null);
  const url = new URL(buildAmazonCartUrl([{ asin: ASIN, quantity: 2 }, { asin: OTHER_ASIN, quantity: 1 }]));
  assert.equal(url.searchParams.get('ASIN.1'), ASIN);
  assert.equal(url.searchParams.get('Quantity.1'), '2');
});

test('serializes JSON-LD without executable script delimiters', () => {
  const output = serializeJsonLd({ value: '</script><script>alert(1)</script>&\u2028\u2029' });
  assert.equal(output.includes('</script>'), false);
  assert.match(output, /\\u003c\/script\\u003e/);
});
