import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';
import { getVerifiedRelations } from '../src/lib/blocks/block9/resolver.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { parseCompatibilityEnvelope } from '../src/lib/blocks/block9/delivery-envelope.ts';
import { createCompatibilityCollection } from '../src/lib/blocks/block9/delivery-collection.ts';

const context = { slug: 'beta-bulb', surface: 'alternatives', market: 'US' };
const now = '2026-07-30T12:00:00Z';
const options = { enabled: true, now, market: 'US', visibleLocation: 'alternatives:beta-bulb:compatibility' };
const request = () => new Request(`https://flowhome.invalid/compatibility?${new URLSearchParams(context)}`);
const edgeOf = graph => graph.edges.find(edge => edge.id === 'edge:beta-alpha-substitute');
const rowOf = graph => graph.ledger.find(row => row.visibleLocation === options.visibleLocation);
const deps = graph => ({ enabled: true, clock: () => new Date(now), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-08-01T00:00:00Z' }) });
const body = async (graph = loadBlock9Fixtures()) => (await serveCompatibilityRequest(request(), deps(graph))).json();

test('v2 relations preserve exact explanation, provenance and effective confidence without review internals', async () => {
  const graph = loadBlock9Fixtures(); const response = await body(graph);
  assert.equal(response.schemaVersion, 2);
  assert.deepEqual(response.relations, [{ relation: 'substitutes', targetSlug: 'alpha-hub', targetType: 'product', condition: edgeOf(graph).claim, sourceLabel: edgeOf(graph).source.label, evidence: 'data-evaluated', evidenceLabel: 'Data evaluated', confidence: 'low' }]);
  assert.deepEqual(response.substitutes, ['alpha-hub']); assert.ok(parseCompatibilityEnvelope(response, context));
  for (const privateKey of ['edgeId', 'owner', 'reviewHistory', 'history', 'validationMethod', 'entityId']) assert.ok(!JSON.stringify(response.relations).includes(privateKey));
});

test('relation envelope rejects orphan targets, missing explanations, invalid types and private fields', async () => {
  const baseline = await body();
  for (const mutate of [
    b => { delete b.relations; }, b => { b.relations = []; },
    b => { b.substitutes = []; }, b => { b.complements = ['other']; },
    b => { b.relations[0].targetSlug = 'other'; }, b => { b.relations[0].targetSlug = context.slug; },
    b => { b.relations[0].condition = ' '; }, b => { b.relations[0].sourceLabel = ''; },
    b => { b.relations[0].confidence = 'unknown'; }, b => { b.relations[0].targetType = 'hardware'; },
    b => { b.relations[0].evidenceLabel = 'Hands-on tested'; }, b => { b.relations[0].edgeId = 'private'; },
    b => { b.relations.push({ ...b.relations[0] }); }, b => { b.relations = Array(201).fill(b.relations[0]); },
    b => { b.relations[0].condition = 'x'.repeat(4097); }, b => { b.schemaVersion = 1; },
  ]) { const candidate = structuredClone(baseline); mutate(candidate); assert.equal(parseCompatibilityEnvelope(candidate, context), null); }
});

test('relation explanations disappear on expiry, dispute, conflict and wrong surface', async () => {
  for (const state of ['expired', 'disputed', 'conflict']) {
    const graph = loadBlock9Fixtures(); const edge = edgeOf(graph); const row = rowOf(graph);
    if (state === 'expired') edge.expiry = '2026-07-29T00:00:00Z';
    if (state === 'disputed') row.status = 'disputed';
    if (state === 'conflict') {
      const conflict = { ...edge, id: edge.id + '-conflict', relation: 'conflicts', claim: 'Synthetic documented conflict' };
      graph.edges.push(conflict); graph.ledger.push({ ...row, id: row.id + '-conflict', edgeId: conflict.id, claim: conflict.claim });
    }
    const response = await body(graph);
    assert.deepEqual(response.relations, []); assert.deepEqual(response.substitutes, []); assert.ok(parseCompatibilityEnvelope(response, context));
    if (state === 'conflict') assert.ok(response.notices.some(notice => notice.relation === 'conflicts'));
  }
  assert.deepEqual(getVerifiedRelations(loadBlock9Fixtures(), context.slug, { ...options, enabled: false }), []);
  assert.deepEqual(getVerifiedRelations(loadBlock9Fixtures(), context.slug, { ...options, visibleLocation: 'product:beta-bulb:compatibility' }), []);
});

test('stale explanations report low effective confidence rather than original high confidence', () => {
  const graph = loadBlock9Fixtures(); const edge = edgeOf(graph); const row = rowOf(graph);
  edge.confidence = row.confidence = 'high';
  edge.verifiedAt = row.reviewDate = '2026-01-01T12:00:00Z';
  assert.equal(getVerifiedRelations(graph, context.slug, options)[0].confidence, 'low');
});

test('complements retain hardware identity and separate conditions for the same target', async () => {
  const graph = loadBlock9Fixtures(); const edge = edgeOf(graph); const row = rowOf(graph);
  graph.nodes.push({ ...graph.nodes.find(node => node.id === 'p:alpha-hub'), id: 'h:fixture', type: 'hardware', slug: 'fixture-hardware', label: 'Synthetic hardware' });
  for (const condition of ['Synthetic condition one', 'Synthetic condition two']) {
    const complement = { ...edge, id: 'edge:' + condition, relation: 'complements', to: 'h:fixture', claim: condition };
    graph.edges.push(complement); graph.ledger.push({ ...row, id: 'claim:' + condition, edgeId: complement.id, claim: condition });
  }
  const response = await body(graph);
  assert.deepEqual(response.complements, ['fixture-hardware']);
  assert.deepEqual(response.relations.filter(row => row.relation === 'complements').map(row => [row.targetType, row.condition]), [['hardware', 'Synthetic condition one'], ['hardware', 'Synthetic condition two']]);
  assert.ok(parseCompatibilityEnvelope(response, context));
});

test('collection drops relation explanations with the same lease as their targets and returns isolated copies', async () => {
  let time = 0; const graph = loadBlock9Fixtures();
  const collection = createCompatibilityCollection([{ slug: context.slug }], { enabled: true, surface: 'alternatives', endpoint: '/compatibility', pageUrl: 'https://flowhome.invalid/', clock: { monotonic: () => time, wall: () => time }, fetch: (url, init) => serveCompatibilityRequest(new Request(url, init), deps(graph)) });
  try {
    assert.equal(await collection.refreshAll(), true);
    collection.read()[0].relations[0].condition = 'Mutation';
    assert.notEqual(collection.read()[0].relations[0].condition, 'Mutation');
    time = 60_000;
    assert.deepEqual(collection.read()[0].relations, []); assert.deepEqual(collection.read()[0].substitutes, []);
  } finally { collection.dispose(); }
});
