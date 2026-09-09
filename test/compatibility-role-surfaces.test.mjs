import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
import { getEcosystemFeatures } from '../src/lib/product-specs.ts';
import { getFeatureEvidenceLabel } from '../src/lib/product-feature-evidence.ts';
import { buildComparisonInsights, getComparisonFeatureLabel } from '../src/lib/comparison-insights.ts';
import { prepareQuizCatalog, getQuizCompatibilitySignals, selectRecommendationResult } from '../src/lib/quiz-recommend.ts';

const slug = 'aeotec-smartthings-hub';
const env = { enabled: true, graph: documentaryCandidateProvider.getGraph(), market: 'US', now: '2026-09-07T00:00:00Z' };
const fields = [['thread', 'Thread role / integration'], ['smartthingsIntegration', 'SmartThings role / integration']];

test('Thread and SmartThings roles carry exact conditions into profile, table and alternative reasons', () => {
  for (const surface of ['product', 'comparison', 'alternatives']) {
    const product = applyVerifiedCompatibility({ slug, category: 'smart-hub' }, slug, { ...env, visibleLocation: `${surface}:${slug}:compatibility` });
    const insights = buildComparisonInsights([product]);
    for (const [field, label] of fields) {
      const expected = `Evidence-backed signal: ${product.compatibilityConditions[field]}`;
      assert.equal(product[field], true);
      assert.equal(getEcosystemFeatures(product).find(row => row.label === label).value, expected);
      assert.equal(getComparisonFeatureLabel(product, field), expected);
      assert.ok(insights.buyerFits[0].reasons.includes(`${label}: ${expected}`));
    }
    assert.ok(insights.ecosystemLeaders.every(row => !/Thread|SmartThings/.test(row.platform)));
  }
});

test('quiz role metadata survives serialization without forcing hubs into an accessory shortlist', () => {
  const prepared = JSON.parse(JSON.stringify(prepareQuizCatalog([{ slug, category: 'smart-hub', catalogActive: true }], env)))[0];
  for (const [field, label] of fields) assert.ok(getQuizCompatibilitySignals(prepared).find(row => row.label === label).value.includes(prepared.compatibilityConditions[field]));
  const state = { goal: 'security', ecosystem: 'smartthings', budget: 'open', installation: 'advanced', extra: 'open' };
  const camera = { slug: 'camera-fixture', category: 'security-camera', catalogActive: true };
  const result = selectRecommendationResult(state, [prepared, camera]);
  assert.deepEqual(result.recommendations.map(product => product.slug), ['camera-fixture']);
  assert.equal(result.ecosystemEvidenceUnavailable, true);
});

test('role labels require their own positive evidence and nonempty conditions', () => {
  for (const [field] of fields) {
    for (const conditions of [undefined, '', ' ', {}, 12, false]) {
      assert.equal(getFeatureEvidenceLabel({ [field]: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { [field]: 'Fixture' }, compatibilityConditions: { [field]: conditions } }, field), 'Not verified');
    }
    for (const value of [undefined, false, 'true']) {
      assert.equal(getFeatureEvidenceLabel({ [field]: value, compatibilityVerificationEnabled: true, compatibilityProvenance: { [field]: 'Fixture' }, compatibilityConditions: { [field]: 'Specific role conditions' } }, field), 'Not verified');
    }
  }
});

test('wrong-location, expired and absent role evidence cannot retain stale prepared labels', () => {
  for (const override of [{ visibleLocation: 'product:other:compatibility' }, { now: '2026-11-01T00:00:00Z' }]) {
    const product = applyVerifiedCompatibility({ thread: true, smartthingsIntegration: true }, slug, { ...env, ...override });
    for (const [field] of fields) {
      assert.equal(product.compatibilityConditions[field], null);
      assert.equal(getFeatureEvidenceLabel(product, field), 'Not verified');
    }
  }
  const product = applyVerifiedCompatibility({}, slug, { ...env, graph: null });
  for (const [field] of fields) assert.equal(getFeatureEvidenceLabel(product, field), 'Not verified');
});
