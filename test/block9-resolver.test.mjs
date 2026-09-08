import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';
import { getVerifiedFlags, getVerifiedConstraints, resolveClaimStatus } from '../src/lib/blocks/block9/resolver.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const productLocation = 'product:alpha-hub:ecosystem-chip';

function contradictoryGraph(status = 'active', expiry = null) {
  const positive = graph.edges.find((edge) => edge.from === 'p:alpha-hub' && edge.to === 'e:alexa' && edge.relation === 'works-with');
  assert.ok(positive);
  const conflict = { ...positive, id: 'edge:alpha-alexa-conflict', relation: 'conflicts', claim: 'Fixture explicit incompatibility', status, expiry };
  const rows = graph.ledger.filter((row) => row.edgeId === positive.id).map((row) => ({
    ...row, id: `${row.id}-conflict`, edgeId: conflict.id, claim: conflict.claim, status,
  }));
  return { ...graph, edges: [...graph.edges, conflict], ledger: [...graph.ledger, ...rows] };
}

test('a current evidenced conflict prevents a positive flag on every ledger-backed surface', () => {
  const conflicting = contradictoryGraph();
  for (const visibleLocation of [productLocation, 'product:alpha-hub:compatibility', 'quiz:alpha-hub:compatibility']) {
    assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation }).alexa.verified, true);
    assert.equal(getVerifiedFlags(conflicting, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation }).alexa.verified, false);
    assert.ok(getVerifiedConstraints(conflicting, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation }).conflicts.length > 0);
  }
});

test('expired or suppressed conflicts do not suppress a current positive claim', () => {
  for (const conflicting of [contradictoryGraph('suppressed'), contradictoryGraph('active', '2026-07-01T00:00:00Z')]) {
    assert.equal(getVerifiedFlags(conflicting, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation }).alexa.verified, true);
  }
});

test('comparison and alternatives cannot prefer a positive claim over an evidenced conflict', () => {
  const conflicting = contradictoryGraph();
  for (const visibleLocation of ['comparison:alpha-hub:compatibility', 'alternatives:alpha-hub:compatibility']) {
    const rows = conflicting.ledger.filter((row) => row.visibleLocation === productLocation)
      .map((row) => ({ ...row, id: `${row.id}-surface`, visibleLocation }));
    const scoped = { ...conflicting, ledger: [...conflicting.ledger.filter((row) => row.visibleLocation !== visibleLocation), ...rows] };
    const options = { enabled: true, market: 'US', now: NOW, visibleLocation };
    assert.equal(getVerifiedFlags({ ...scoped, edges: scoped.edges.filter((edge) => edge.relation !== 'conflicts') }, 'alpha-hub', options).alexa.verified, true);
    assert.equal(getVerifiedFlags(scoped, 'alpha-hub', options).alexa.verified, false);
  }
});

test('opposing local-only and cloud-only evidence cannot yield a verified positive flag', () => {
  const conflicting = contradictoryGraph();
  const scoped = { ...conflicting, edges: conflicting.edges.map((edge) => {
    if (edge.from !== 'p:alpha-hub' || edge.to !== 'e:alexa') return edge;
    return { ...edge, relation: edge.relation === 'conflicts' ? 'cloud-only' : 'local-only' };
  }) };
  const options = { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation };
  assert.equal(getVerifiedFlags(scoped, 'alpha-hub', options).alexa.verified, false);
  assert.equal(getVerifiedConstraints(scoped, 'alpha-hub', options).hasCloudPath, true);
});

test('a graph edge cannot surface without the exact rendered ledger location', () => {
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW }).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation }).alexa.verified, true);
});

test('a ledger row belonging to another surface does not authorize this one', () => {
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'comparison:alpha-hub:compatibility' }).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'quiz:alpha-hub:compatibility' }).alexa.verified, true);
});

test('duplicate rows for one exact surface location fail closed', () => {
  const row = graph.ledger.find((entry) => entry.id === 'claim:quiz-alpha-alexa');
  const duplicated = { ...graph, ledger: [...graph.ledger, { ...row, id: 'claim:quiz-alpha-alexa-duplicate' }] };
  assert.equal(getVerifiedFlags(duplicated, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'quiz:alpha-hub:compatibility' }).alexa.verified, false);
});

test('exact-location notices preserve structured provenance', () => {
  const result = getVerifiedConstraints(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'comparison:alpha-hub:compatibility' });
  assert.equal(result.notices.length, 1);
  assert.deepEqual(result.notices[0], {
    edgeId: 'edge:alpha-hub-required', relation: 'requires-hub', message: 'Requires hub Hub Alpha.',
    confidence: 'medium', evidence: 'research-verified', evidenceLabel: 'Research verified', sourceLabel: 'Fixture docs',
  });
});

test('resolveClaimStatus uses matching edge and ledger freshness rather than node.version', () => {
  const altered = {
    ...graph,
    nodes: graph.nodes.map((node) => node.id === 'p:alpha-hub' ? { ...node, version: 'not-a-timestamp' } : node),
    ledger: graph.ledger.map((row) => row.id === 'claim:product-alpha-alexa' ? { ...row, entityVersion: 'not-a-timestamp' } : row),
  };
  assert.equal(resolveClaimStatus(altered, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:alpha-hub:compatibility' }), 'active');
});

test('resolveClaimStatus returns the matching expired or disputed edge/ledger status', () => {
  assert.equal(resolveClaimStatus(graph, 'expired-thermostat', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:expired-thermostat:ecosystem-chip' }), 'expired');
  assert.equal(resolveClaimStatus(graph, 'disputed-plug', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:disputed-plug:ecosystem-chip' }), 'disputed');
});
