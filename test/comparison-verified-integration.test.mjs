import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVerifiedComparisonInsights, prepareVerifiedComparisonProducts } from '../src/lib/blocks/block9/comparison-insights-verified.ts';
import { buildComparisonInsights } from '../src/lib/comparison-insights.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const products = [{ slug: 'alpha-hub', name: 'Alpha', category: 'smart-hub', price: 80, alexaCompatible: true }];

test('comparison wrapper delegates to legacy behavior while disabled', () => {
  const actual = buildVerifiedComparisonInsights(products, { enabled: false, graph, now: NOW });
  assert.deepEqual(actual, buildComparisonInsights(products));
  assert.deepEqual(prepareVerifiedComparisonProducts(products, { enabled: false, graph, now: NOW }), products);
  assert.deepEqual(prepareVerifiedComparisonProducts(products, { enabled: true, graph: null, now: NOW }), products);
});

test('comparison wrapper consumes only its exact surface ledger row', () => {
  const actual = buildVerifiedComparisonInsights(products, { enabled: true, graph, market: 'US', now: NOW });
  assert.deepEqual(actual.verifiedConstraints, ['alpha-hub: Requires hub Hub Alpha.']);
  assert.deepEqual(actual.verifiedNoticeDetails, [{
    edgeId: 'edge:alpha-hub-required', relation: 'requires-hub', message: 'Requires hub Hub Alpha.', slug: 'alpha-hub',
    confidence: 'medium', evidence: 'research-verified', evidenceLabel: 'Research verified', sourceLabel: 'Fixture docs',
  }]);
});

test('comparison layout data path gives visible table and card products only exact-location verified compatibility', () => {
  const quizAlexaClaim = graph.ledger.find((entry) => entry.id === 'claim:quiz-alpha-alexa');
  const comparisonGraph = {
    ...graph,
    ledger: [...graph.ledger, {
      ...quizAlexaClaim,
      id: 'claim:comparison-alpha-alexa',
      visibleLocation: 'comparison:alpha-hub:compatibility',
    }],
  };
  const rawProducts = [{
    slug: 'alpha-hub', name: 'Alpha', category: 'smart-hub', price: 80,
    alexaCompatible: false, googleHomeCompatible: true,
  }];

  const visibleProducts = prepareVerifiedComparisonProducts(rawProducts, {
    enabled: true, graph: comparisonGraph, market: 'US', now: NOW,
  });

  assert.equal(visibleProducts[0].alexaCompatible, true);
  assert.equal(visibleProducts[0].googleHomeCompatible, undefined);
  assert.equal(visibleProducts[0].compatibilityVerificationEnabled, true);
});

test('comparison surface degrades a catalog compatibility field when only a product row exists', () => {
  const visibleProducts = prepareVerifiedComparisonProducts(products, { enabled: true, graph, market: 'US', now: NOW });
  assert.equal(visibleProducts[0].alexaCompatible, undefined);
});

test('comparison surface preserves stale verified-notice provenance at low confidence', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:alpha-hub-required' ? { ...edge, verifiedAt: '2025-12-01T00:00:00Z' } : edge),
  };
  const actual = buildVerifiedComparisonInsights(products, { enabled: true, graph: altered, market: 'US', now: NOW });
  assert.equal(actual.verifiedNoticeDetails[0].confidence, 'low');
  assert.equal(actual.verifiedNoticeDetails[0].sourceLabel, 'Fixture docs');
});

test('comparison surface suppresses unknown-confidence notices and tradeoffs', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:alpha-hub-required' ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.edgeId === 'edge:alpha-hub-required' ? { ...row, confidence: 'unknown' } : row),
  };
  const actual = buildVerifiedComparisonInsights(products, { enabled: true, graph: altered, market: 'US', now: NOW });
  assert.deepEqual(actual.verifiedConstraints, []);
  assert.deepEqual(actual.verifiedNoticeDetails, []);
});
