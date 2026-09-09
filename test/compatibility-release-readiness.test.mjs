import assert from 'node:assert/strict';
import test from 'node:test';
import { compatibilityReleaseReadiness } from '../scripts/qa/compatibility-release-readiness.mjs';
import { readCoverageCatalog } from '../scripts/qa/compatibility-coverage.mjs';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';

const now = '2026-09-07T01:20:00Z';
const report = (graph = documentaryCandidateProvider.getGraph(), date = now) => compatibilityReleaseReadiness(readCoverageCatalog(), graph, date);

test('release packet separates resolved documentary signals from unapproved publication', () => {
  const result = report();
  assert.deepEqual(result.structuralErrors, []);
  assert.deepEqual(result.counts, { models: 28, relations: 115, locations: 460, unresolvedIdentity: 28, unreviewedEdges: 115, unreviewedLocations: 460, unassignedLocations: 460, unavailableLocations: 0 });
  assert.equal(result.publicationAuthorized, false);
  assert.equal(result.canInstallProvider, false);
  assert.equal(result.researchQueue.length, 4);
  assert.equal(getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }).graph, null);
});

test('exact snapshot digest changes with claims, scope and reviews without mutating inputs', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const before = JSON.stringify(graph);
  const first = report(graph);
  assert.equal(JSON.stringify(graph), before);
  assert.equal(report(graph).candidateSha256, first.candidateSha256);
  graph.edges[0].claim += ' changed';
  assert.notEqual(report(graph).candidateSha256, first.candidateSha256);
  const second = report(graph).candidateSha256;
  graph.edges[0].scope.firmwareId = 'firmware:changed';
  assert.notEqual(report(graph).candidateSha256, second);
  const third = report(graph).candidateSha256;
  graph.edges[0].reviewHistory[0].note = 'changed review';
  assert.notEqual(report(graph).candidateSha256, third);
});

test('self-asserted approval records and assigned owners never authorize a release', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const approval = { reviewedAt: now, reviewerId: 'test-assertion-not-an-authenticated-person', verdict: 'approved', note: 'test only' };
  for (const edge of graph.edges) edge.reviewHistory.push({ ...approval });
  for (const row of graph.ledger) { row.owner = 'test-owner'; row.history.push({ ...approval }); }
  const result = report(graph);
  assert.equal(result.counts.unreviewedEdges, 0);
  assert.equal(result.counts.unreviewedLocations, 0);
  assert.equal(result.counts.unassignedLocations, 0);
  assert.equal(result.publicationAuthorized, false);
  assert.equal(result.canInstallProvider, false);
  assert.equal(result.requiredExternalGates.length, 4);
});

test('newer pending, rejected, future and pre-evidence reviews remain unresolved', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges[0];
  edge.reviewHistory.push({ reviewedAt: now, reviewerId: 'test-owner', verdict: 'approved', note: null });
  assert.equal(report(graph).unreviewedEdges.includes(edge.id), false);
  for (const override of [{ verdict: 'pending' }, { verdict: 'rejected' }, { reviewedAt: '2026-09-08T00:00:00Z' }, { reviewedAt: '2020-01-01T00:00:00Z' }, { reviewerId: 'unassigned' }, { reviewerId: ' unassigned ' }, { reviewerId: ' ' }]) {
    edge.reviewHistory.push({ reviewedAt: now, reviewerId: 'test-owner', verdict: 'approved', note: null, ...override });
    assert.equal(report(graph).unreviewedEdges.includes(edge.id), true);
    edge.reviewHistory.pop();
  }
});

test('expiry and ledger mismatch stay blocking even if a review record says approved', () => {
  assert.equal(report(undefined, '2026-11-01T00:00:00Z').counts.unavailableLocations, 460);
  const graph = documentaryCandidateProvider.getGraph();
  graph.ledger[0].claim = 'different claim';
  assert.equal(report(graph).counts.unavailableLocations, 1);
  graph.ledger[0].claim = graph.edges[0].claim;
  graph.ledger[0].status = 'disputed';
  assert.equal(report(graph).counts.unavailableLocations, 1);
});
