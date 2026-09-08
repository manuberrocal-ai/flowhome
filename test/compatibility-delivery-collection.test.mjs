import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompatibilityCollection } from '../src/lib/blocks/block9/delivery-collection.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { buildComparisonInsights } from '../src/lib/comparison-insights.ts';
import { selectRecommendationResult } from '../src/lib/quiz-recommend.ts';

const slugs = ['tapo-c120-security-camera', 'eufy-security-indoor-cam-c120'];
const base = slugs.map(slug => ({ slug, category: 'security-camera', catalogActive: true, alexaCompatible: true }));
const options = { enabled: true, endpoint: '/compatibility', pageUrl: 'https://flowhome.invalid/', surface: 'comparison' };
const graph = documentaryCandidateProvider.getGraph();
const deps = { enabled: true, clock: () => new Date('2026-09-07T01:40:00Z'), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-10-01T00:00:00Z' }) };
const fetcher = (url, init) => serveCompatibilityRequest(new Request(url, init), deps);

test('disabled collection makes no requests and preserves isolated base catalog', async () => {
  const collection = createCompatibilityCollection(base, { ...options, enabled: false, fetch: () => { throw Error('Must not fetch'); } });
  assert.equal(await collection.refreshAll(), false);
  const rows = collection.read(); rows[0].product.alexaCompatible = false;
  assert.equal(collection.read()[0].product.alexaCompatible, true);
  collection.dispose();
});

test('comparison leaders and buyer reasons are recomputed without expired or revoked evidence', async () => {
  let time = 0; let revoked = false;
  const collection = createCompatibilityCollection(base, { ...options, clock: { monotonic: () => time, wall: () => time }, fetch: (url, init) => serveCompatibilityRequest(new Request(url, init), { ...deps, enabled: !revoked }) });
  const insights = () => buildComparisonInsights(collection.read().map(row => row.product));
  try {
    assert.equal(insights().ecosystemLeaders.length, 0);
    assert.equal(await collection.refreshAll(), true); assert.ok(insights().ecosystemLeaders.length > 0);
    time = 60_000; assert.equal(insights().ecosystemLeaders.length, 0);
    assert.doesNotMatch(JSON.stringify(insights().buyerFits), /evidence-backed signal/);
    assert.equal(await collection.refreshAll(), true); revoked = true;
    assert.equal(await collection.refreshAll(), false); assert.equal(insights().ecosystemLeaders.length, 0);
    assert.equal(base[0].alexaCompatible, true);
  } finally { collection.dispose(); }
});

test('quiz ecosystem evidence availability follows live collection rather than retained catalog flags', async () => {
  const collection = createCompatibilityCollection(base, { ...options, surface: 'quiz', fetch: fetcher });
  const answers = { goal: 'security', ecosystem: 'alexa', budget: 'open', installation: 'open', extra: 'open' };
  const result = () => selectRecommendationResult(answers, collection.read().map(row => row.product));
  try {
    assert.equal(result().ecosystemEvidenceUnavailable, true);
    await collection.refreshAll(); assert.equal(result().ecosystemEvidenceUnavailable, false);
    collection.setPermitted(false); assert.equal(result().ecosystemEvidenceUnavailable, true);
    collection.setPermitted(true); assert.equal(result().ecosystemEvidenceUnavailable, true);
  } finally { collection.dispose(); }
});

test('batch concurrency is at most three and cancellation prevents queued requests', async () => {
  let calls = 0; let active = 0; let max = 0;
  const candidates = graph.nodes.filter(node => node.type === 'product').slice(0, 8).map(node => ({ slug: node.slug }));
  const collection = createCompatibilityCollection(candidates, { ...options, fetch: (_url, init) => {
    calls++; active++; max = Math.max(max, active);
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => { active--; reject(Error('Aborted')); }, { once: true }));
  } });
  const pending = collection.refreshAll();
  assert.equal(calls, 3); collection.setPermitted(false);
  assert.equal(await pending, false); assert.equal(calls, 3); assert.equal(max, 3); assert.equal(active, 0);
  collection.dispose();
});

test('one unavailable product cannot inherit a peer claim; snapshots and callbacks do not survive disposal', async () => {
  let changed = 0;
  const collection = createCompatibilityCollection(base, { ...options, changed: () => changed++, fetch: (url, init) => url.searchParams.get('slug') === slugs[1] ? Promise.resolve(new Response('{}', { status: 503 })) : fetcher(url, init) });
  await collection.refreshAll();
  const rows = collection.read(); assert.equal(rows[0].product.alexaCompatible, true); assert.equal(rows[1].product.alexaCompatible, undefined);
  rows[0].product.compatibilityConditions.alexaCompatible = 'Mutated';
  assert.notEqual(collection.read()[0].product.compatibilityConditions.alexaCompatible, 'Mutated');
  collection.invalidate(); collection.dispose(); const count = changed;
  await Promise.resolve(); assert.equal(changed, count); assert.equal(await collection.refresh(slugs[0]), false);
  assert.ok(collection.read().every(row => row.product.alexaCompatible === undefined && row.notices.length === 0));
});

test('collection rejects duplicate or malformed identities', () => {
  for (const products of [[base[0], base[0]], [{ slug: '../other' }], Array.from({ length: 101 }, (_, i) => ({ slug: `p-${i}` }))]) assert.throws(() => createCompatibilityCollection(products, options));
});
