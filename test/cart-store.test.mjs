import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CART_STORAGE_KEY,
  buildAmazonCartUrl,
  createCartStore,
  normalizeCartItems,
  parseCartPayload,
} from '../src/lib/cart-store.js';
import { serializeJsonLd } from '../src/lib/json-ld.js';

const ASIN = 'B012345678';
const OTHER_ASIN = 'B087654321';

function createStorage(initialValue = null) {
  let value = initialValue;
  let writes = 0;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { writes += 1; value = nextValue; },
    value: () => value,
    setExternalValue: (nextValue) => { value = nextValue; },
    writes: () => writes,
  };
}

function createEventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) {
      const callbacks = listeners.get(type) || new Set();
      callbacks.add(listener);
      listeners.set(type, callbacks);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent(event) {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  };
}

test('migrates legacy arrays and safely handles corrupt storage', () => {
  const legacy = JSON.stringify([{ asin: ASIN.toLowerCase(), quantity: 2, name: ' Legacy product ' }]);
  const storage = createStorage(legacy);
  const store = createCartStore({ storage });
  assert.deepEqual(store.initialize(), [{ asin: ASIN, quantity: 2, slug: '', name: 'Legacy product', price: 0, image: '', url: '' }]);
  assert.match(storage.value(), /"version":1/);
  assert.deepEqual(parseCartPayload('{broken').items, []);
});

test('repairs corrupt and structurally invalid payloads once without emitting a cart event', () => {
  const target = createEventTarget();
  const storage = createStorage('{broken');
  const store = createCartStore({ storage, eventTarget: target });
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });

  assert.deepEqual(store.initialize(), []);
  assert.equal(storage.value(), '{"version":1,"items":[]}');
  assert.equal(storage.writes(), 1);
  assert.equal(notifications, 0);
  store.getItems();
  assert.equal(storage.writes(), 1);

  storage.setExternalValue(JSON.stringify({ version: 1, items: 'not-an-array' }));
  const invalidStructureStore = createCartStore({ storage });
  assert.deepEqual(invalidStructureStore.initialize(), []);
  assert.equal(storage.value(), '{"version":1,"items":[]}');
});

test('repairs normalized fields, duplicates, and discarded items in a versioned payload once', () => {
  const target = createEventTarget();
  const storage = createStorage(JSON.stringify({
    version: 1,
    items: [
      { asin: ASIN.toLowerCase(), quantity: -1.5, price: -5, name: ' Product ' },
      { asin: ASIN, quantity: 2.8, price: 19 },
      { asin: 'not-an-asin', quantity: 4, price: 10 },
    ],
  }));
  const store = createCartStore({ storage, eventTarget: target });
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });

  assert.deepEqual(store.initialize(), [{ asin: ASIN, quantity: 3, slug: '', name: 'Product', price: 0, image: '', url: '' }]);
  assert.equal(storage.value(), JSON.stringify({
    version: 1,
    items: [{ asin: ASIN, quantity: 3, slug: '', name: 'Product', price: 0, image: '', url: '' }],
  }));
  assert.equal(storage.writes(), 1);
  assert.equal(notifications, 0);
  store.getItems();
  assert.equal(storage.writes(), 1);
});

test('normalizes invalid quantities, prices, text, URLs, and ASINs', () => {
  assert.deepEqual(normalizeCartItems([
    { asin: ASIN, quantity: Number.NaN, price: -3, name: 'Name\u0000', url: 'javascript:alert(1)' },
    { asin: OTHER_ASIN, quantity: -4, price: Number.POSITIVE_INFINITY, image: 'https://example.com/a.png' },
    { asin: 'not-an-asin', quantity: 4 },
  ]), [
    { asin: ASIN, quantity: 1, slug: '', name: 'Name', price: 0, image: '', url: '' },
    { asin: OTHER_ASIN, quantity: 1, slug: '', name: OTHER_ASIN, price: 0, image: 'https://example.com/a.png', url: '' },
  ]);
});

test('adds repeated items, increments, decrements, removes, and clears', () => {
  const store = createCartStore({ storage: createStorage() });
  store.add({ asin: ASIN, quantity: 1, name: 'One', price: 20 });
  store.add({ asin: ASIN, quantity: 1, name: 'One', price: 20 });
  assert.equal(store.getItems()[0].quantity, 2);
  store.increment(ASIN);
  assert.equal(store.getItems()[0].quantity, 3);
  store.decrement(ASIN);
  assert.equal(store.getItems()[0].quantity, 2);
  store.decrement(ASIN);
  assert.equal(store.getItems()[0].quantity, 1);
  store.decrement(ASIN);
  assert.deepEqual(store.getItems(), []);
  store.add({ asin: ASIN });
  store.add({ asin: OTHER_ASIN });
  store.remove(ASIN);
  assert.deepEqual(store.getItems().map((item) => item.asin), [OTHER_ASIN]);
  store.clear();
  assert.deepEqual(store.getItems(), []);
});

test('notifies same-tab subscribers after cart mutations', () => {
  const target = createEventTarget();
  const store = createCartStore({ storage: createStorage(), eventTarget: target });
  const notifications = [];
  const unsubscribe = store.subscribe((items) => notifications.push(items));

  store.add({ asin: ASIN });
  assert.deepEqual(notifications.map((items) => items.map((item) => item.asin)), [[ASIN]]);
  unsubscribe();
  store.clear();
  assert.equal(notifications.length, 1);
});

test('notifies subscribers when the storage adapter reports a cross-tab cart change', () => {
  const target = createEventTarget();
  const storage = createStorage('{"version":1,"items":[]}');
  const store = createCartStore({ storage, eventTarget: target });
  const notifications = [];
  store.subscribe((items) => notifications.push(items));

  storage.setExternalValue(JSON.stringify({ version: 1, items: [{ asin: ASIN, quantity: 2 }] }));
  target.dispatchEvent({ type: 'storage', key: CART_STORAGE_KEY, storageArea: storage });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0][0].asin, ASIN);
  assert.equal(notifications[0][0].quantity, 2);
});

test('keeps an in-memory cart when storage reads or writes are blocked', () => {
  const readBlockedStorage = {
    getItem: () => { throw new Error('read blocked'); },
    setItem: () => { throw new Error('write blocked'); },
  };
  const writeBlockedStorage = {
    getItem: () => null,
    setItem: () => { throw new Error('write blocked'); },
  };

  const readBlockedStore = createCartStore({ storage: readBlockedStorage });
  assert.deepEqual(readBlockedStore.add({ asin: ASIN }), [{ asin: ASIN, quantity: 1, slug: '', name: ASIN, price: 0, image: '', url: '' }]);
  assert.equal(readBlockedStore.getItems()[0].asin, ASIN);

  const writeBlockedStore = createCartStore({ storage: writeBlockedStorage });
  writeBlockedStore.add({ asin: OTHER_ASIN });
  assert.equal(writeBlockedStore.getItems()[0].asin, OTHER_ASIN);
});

test('builds a single valid Amazon cart URL only for a non-empty cart', () => {
  assert.equal(buildAmazonCartUrl([]), null);
  const url = new URL(buildAmazonCartUrl([{ asin: ASIN, quantity: 2 }, { asin: OTHER_ASIN, quantity: 1 }]));
  assert.equal(url.origin, 'https://www.amazon.com');
  assert.equal(url.searchParams.get('AssociateTag'), 'flowhome-20');
  assert.equal(url.searchParams.get('ASIN.1'), ASIN);
  assert.equal(url.searchParams.get('Quantity.1'), '2');
  assert.equal(url.searchParams.get('ASIN.2'), OTHER_ASIN);
});

test('serializes JSON-LD without executable script delimiters', () => {
  const output = serializeJsonLd({ value: '</script><script>alert(1)</script>&\u2028\u2029' });
  assert.equal(output.includes('</script>'), false);
  assert.match(output, /\\u003c\/script\\u003e/);
  assert.match(output, /\\u0026/);
  assert.match(output, /\\u2028/);
  assert.match(output, /\\u2029/);
});

test('uses the declared cart storage key', () => {
  assert.equal(CART_STORAGE_KEY, 'flowhome-amazon-list');
});
