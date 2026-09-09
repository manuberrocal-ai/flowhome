import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';
import { getVerifiedFlags, getVerifiedRelations, getVerifiedConstraints } from '../src/lib/blocks/block9/resolver.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { parseCompatibilityEnvelope } from '../src/lib/blocks/block9/delivery-envelope.ts';

const now = '2026-07-30T12:00:00Z';
function restrict(graph, edge, type) {
  const id = `${type}:synthetic-required`;
  graph.nodes.push({ ...graph.nodes.find(node => node.id === edge.from), id, type, slug: null, label: 'Synthetic required version' });
  edge.scope[type + 'Id'] = id;
}

test('product-only responses cannot generalize variant, generation, hardware or firmware evidence on any surface', async () => {
  for (const type of ['variant', 'generation', 'hardware', 'firmware']) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const graph = documentaryCandidateProvider.getGraph();
      const edge = graph.edges.find(edge => edge.from === 'p:tapo-c120-security-camera' && edge.to === 'e:alexa');
      restrict(graph, edge, type);
      const context = { slug: 'tapo-c120-security-camera', surface, market: 'US' };
      const response = await serveCompatibilityRequest(new Request(`https://flowhome.invalid/compatibility?${new URLSearchParams(context)}`), { enabled: true, clock: () => new Date('2026-09-07T01:40:00Z'), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-10-01T00:00:00Z' }) });
      const payload = await response.json();
      assert.equal(payload.product.alexaCompatible, undefined, `${type}/${surface}`);
      assert.equal(payload.product.compatibilityConditions.alexaCompatible, null);
      assert.ok(parseCompatibilityEnvelope(payload, context));
    }
  }
});

test('version-scoped substitutes and complements are not presented as product-wide relationships', () => {
  for (const type of ['variant', 'generation', 'hardware', 'firmware']) {
    for (const relation of ['substitutes', 'complements']) {
      const graph = loadBlock9Fixtures(); const edge = graph.edges.find(edge => edge.relation === 'substitutes');
      edge.relation = relation; restrict(graph, edge, type);
      const options = { enabled: true, now, market: 'US', visibleLocation: 'alternatives:beta-bulb:compatibility' };
      assert.deepEqual(getVerifiedRelations(graph, 'beta-bulb', options), []);
      assert.deepEqual(getVerifiedFlags(graph, 'beta-bulb', options)[relation], []);
    }
  }
});

test('a possible version-specific conflict still prevents a broad affirmative result but is not an unconditional conflict notice', () => {
  const graph = loadBlock9Fixtures();
  const edge = graph.edges.find(edge => edge.from === 'p:alpha-hub' && edge.to === 'e:alexa' && edge.relation === 'works-with');
  const conflict = structuredClone(edge); conflict.id += '-scoped-conflict'; conflict.relation = 'conflicts'; conflict.claim = 'Synthetic conflict for a specific firmware';
  restrict(graph, conflict, 'firmware'); graph.edges.push(conflict);
  graph.ledger.push(...graph.ledger.filter(row => row.edgeId === edge.id).map(row => ({ ...row, id: row.id + '-scoped-conflict', edgeId: conflict.id, claim: conflict.claim })));
  const options = { enabled: true, now, market: 'US', visibleLocation: 'product:alpha-hub:compatibility' };
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', options).alexa.verified, false);
  assert.deepEqual(getVerifiedConstraints(graph, 'alpha-hub', options).conflicts, []);
  conflict.expiry = '2026-07-29T00:00:00Z';
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', options).alexa.verified, true);
});

test('setup requirements remain visible when product-wide but not when restricted to an unselected firmware', () => {
  const graph = loadBlock9Fixtures();
  const options = { enabled: true, now, market: 'US', visibleLocation: 'product:alpha-hub:compatibility' };
  const edge = graph.edges.find(edge => edge.from === 'p:alpha-hub' && edge.relation === 'requires-installation');
  const row = graph.ledger.find(row => row.edgeId === edge.id);
  graph.ledger.push({ ...row, id: row.id + '-product-page', visibleLocation: options.visibleLocation });
  const before = getVerifiedConstraints(graph, 'alpha-hub', options).notices;
  assert.ok(before.some(notice => notice.edgeId === edge.id));
  restrict(graph, edge, 'firmware');
  const after = getVerifiedConstraints(graph, 'alpha-hub', options).notices;
  assert.ok(after.every(notice => notice.edgeId !== edge.id));
  assert.equal(after.length, before.length - 1);
});
