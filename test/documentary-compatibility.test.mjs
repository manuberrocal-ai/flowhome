import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider, DOCUMENTARY_CANDIDATE_STATUS } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
import { prepareQuizCatalog } from '../src/lib/quiz-recommend.ts';
import { getQuizCompatibilitySignals } from '../src/lib/quiz-recommend.ts';
import { getEcosystemFeatures } from '../src/lib/product-specs.ts';
import { buildComparisonInsights, getComparisonFeatureLabel } from '../src/lib/comparison-insights.ts';
import { getFeatureEvidenceLabel } from '../src/lib/product-feature-evidence.ts';

const now = '2026-09-07T00:00:00Z';
const slug = 'tapo-c120-security-camera';

test('qualified documentary claims survive adaptation on all four exact surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const fields = { alexaCompatible: 'alexa', googleHomeCompatible: 'google', wifi: 'wifi' };
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { enabled: true, graph, market: 'US', now, visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const product = applyVerifiedCompatibility({ slug }, slug, env);
    for (const [field, key] of Object.entries(fields)) {
      assert.equal(product.compatibilityConditions[field], flags[key].reason);
      assert.ok(product.compatibilityConditions[field].length > 40);
    }
    assert.equal(product.compatibilityConditions.matter, null);
  }
});

test('quiz preparation preserves qualified claims through the JSON client boundary', () => {
  const products = prepareQuizCatalog([{ slug, category: 'security-camera' }], {
    enabled: true, graph: documentaryCandidateProvider.getGraph(), market: 'US', now,
  });
  const clientProduct = JSON.parse(JSON.stringify(products))[0];
  assert.match(clientProduct.compatibilityConditions.googleHomeCompatible, /does not establish every Google Home app or automation feature/);
  assert.match(clientProduct.compatibilityConditions.alexaCompatible, /supported Alexa devices/);
  assert.ok(getQuizCompatibilitySignals(clientProduct).find(row => row.label === 'Google Home').value.includes(clientProduct.compatibilityConditions.googleHomeCompatible));
});

test('profile, comparison and alternative wording retain the exact qualified claim', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'comparison', 'alternatives']) {
    const product = applyVerifiedCompatibility({ slug, name: 'Tapo C120', category: 'security-camera' }, slug, {
      enabled: true, graph, market: 'US', now, visibleLocation: `${surface}:${slug}:compatibility`,
    });
    const claim = product.compatibilityConditions.googleHomeCompatible;
    assert.ok(getEcosystemFeatures(product).find(row => row.label === 'Google Home').value.includes(claim));
    assert.ok(getComparisonFeatureLabel(product, 'googleHomeCompatible').includes(claim));
    const insights = buildComparisonInsights([product]);
    assert.ok(insights.buyerFits[0].reasons.some(reason => reason.includes(claim)));
    assert.ok(insights.ecosystemLeaders.some(leader => leader.reason.includes(claim)));
  }
});

test('condition text alone cannot certify a field and malformed conditions are not stringified', () => {
  const base = { alexaCompatible: true, compatibilityVerificationEnabled: true, compatibilityConditions: { alexaCompatible: 'Unsupported claim' } };
  assert.equal(getFeatureEvidenceLabel(base, 'alexaCompatible'), 'Not verified');
  for (const value of [null, {}, [], 12, true, '', ' ']) {
    assert.equal(getFeatureEvidenceLabel({ ...base, compatibilityProvenance: { alexaCompatible: 'Test source' }, compatibilityConditions: { alexaCompatible: value } }, 'alexaCompatible'), 'Not verified');
  }
});

test('unavailable evidence clears stale or injected conditions instead of retaining them', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const product = { slug, compatibilityConditions: { alexaCompatible: 'Stale unrestricted compatibility' } };
  const base = { enabled: true, graph, market: 'US', now, visibleLocation: `product:${slug}:compatibility` };
  for (const override of [{ enabled: false }, { graph: null }]) {
    assert.deepEqual(applyVerifiedCompatibility(product, slug, { ...base, ...override }).compatibilityConditions, {});
  }
  for (const override of [{ market: 'CA' }, { now: DOCUMENTARY_CANDIDATE_STATUS.reviewDueAt }, { visibleLocation: 'product:other:compatibility' }]) {
    assert.equal(applyVerifiedCompatibility(product, slug, { ...base, ...override }).compatibilityConditions.alexaCompatible, null);
  }
});

test('documentary source remains opt-in and default public runtime stays empty', () => {
  assert.equal(getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }).graph, null);
  assert.equal(getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'false' }, documentaryCandidateProvider).graph, null);
  assert.equal(DOCUMENTARY_CANDIDATE_STATUS.publicActivation, 'not_approved');
});

test('explicit review injection resolves only the three documentary model claims on exact surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  assert.equal(graph.nodes.length, 37);
  assert.equal(graph.edges.length, 115);
  assert.equal(graph.ledger.length, 460);
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, { enabled: true, market: 'US', now, visibleLocation: `${surface}:${slug}:compatibility` });
    for (const key of ['alexa', 'google', 'wifi']) {
      assert.equal(flags[key].verified, true);
      assert.equal(flags[key].level, 'research-verified');
      assert.ok(flags[key].reason.includes('C120'));
    }
    for (const key of ['apple', 'matter', 'thread', 'zigbee', 'bluetooth', 'smartthings']) assert.equal(flags[key].verified, false);
    assert.deepEqual(flags.substitutes, []);
  }
  assert.equal(graph.nodes[0].marketplaceId, null, 'manufacturer page does not verify the seller ASIN');
});

test('expired, wrong-market and wrong-model queries stay unknown; provider reads are isolated', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const options = { enabled: true, market: 'US', now, visibleLocation: `product:${slug}:compatibility` };
  for (const changed of [{ market: 'CA' }, { now: DOCUMENTARY_CANDIDATE_STATUS.reviewDueAt }, { visibleLocation: 'product:other:compatibility' }]) {
    assert.equal(getVerifiedFlags(graph, slug, { ...options, ...changed }).alexa.verified, false);
  }
  assert.equal(getVerifiedFlags(graph, 'tapo-c125-security-camera', options).alexa.verified, false);
  graph.edges[0].status = 'suppressed';
  assert.equal(documentaryCandidateProvider.getGraph().edges[0].status, 'active');
});
