import assert from 'node:assert/strict';
import test from 'node:test';
import { compatibilityCoverage, readCoverageCatalog } from '../scripts/qa/compatibility-coverage.mjs';
import { documentaryCandidateProvider, DOCUMENTARY_CANDIDATE_STATUS } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';

const now = '2026-09-07T01:15:00Z';
const report = (graph = documentaryCandidateProvider.getGraph(), date = now, declared = DOCUMENTARY_CANDIDATE_STATUS) => compatibilityCoverage(readCoverageCatalog(), graph, date, declared);

test('inventory reconciles real catalog coverage and never activates the public runtime', () => {
  const result = report();
  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.catalogModels, 28);
  assert.equal(result.summary.candidateModels, 28);
  assert.equal(result.summary.uncoveredModels, 0);
  assert.equal(result.summary.relations, 115);
  assert.equal(result.summary.proposedLocations, 460);
  assert.equal(result.summary.resolvedFieldLocations, 460);
  assert.equal(result.publicActivation, 'not_approved');
  assert.equal(getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }).graph, null);
  assert.ok(!result.categoriesWithoutCandidate.includes('robot-vacuum'));
  assert.ok(!result.categoriesWithoutCandidate.includes('smart-lock'));
});

test('expiry distinguishes historical candidate coverage from currently resolved evidence', () => {
  const result = report(undefined, '2026-11-01T00:00:00Z');
  assert.equal(result.summary.candidateModels, 28);
  assert.equal(result.summary.modelsWithCurrentSignalsOnAllSurfaces, 0);
  assert.equal(result.summary.resolvedFieldLocations, 0);
  assert.ok(result.products.every(product => product.bySurface.quiz.unknown.length === 9));
});

test('missing or disputed locations change only their surface and are not hidden by model counts', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edgeId = graph.ledger[0].edgeId;
  const target = graph.ledger.find(row => row.edgeId === edgeId && row.visibleLocation.startsWith('product:'));
  graph.ledger.splice(graph.ledger.indexOf(target), 1);
  const missing = report(graph);
  assert.ok(missing.errors.includes('missing-ledger-location'));
  assert.equal(missing.incompleteLocations.length, 1);
  assert.equal(missing.summary.resolvedFieldLocations, 459);
  const quiz = graph.ledger.find(row => row.edgeId === edgeId && row.visibleLocation.startsWith('quiz:'));
  quiz.status = 'disputed';
  assert.equal(report(graph).summary.resolvedFieldLocations, 458);
  assert.equal(report().summary.resolvedFieldLocations, 460);
});

test('inventory detects stale declared counts, duplicate IDs and orphan models', () => {
  const graph = documentaryCandidateProvider.getGraph();
  graph.edges.push({ ...graph.edges[0] });
  graph.nodes.push({ ...graph.nodes[0], id: 'p:orphan', slug: 'orphan' });
  const result = report(graph, now, { coveredModels: 99, catalogModels: 29 });
  assert.ok(result.errors.includes('duplicate-edges-id'));
  assert.ok(result.errors.includes('candidate-model-outside-catalog'));
  assert.ok(result.errors.includes('declared-model-count-mismatch'));
  assert.ok(result.errors.includes('declared-catalog-count-mismatch'));
  assert.deepEqual(result.orphanModels, ['orphan']);
});

test('raw catalog research leads never certify claims or coerce truthy values', () => {
  const catalog = readCoverageCatalog();
  const slug = 'tapo-c120-security-camera';
  const product = catalog.find(row => row.slug === slug);
  product.catalogSignals = { wifi: true, matter: true, alexa: false, google: 'true', thread: 1, apple: null };
  const graph = documentaryCandidateProvider.getGraph();
  const before = JSON.stringify({ catalog, graph });
  const result = compatibilityCoverage(catalog, graph, now, DOCUMENTARY_CANDIDATE_STATUS);
  const row = result.products.find(row => row.slug === slug);
  assert.deepEqual(row.rawCatalogAffirmations, ['matter', 'wifi']);
  assert.deepEqual(row.unresolvedCatalogAffirmations, [{ field: 'matter', catalogField: 'matter', missingSurfaces: ['product', 'quiz', 'comparison', 'alternatives'] }]);
  assert.deepEqual(row.rawNegationsWithCandidateSignals, ['alexa']);
  assert.ok(row.bySurface.product.unknown.includes('matter'));
  assert.equal(JSON.stringify({ catalog, graph }), before);
  assert.match(result.researchQueueScope, /not public-render records/);
});

test('research leads retain exact missing surfaces and change when evidence expires', () => {
  const catalog = readCoverageCatalog();
  const slug = 'tapo-c120-security-camera';
  catalog.find(row => row.slug === slug).catalogSignals = { wifi: true };
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:wifi');
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === `quiz:${slug}:compatibility`).status = 'disputed';
  const result = compatibilityCoverage(catalog, graph, now);
  assert.deepEqual(result.researchQueue.find(row => row.slug === slug).unresolvedAffirmations[0].missingSurfaces, ['quiz']);
  const expired = compatibilityCoverage(catalog, graph, '2026-11-01T00:00:00Z');
  assert.equal(expired.researchQueue.find(row => row.slug === slug).unresolvedAffirmations[0].missingSurfaces.length, 4);
  assert.equal(expired.summary.rawNegationsWithCandidateSignals, 0);
});

test('real research queue reconciles fields independently of complete model presence', () => {
  const result = report();
  assert.equal(result.summary.uncoveredModels, 0);
  assert.ok(result.summary.unresolvedCatalogAffirmations > 0);
  assert.equal(result.summary.unresolvedCatalogAffirmations, result.researchQueue.reduce((sum, row) => sum + row.unresolvedAffirmations.length, 0));
  assert.equal(result.summary.rawNegationsWithCandidateSignals, result.researchQueue.reduce((sum, row) => sum + row.negationsWithCandidateSignals.length, 0));
  assert.ok(result.researchQueue.find(row => row.slug === 'aeotec-smartthings-hub').unresolvedAffirmations.some(row => row.field === 'bluetooth'));
  for (const product of readCoverageCatalog()) for (const value of Object.values(product.catalogSignals)) assert.equal(typeof value, 'boolean');
});
