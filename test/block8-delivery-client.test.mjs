import assert from 'node:assert/strict';
import test from 'node:test';
import { createCommerceClient } from '../src/lib/blocks/block8/delivery-client.ts';
import { parseCommerceEnvelope } from '../src/lib/blocks/block8/delivery-envelope.ts';
import { serveCommerceRequest } from '../src/lib/blocks/block8/request-delivery.ts';
import { offerFixture, evidenceFixture, NOW } from './helpers/block8-fixtures.mjs';

const asin = 'B0FIXTUR01';
const envelope = () => ({ status: 'available', asin, market: 'US', currency: 'USD', serverTime: NOW, validUntil: '2026-07-30T12:01:00Z', price: { value: 100, capturedAt: '2026-07-30T11:00:00Z', expiresAt: '2026-07-30T12:01:00Z' }, availability: { value: 'https://schema.org/InStock', expiresAt: '2026-07-30T12:00:20Z' } });
const response = (body = envelope(), headers = { 'content-type': 'application/json', 'cache-control': 'no-store' }) => new Response(JSON.stringify(body), { headers });
const config = extra => ({ endpoint: '/test-only', pageUrl: 'https://flowhome.dev/', ...extra });

test('response parser rejects unknown fields, wrong identities and invalid commercial values', () => {
  const good = envelope(); assert.equal(parseCommerceEnvelope(good, asin).priceLeaseMs, 60_000);
  for (const patch of [{ secret: 'not-allowed' }, { asin: 'B000000000' }, { currency: 'CAD' }, { serverTime: 'invalid' }, { validUntil: '2026-07-30T12:01:01Z' }, { price: { ...good.price, value: 0 } }, { price: { ...good.price, capturedAt: '2026-07-30T12:00:01Z' } }, { availability: { ...good.availability, value: {} } }, { availability: { ...good.availability, expiresAt: good.serverTime } }]) assert.equal(parseCommerceEnvelope({ ...good, ...patch }, asin), null);
});

test('latency is deducted, stock expires independently, and a new read cannot renew price', async () => {
  let time = 0; const client = createCommerceClient(config({ clock: { monotonic: () => time, wall: () => time }, fetch: async () => { time = 5000; return response(); } }));
  try {
    assert.equal(await client.refresh(asin), true); assert.equal(client.read().price.value, 100);
    time = 20_000; assert.equal(client.read().availability, null); assert.equal(client.read().price.value, 100);
    time = 60_000; assert.equal(client.read(), null);
  } finally { client.dispose(); }
});

test('expired response, backward clock and hide/resume do not restore cached values', async () => {
  let time = 0; let delayed = false;
  const client = createCommerceClient(config({ clock: { monotonic: () => time, wall: () => time }, fetch: async () => { if (delayed) time += 60_000; return response(); } }));
  try {
    assert.equal(await client.refresh(asin), true);
    client.setPermitted(false); assert.equal(client.read(), null); assert.equal(await client.refresh(asin), false);
    client.setPermitted(true); assert.equal(client.read(), null);
    assert.equal(await client.refresh(asin), true); time = -1; assert.equal(client.read(), null);
    time = 0; delayed = true; assert.equal(await client.refresh(asin), false); assert.equal(client.read(), null);
  } finally { client.dispose(); }
});

test('older responses cannot overwrite a newer result even when fetch ignores abort', async () => {
  let release; let calls = 0;
  const client = createCommerceClient(config({ fetch: async () => ++calls === 1 ? new Promise(resolve => { release = resolve; }) : response({ ...envelope(), price: { ...envelope().price, value: 200 } }) }));
  try {
    const old = client.refresh(asin); await Promise.resolve();
    assert.equal(await client.refresh(asin), true);
    release(response()); assert.equal(await old, false); assert.equal(client.read().price.value, 200);
  } finally { client.dispose(); }
});

test('transport is same-origin, bounded, no-store and credential-free', async () => {
  for (const endpoint of ['https://elsewhere.example/data', '/data?approved=true', '/data#fragment']) assert.throws(() => createCommerceClient(config({ endpoint })));
  for (const candidate of [new Response('{}', { status: 503 }), response(envelope(), { 'content-type': 'application/json' }), new Response('x'.repeat(16_385), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })]) {
    const client = createCommerceClient(config({ fetch: async (_, options) => { assert.equal(options.credentials, 'omit'); assert.equal(options.cache, 'no-store'); assert.equal(options.redirect, 'error'); return candidate; } }));
    try { assert.equal(await client.refresh(asin), false); assert.equal(client.read(), null); } finally { client.dispose(); }
  }
});

test('real server contract and client interoperate with synthetic trusted evidence', async () => {
  const offer = offerFixture({ source: 'amazon-creators-api', affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=flowhome-20` });
  const evidence = evidenceFixture(offer); evidence.knownVariants[0].marketplaceId = asin;
  let enabled = true;
  const client = createCommerceClient(config({ fetch: (url, options) => serveCommerceRequest(new Request(url, options), { enabled, clock: () => new Date(NOW), readAuthorizedSnapshot: async () => ({ offer, evidence, authorizationExpiresAt: '2026-07-30T12:10:00Z' }) }) }));
  try {
    assert.equal(await client.refresh(asin), true); assert.equal(client.read().price.value, 100);
    enabled = false; assert.equal(await client.refresh(asin), false); assert.equal(client.read(), null);
  } finally { client.dispose(); }
});

test('expiry actively notifies removal without a user read or another request', async () => {
  let ready = false; let removed;
  const expired = new Promise(resolve => { removed = resolve; });
  const body = envelope(); body.validUntil = '2026-07-30T12:00:00.150Z'; body.price.expiresAt = body.validUntil; delete body.availability;
  const client = createCommerceClient(config({ fetch: async () => response(body), changed: () => { if (ready) removed(); } }));
  let timer;
  try {
    assert.equal(await client.refresh(asin), true); ready = true;
    await Promise.race([expired, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('No expiry notification')), 1500); })]);
    assert.equal(client.read(), null);
  } finally { clearTimeout(timer); client.dispose(); }
});

test('client timeout aborts a fetch implementation that never resolves', async () => {
  let signal;
  const client = createCommerceClient(config({ fetch: (_, options) => { signal = options.signal; return new Promise(() => {}); } }));
  try { assert.equal(await client.refresh(asin), false); assert.equal(signal.aborted, true); assert.equal(client.read(), null); }
  finally { client.dispose(); }
});
