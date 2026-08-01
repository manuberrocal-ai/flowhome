import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareQuizCatalog, selectRecommendationResult } from '../src/lib/quiz-recommend.ts';
import { getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const state = { goal: 'comfort', ecosystem: 'alexa', budget: 'open', installation: 'plug-and-play', extra: 'open' };
const alpha = { slug: 'alpha-hub', category: 'smart-lighting', catalogActive: true, price: 80, ownerRating: 4.5, ownerRatingCount: 100, alexaCompatible: false };

test('quiz catalog remains legacy when central runtime has no approved graph', () => {
  const catalog = prepareQuizCatalog([alpha], getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }));
  assert.equal(catalog[0].alexaCompatible, false);
});

test('quiz catalog applies only the exact quiz ledger location before actual ranking', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }, { getGraph: () => graph });
  const catalog = prepareQuizCatalog([alpha], { ...env, now: NOW });
  assert.equal(catalog[0].alexaCompatible, true);
  assert.equal(selectRecommendationResult(state, catalog).recommendations[0].slug, 'alpha-hub');
});

test('quiz catalog suppresses an exact row when confidence is unknown', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:alpha-alexa' ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.id === 'claim:quiz-alpha-alexa' ? { ...row, confidence: 'unknown' } : row),
  };
  const catalog = prepareQuizCatalog([alpha], { enabled: true, graph: altered, market: 'US', now: NOW });
  assert.equal(catalog[0].alexaCompatible, undefined);
});
