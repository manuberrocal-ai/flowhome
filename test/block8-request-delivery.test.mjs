import assert from 'node:assert/strict';
import test from 'node:test';
import { serveCommerceRequest } from '../src/lib/blocks/block8/request-delivery.ts';
import { offerFixture, evidenceFixture, NOW } from './helpers/block8-fixtures.mjs';

const asin = 'B0FIXTUR01';
const request = (query = `asin=${asin}&market=US`, options) => new Request(`https://flowhome.dev/test-only?${query}`, options);
function snapshot() {
  const offer = offerFixture({ source: 'amazon-creators-api', affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=flowhome-20` });
  const evidence = evidenceFixture(offer); evidence.knownVariants[0].marketplaceId = asin;
  return { offer, evidence, authorizationExpiresAt: '2026-07-30T12:10:00Z' };
}
const deps = extra => ({ enabled: true, readAuthorizedSnapshot: async () => snapshot(), clock: () => new Date(NOW), ...extra });
const checkHeaders = response => {
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('cdn-cache-control'), 'no-store');
  assert.equal(response.headers.get('etag'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
};

test('disabled and invalid requests never invoke the trusted reader', async () => {
  let reads = 0; const readAuthorizedSnapshot = async () => { reads++; return snapshot(); };
  for (const enabled of [undefined, false, 'true']) {
    const response = await serveCommerceRequest(request(), deps({ enabled, readAuthorizedSnapshot }));
    assert.equal(response.status, 503); checkHeaders(response);
  }
  for (const query of [`asin=${asin}&market=CA`, `asin=${asin}&market=US&approved=true`, `asin=${asin}&asin=${asin}&market=US`, 'asin=bad&market=US']) {
    const response = await serveCommerceRequest(request(query), deps({ readAuthorizedSnapshot }));
    assert.equal(response.status, 400); checkHeaders(response);
  }
  const response = await serveCommerceRequest(request(undefined, { method: 'POST' }), deps({ readAuthorizedSnapshot }));
  assert.equal(response.status, 405); checkHeaders(response); assert.equal(reads, 0);
});

test('minimal response is bounded by authorization, field deadlines and a short response lease', async () => {
  const value = snapshot(); value.evidence.sourcePermissions[0].availability.validUntil = '2026-07-30T12:00:20Z';
  const response = await serveCommerceRequest(request(), deps({ readAuthorizedSnapshot: async () => value }));
  assert.equal(response.status, 200); checkHeaders(response);
  const body = await response.json();
  assert.equal(body.price.value, 100); assert.equal(body.validUntil, '2026-07-30T12:01:00.000Z');
  assert.equal(body.availability.expiresAt, '2026-07-30T12:00:20.000Z');
  assert.equal(JSON.stringify(body).includes('fixture:'), false);
  assert.equal(body.rating, undefined); assert.equal(body.discount, undefined);
});

test('time is checked after acquisition and again after projection', async () => {
  for (const expiryDuring of ['read', 'projection']) {
    const value = snapshot(); value.authorizationExpiresAt = '2026-07-30T12:00:01Z';
    let calls = 0;
    const response = await serveCommerceRequest(request(), deps({ readAuthorizedSnapshot: async () => value, clock: () => new Date(expiryDuring === 'read' || calls++ ? '2026-07-30T12:00:01Z' : NOW) }));
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { status: 'unavailable' });
  }
});

test('each request rereads authorization and never falls back to the prior successful result', async () => {
  let calls = 0;
  const settings = deps({ readAuthorizedSnapshot: async () => { if (calls++) throw new Error('private provider body'); return snapshot(); } });
  assert.equal((await serveCommerceRequest(request(), settings)).status, 200);
  const failed = await serveCommerceRequest(request(), settings);
  assert.equal(failed.status, 503); checkHeaders(failed);
  assert.deepEqual(await failed.json(), { status: 'unavailable' }); assert.equal(calls, 2);
});

test('aborted requests cannot start acquisition; in-flight cancellation reaches the reader', async () => {
  const controller = new AbortController(); controller.abort(); let called = false;
  assert.equal((await serveCommerceRequest(request(undefined, { signal: controller.signal }), deps({ readAuthorizedSnapshot: async () => { called = true; return snapshot(); } }))).status, 503);
  assert.equal(called, false);
  const live = new AbortController(); let signal;
  const pending = serveCommerceRequest(request(undefined, { signal: live.signal }), deps({ readAuthorizedSnapshot: async (_, received) => { signal = received; live.abort(); return snapshot(); } }));
  assert.equal((await pending).status, 503); assert.equal(signal.aborted, true);
});

test('a stalled reader times out without revealing data or waiting indefinitely', async () => {
  let signal;
  const response = await serveCommerceRequest(request(), deps({ readAuthorizedSnapshot: (_, received) => { signal = received; return new Promise(() => {}); } }));
  assert.equal(response.status, 503); assert.equal(signal.aborted, true); checkHeaders(response);
});

test('authorization caps the lease and availability can expire during projection without removing valid price', async () => {
  const value = snapshot(); value.authorizationExpiresAt = '2026-07-30T12:00:30Z';
  value.evidence.sourcePermissions[0].availability.validUntil = '2026-07-30T12:00:01Z';
  let calls = 0;
  const response = await serveCommerceRequest(request(), deps({ readAuthorizedSnapshot: async () => value, clock: () => new Date(calls++ ? '2026-07-30T12:00:01Z' : NOW) }));
  const body = await response.json(); assert.equal(response.status, 200);
  assert.equal(body.validUntil, '2026-07-30T12:00:30.000Z');
  assert.equal(body.availability, undefined); assert.equal(body.price.value, 100);
});

test('invalid or backward server clocks cannot extend the response life', async () => {
  for (const later of ['invalid', '2026-07-30T11:59:59Z']) {
    let calls = 0;
    const response = await serveCommerceRequest(request(), deps({ clock: () => new Date(calls++ ? later : NOW) }));
    assert.equal(response.status, 503); checkHeaders(response);
  }
});
