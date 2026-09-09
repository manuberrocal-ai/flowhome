import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { serveCompatibilityRequest, COMPATIBILITY_LEASE_MS } from '../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';

const now = '2026-09-07T01:40:00Z';
const request = (surface = 'product', suffix = '') => new Request(`https://flowhome.invalid/compatibility?slug=tapo-c120-security-camera&surface=${surface}&market=US${suffix}`);
function dependencies(graph = documentaryCandidateProvider.getGraph()) {
  return { enabled: true, clock: () => new Date(now), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-10-01T00:00:00Z' }) };
}
const json = async (req = request(), deps = dependencies()) => {
  const result = await serveCompatibilityRequest(req, deps);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.headers.get('CDN-Cache-Control'), 'no-store');
  assert.equal(result.headers.get('etag'), null);
  assert.equal(result.headers.get('access-control-allow-origin'), null);
  return { status: result.status, body: await result.json() };
};

test('delivery stays disabled without trusted server integration; request flags cannot approve it', async () => {
  assert.equal((await json(request(), {})).status, 503);
  let reads = 0;
  const deps = { ...dependencies(), enabled: false, readAuthorizedSnapshot: async () => { reads++; throw Error('must not read'); } };
  assert.equal((await json(request(), deps)).status, 503);
  for (const suffix of ['&approved=true', '&enabled=true', '&market=US', '&surface=quiz']) assert.equal((await json(request('product', suffix), deps)).status, 400);
  assert.equal(reads, 0);
});

test('minimal response preserves exact conditions on each requested surface without review internals', async () => {
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const { status, body } = await json(request(surface));
    assert.equal(status, 200);
    assert.equal(body.context.surface, surface);
    assert.equal(body.product.alexaCompatible, true);
    assert.match(body.product.compatibilityConditions.alexaCompatible, /supported Alexa devices/);
    assert.equal(body.product.compatibilityConditions.matter, null);
    assert.equal(body.leaseMs, COMPATIBILITY_LEASE_MS);
    assert.equal(Date.parse(body.validUntil) - Date.parse(body.serverTime), body.leaseMs);
    for (const marker of ['reviewHistory', 'codex-documentary-review', 'unassigned', 'marketplaceId', 'authorizationExpiresAt', '"graph"']) assert.ok(!JSON.stringify(body).includes(marker));
  }
});

test('dispute is re-read on the next request and cannot reuse a prior successful payload', async () => {
  const graph = documentaryCandidateProvider.getGraph();
  const deps = dependencies(graph);
  assert.equal((await json(request(), deps)).body.product.alexaCompatible, true);
  graph.ledger.find(row => row.visibleLocation === 'product:tapo-c120-security-camera:compatibility' && row.edgeId.includes(':alexa:')).status = 'disputed';
  assert.equal((await json(request(), deps)).body.product.compatibilityConditions.alexaCompatible, null);
  assert.equal((await json(request('quiz'), deps)).body.product.alexaCompatible, true);
  deps.readAuthorizedSnapshot = async () => null;
  assert.deepEqual(await json(request(), deps), { status: 503, body: { status: 'unavailable' } });
});

test('lease cannot exceed the earliest applicable edge or authorization deadline', async () => {
  const graph = documentaryCandidateProvider.getGraph();
  graph.edges.find(edge => edge.from === 'p:tapo-c120-security-camera' && edge.to === 'e:alexa').expiry = '2026-09-07T01:40:05Z';
  const deps = dependencies(graph);
  assert.equal((await json(request(), deps)).body.leaseMs, 5000);
  deps.readAuthorizedSnapshot = async () => ({ graph, authorizationExpiresAt: '2026-09-07T01:40:02Z' });
  assert.equal((await json(request(), deps)).body.leaseMs, 2000);
  deps.clock = () => new Date('2026-09-07T01:40:02Z');
  assert.equal((await json(request(), deps)).status, 503);
});

test('acquisition latency and send-time expiry are checked without extending evidence', async () => {
  const graph = documentaryCandidateProvider.getGraph();
  let time = now;
  const deps = { enabled: true, clock: () => new Date(time), readAuthorizedSnapshot: async () => { time = '2026-11-01T00:00:00Z'; return { graph, authorizationExpiresAt: '2026-12-01T00:00:00Z' }; } };
  const expired = await json(request(), deps);
  assert.equal(expired.status, 200);
  assert.equal(expired.body.product.compatibilityConditions.alexaCompatible, null);
  let clockCalls = 0;
  const late = { ...dependencies(), clock: () => new Date(clockCalls++ === 0 ? now : '2026-09-07T01:41:00Z') };
  assert.equal((await json(request(), late)).status, 503);
  assert.equal((await json(request(), { ...dependencies(), clock: () => new Date('invalid') })).status, 503);
});

test('malformed scope, unknown models and unsupported methods never expose a graph', async () => {
  for (const bad of [request('wrong'), new Request('https://flowhome.invalid/compatibility?slug=x&surface=quiz&market=CA'), new Request('https://flowhome.invalid/compatibility?slug=../x&surface=quiz&market=US')]) assert.equal((await json(bad)).status, 400);
  assert.equal((await json(new Request('https://flowhome.invalid/compatibility?slug=unknown-model&surface=quiz&market=US'))).status, 404);
  const post = await serveCompatibilityRequest(new Request(request(), { method: 'POST' }), dependencies());
  assert.equal(post.status, 405);
  assert.equal(post.headers.get('Allow'), 'GET');
  assert.equal(post.headers.get('Cache-Control'), 'no-store');
});

test('provider failures and canceled requests return only generic unavailable responses', async () => {
  const deps = { ...dependencies(), readAuthorizedSnapshot: async () => { throw new Error('synthetic-private-provider-detail'); } };
  assert.deepEqual(await json(request(), deps), { status: 503, body: { status: 'unavailable' } });
  const controller = new AbortController(); controller.abort();
  assert.equal((await json(new Request(request(), { signal: controller.signal }))).status, 503);
});

test('a hung provider reaches the bounded deadline and receives an abort signal', async () => {
  let signal;
  const deps = { ...dependencies(), readAuthorizedSnapshot: async (_context, provided) => { signal = provided; return new Promise(() => {}); } };
  assert.deepEqual(await json(request(), deps), { status: 503, body: { status: 'unavailable' } });
  assert.equal(signal.aborted, true);
});

test('cancellation during acquisition is propagated instead of waiting for the source', async () => {
  const controller = new AbortController();
  let signal;
  const deps = { ...dependencies(), readAuthorizedSnapshot: async (_context, provided) => { signal = provided; controller.abort(); return new Promise(() => {}); } };
  assert.equal((await json(new Request(request(), { signal: controller.signal }), deps)).status, 503);
  assert.equal(signal.aborted, true);
});

test('loopback HTTP delivers current minimal data, then revocation without a stale or 304 fallback', async t => {
  const graph = documentaryCandidateProvider.getGraph();
  const deps = dependencies(graph);
  const server = createServer(async (incoming, outgoing) => {
    const result = await serveCompatibilityRequest(new Request(`http://127.0.0.1${incoming.url}`, { method: incoming.method, headers: incoming.headers }), deps);
    outgoing.writeHead(result.status, Object.fromEntries(result.headers));
    outgoing.end(await result.text());
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/compatibility?slug=tapo-c120-security-camera&surface=product&market=US`;
  const first = await fetch(url);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  assert.equal((await first.json()).product.alexaCompatible, true);
  deps.readAuthorizedSnapshot = async () => null;
  const revoked = await fetch(url, { headers: { 'If-None-Match': '*', 'If-Modified-Since': 'Mon, 07 Sep 2026 00:00:00 GMT' } });
  assert.equal(revoked.status, 503);
  assert.equal(revoked.headers.get('cache-control'), 'no-store');
  assert.equal(revoked.headers.get('cdn-cache-control'), 'no-store');
  assert.deepEqual(await revoked.json(), { status: 'unavailable' });
});
