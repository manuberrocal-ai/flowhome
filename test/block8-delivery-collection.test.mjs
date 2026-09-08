import assert from 'node:assert/strict';
import test from 'node:test';
import { createCommerceCollection } from '../src/lib/blocks/block8/delivery-collection.ts';

const ids = Array.from({ length: 8 }, (_, i) => `B0FIXTUR0${i}`);
const options = { enabled: true, endpoint: '/commerce', pageUrl: 'https://flowhome.dev/' };
const response = (asin, value = 10) => Response.json({ status: 'available', asin, market: 'US', currency: 'USD', serverTime: '2026-09-08T00:00:00Z', validUntil: '2026-09-08T00:01:00Z', price: { value, capturedAt: '2026-09-08T00:00:00Z', expiresAt: '2026-09-08T00:01:00Z' } }, { headers: { 'cache-control': 'no-store' } });

test('disabled collection never fetches; malformed and excessive inputs rejected', async () => {
  const collection = createCommerceCollection(ids, { enabled: false });
  assert.equal(await collection.refreshAll(), false); assert.ok(collection.read().every(row => row.observation === null)); collection.dispose();
  for (const input of [['bad'], Array(101).fill(ids[0])]) assert.throws(() => createCommerceCollection(input, options));
  const empty = createCommerceCollection([], options);
  try { assert.equal(await empty.refreshAll(), false); } finally { empty.dispose(); }
});

test('repeated identities share one request and returned observations cannot mutate retained data', async () => {
  const calls = [];
  const collection = createCommerceCollection([ids[0], ids[1], ids[0]], { ...options, fetch: async url => { const asin = url.searchParams.get('asin'); calls.push(asin); return response(asin); } });
  try {
    assert.equal(await collection.refreshAll(), true); assert.deepEqual(calls.sort(), ids.slice(0, 2));
    const rows = collection.read(); rows[0].observation.price.value = 999;
    assert.equal(collection.read()[0].observation.price.value, 10);
  } finally { collection.dispose(); }
});

test('three active requests maximum, duplicate refresh rejected, hiding cancels and prevents queued work', async () => {
  let calls = 0; let active = 0; let peak = 0;
  const collection = createCommerceCollection(ids, { ...options, fetch: (_, init) => {
    calls++; active++; peak = Math.max(peak, active);
    return new Promise((_, reject) => init.signal.addEventListener('abort', () => { active--; reject(Error('Aborted')); }, { once: true }));
  } });
  try {
    const pending = collection.refreshAll(); assert.equal(calls, 3);
    assert.equal(await collection.refreshAll(), false); assert.equal(calls, 3);
    collection.setPermitted(false); assert.equal(await pending, false);
    assert.equal(active, 0); assert.equal(peak, 3); assert.equal(calls, 3);
    collection.setPermitted(true); assert.equal(calls, 3); assert.ok(collection.read().every(row => row.observation === null));
  } finally { collection.dispose(); }
});

test('batch traverses the entire queue and failure never inherits a peer or previous value', async () => {
  let denied = false; let calls = 0;
  const collection = createCommerceCollection(ids, { ...options, fetch: async url => {
    calls++; const asin = url.searchParams.get('asin');
    return denied && asin === ids[0] ? new Response('{}', { status: 503 }) : response(asin, ids.indexOf(asin) + 1);
  } });
  try {
    assert.equal(await collection.refreshAll(), true); assert.equal(calls, 8);
    denied = true; assert.equal(await collection.refreshAll(), false); assert.equal(calls, 16);
    const rows = collection.read(); assert.equal(rows[0].observation, null);
    for (const [index, row] of rows.entries()) if (index) assert.equal(row.observation.price.value, index + 1);
    collection.invalidate(); assert.ok(collection.read().every(row => row.observation === null));
  } finally { collection.dispose(); }
});

test('batch success requires observations still valid at completion and dispose silences notifications', async () => {
  let time = 0; let calls = 0; let notifications = 0;
  const collection = createCommerceCollection(ids, { ...options, clock: { wall: () => time, monotonic: () => time }, changed: () => notifications++, fetch: async url => {
    if (++calls === 8) time = 60_000;
    return response(url.searchParams.get('asin'));
  } });
  assert.equal(await collection.refreshAll(), false);
  collection.dispose(); const count = notifications;
  await Promise.resolve(); assert.equal(notifications, count);
  assert.ok(collection.read().every(row => row.observation === null));
  assert.equal(await collection.refreshAll(), false);
});
