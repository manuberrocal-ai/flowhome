import test from 'node:test';

test('source-only metadata cannot produce comparison evidence leaders or buyer reasons', () => {
  for (const condition of [undefined, null, '', ' ', 12, {}]) {
    const result = buildComparisonInsights([{ slug: 'source-only', matter: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { matter: 'Source alone' }, compatibilityConditions: { matter: condition } }]);
    assert.equal(result.ecosystemLeaders.length, 0);
    assert.doesNotMatch(JSON.stringify(result.buyerFits), /evidence-backed signal/);
  }
});
import assert from 'node:assert/strict';
import { buildComparisonInsights, getComparisonFeatureLabel } from '../src/lib/comparison-insights.ts';

const NOW = new Date('2026-09-04T12:00:00Z');
const observation = { asin: 'B012345678', affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20', priceSource: 'amazon-creators-api', priceLastChecked: '2026-09-04T11:00:00Z', ratingSource: 'amazon-creators-api', ratingLastChecked: '2026-09-04T11:00:00Z' };

const products = [
  { ...observation, slug: 'alpha', name: 'Alpha', category: 'smart-hub', price: 80, matter: true, alexaCompatible: true, ownerRating: 4.5, ownerRatingCount: 100 },
  { ...observation, slug: 'beta', name: 'Beta', category: 'smart-hub', price: 120, googleHomeCompatible: true, ownerRating: 4.2, ownerRatingCount: 80 },
];

test('insights are deterministic and never assign a universal winner or value', async () => {
  const first = buildComparisonInsights(products, NOW);
  assert.deepEqual(first, buildComparisonInsights(products, NOW));
  assert.match(first.finalRecommendation, /not assigned.*evidence is insufficient/i);
  assert.ok(!first.tradeoffs.some((item) => /best value|winner/i.test(item)));
});

test('reports catalog signals without ecosystem leaders and labels price as snapshot', async () => {
  const result = buildComparisonInsights(products, NOW);
  assert.deepEqual(result.ecosystemLeaders, [], 'Raw catalog flags cannot establish an ecosystem leader');
  assert.match(result.tradeoffs.join(' '), /unverified catalog signal/);
  assert.match(result.tradeoffs.join(' '), /price snapshots/i);
  assert.doesNotMatch(result.tradeoffs.join(' '), /best value/i);
});

test('raw compatibility records never become verified buyer fit or exclusivity', () => {
  const result = buildComparisonInsights(products, NOW);
  assert.doesNotMatch(JSON.stringify(result), /only option marked compatible|marked compatible with/i);
  assert.match(result.buyerFits[0].reasons.join(' '), /unverified catalog signal/);
  assert.match(result.evidenceLimits.join(' '), /does not establish incompatibility/);
});

test('comparison cells distinguish raw, absent and field-specific evidence', () => {
  for (const field of ['matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'energyMonitoring']) {
    assert.equal(getComparisonFeatureLabel({ [field]: true }, field), 'Catalog: Yes (unverified)');
    assert.equal(getComparisonFeatureLabel({ [field]: false }, field), 'Catalog: No (unverified)');
    for (const value of [undefined, null, 0, 1, 'true', 'false', {}]) assert.equal(getComparisonFeatureLabel({ [field]: value }, field), 'Not verified');
  }
  const prepared = { matter: true, alexaCompatible: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { matter: 'Model-specific source', alexaCompatible: null }, compatibilityConditions: { matter: 'Model-specific function' } };
  assert.match(getComparisonFeatureLabel(prepared, 'matter'), /Evidence-backed signal/);
  assert.equal(getComparisonFeatureLabel(prepared, 'alexaCompatible'), 'Not verified');
  assert.equal(getComparisonFeatureLabel({ ...prepared, matter: undefined }, 'matter'), 'Not verified');
  assert.equal(getComparisonFeatureLabel({ ...prepared, compatibilityProvenance: { matter: ' ' } }, 'matter'), 'Not verified');
  assert.equal(getComparisonFeatureLabel({ ...prepared, energyMonitoring: true }, 'energyMonitoring'), 'Catalog: Yes (unverified)');
});

test('evidence summaries never infer exclusivity of real-world support', () => {
  const result = buildComparisonInsights([{ slug: 'documented', matter: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { matter: 'Scoped source' }, compatibilityConditions: { matter: 'Scoped function' } }, { slug: 'unknown' }]);
  assert.equal(result.ecosystemLeaders.length, 1);
  assert.match(result.ecosystemLeaders[0].reason, /Scoped source/);
  assert.doesNotMatch(result.ecosystemLeaders[0].reason, /only|best|winner/i);
});

test('missing data and category mismatch become evidence limits or tradeoffs', async () => {
  const result = buildComparisonInsights([{ slug: 'one', category: 'smart-speaker' }, { slug: 'two', category: 'smart-display' }]);
  assert.match(result.tradeoffs.join(' '), /Category mismatch disclosed/);
  assert.ok(result.evidenceLimits.length >= 2);
});

test('manual or stale commerce never appears in comparison prose', () => {
  for (const overrides of [{ priceSource: 'manual', ratingSource: 'manual' }, { priceLastChecked: '2026-09-03T11:00:00Z', ratingLastChecked: '2026-09-03T11:00:00Z' }]) {
    const result = buildComparisonInsights(products.map((product) => ({ ...product, ...overrides })), NOW);
    const prose = JSON.stringify(result);
    assert.doesNotMatch(prose, /\$80|\$120|4\.5\/5|4\.2\/5|from 100 ratings/);
    assert.match(prose, /Check price on Amazon/);
  }
});
