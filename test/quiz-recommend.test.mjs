import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GOAL_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS, INSTALLATION_QUIZ_OPTIONS, EXTRA_PRIORITY_QUIZ_OPTIONS,
  createInitialQuizState, parseQuizState, serializeQuizState, selectRecommendations as selectAt, selectRecommendationResult as selectResultAt, getRecommendationReasons as reasonsAt,
} from '../src/lib/quiz-recommend.ts';

const NOW = new Date('2026-09-04T12:00:00Z');
const selectRecommendations = (state, products, limit) => selectAt(state, products, limit, NOW);
const selectRecommendationResult = (state, products, limit) => selectResultAt(state, products, limit, NOW);
const getRecommendationReasons = (product, state, result) => reasonsAt(product, state, result, NOW);
const state = { goal: 'security', ecosystem: 'alexa', budget: 'under50', installation: 'advanced', extra: 'open' };

test('legacy priority never changes quiz order or claims ease of use', () => {
  const open = { ...state, budget: 'open', extra: 'ease-of-use' };
  const products = [product({ slug: 'z', priority: 'hero', priorityScore: 999, roiApproved: true }), product({ slug: 'a', priority: 'rejected' })];
  assert.deepEqual(selectRecommendations(open, products).map((p) => p.slug), ['a', 'z']);
  assert.doesNotMatch(getRecommendationReasons(products[0], open).join(' '), /priority|ease of use|setup difficulty/);
  assert.doesNotMatch(getRecommendationReasons(product({ wifi: true }), open).join(' '), /ease of use|Catalog lists app or Wi-Fi/);
});
function product(overrides = {}) { return {
  model: 'Synthetic camera',
  installation: { model: 'Synthetic camera', market: 'US', assessment: 'advanced', requirements: ['Synthetic installation fixture.'], sources: [{ label: 'Synthetic source, not catalog evidence', url: 'https://example.com/installation', accessedAt: '2026-09-03' }] },
  slug: 'p', category: 'security-camera', catalogActive: true, price: 40, ownerRating: 4.5, ownerRatingCount: 100, alexaCompatible: true,
  compatibilityVerificationEnabled: true, compatibilityProvenance: { alexaCompatible: 'Synthetic prepared source, not catalog evidence' },
  compatibilityConditions: { alexaCompatible: 'Synthetic scoped function, not catalog evidence' },
  asin: 'B012345678', affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20', priceSource: 'amazon-creators-api',
  priceLastChecked: '2026-09-04T11:00:00Z', ratingSource: 'amazon-creators-api', ratingLastChecked: '2026-09-04T11:00:00Z', ...overrides,
}; }

test('option counts are 5/5/3/3/5 and option copy has no HTML', () => {
  assert.deepEqual([GOAL_QUIZ_OPTIONS.length, ECOSYSTEM_QUIZ_OPTIONS.length, BUDGET_QUIZ_OPTIONS.length, INSTALLATION_QUIZ_OPTIONS.length, EXTRA_PRIORITY_QUIZ_OPTIONS.length], [5, 5, 3, 3, 5]);
  for (const group of [GOAL_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS, INSTALLATION_QUIZ_OPTIONS, EXTRA_PRIORITY_QUIZ_OPTIONS]) for (const option of group) assert.ok(!/[<>]/.test(`${option.heading}${option.description}`));
});

test('state URL parsing and serialization whitelist values', () => {
  assert.deepEqual(createInitialQuizState(), { goal: '', ecosystem: '', budget: '', installation: '', extra: '' });
  assert.deepEqual(parseQuizState('goal=security&ecosystem=alexa&budget=under50&installation=advanced&extra=open&bad=x'), state);
  assert.deepEqual(parseQuizState('goal=nope&ecosystem=alexa&budget=wrong'), { goal: '', ecosystem: 'alexa', budget: '', installation: '', extra: '' });
  assert.equal(serializeQuizState({ ...state, goal: 'nope' }), 'ecosystem=alexa&budget=under50&installation=advanced&extra=open');
});

test('returns two to four at most and keeps goal category strict', () => {
  const products = [product({ slug: 'a' }), product({ slug: 'b', category: 'smart-lock' }), product({ slug: 'c', category: 'smart-speaker' }), product({ slug: 'inactive', catalogActive: false })];
  const result = selectRecommendations(state, products, 99);
  assert.equal(result.length, 2);
  assert.ok(result.every((item) => ['security-camera', 'smart-lock'].includes(item.category)));
});

test('keeps ecosystem and budget filters when each has at least two matches', () => {
  const products = [product({ slug: 'one' }), product({ slug: 'two', category: 'smart-lock', price: 49 }), product({ slug: 'wrong-ecosystem', alexaCompatible: false }), product({ slug: 'too-expensive', price: 200 })];
  const result = selectRecommendationResult(state, products);
  assert.deepEqual(result.relaxedFilters, []);
  assert.ok(result.recommendations.every((item) => item.alexaCompatible && item.price <= 50));
});

test('relaxes constrained preferences while separating unavailable ecosystem evidence', () => {
  const products = [product({ slug: 'one', price: 200 }), product({ slug: 'two', category: 'smart-lock', price: 200 }), product({ slug: 'three', category: 'motion-sensor', price: 200, alexaCompatible: false })];
  const result = selectRecommendationResult(state, products);
  assert.deepEqual(result.relaxedFilters, ['budget']);
  assert.equal(result.recommendations.length, 2);
  const fullRelax = selectRecommendationResult(state, [product({ slug: 'only', category: 'smart-lock', price: 200, alexaCompatible: false }), product({ slug: 'other', category: 'motion-sensor', price: 200, alexaCompatible: false })]);
  assert.deepEqual(fullRelax.relaxedFilters, ['budget']);
  assert.equal(fullRelax.ecosystemEvidenceUnavailable, true);
});

test('ranking is deterministic and explanations only use backed signals', () => {
  const candidates = [product({ slug: 'z', ownerRating: 4, ownerRatingCount: 10 }), product({ slug: 'a', ownerRating: 4, ownerRatingCount: 10 })];
  assert.deepEqual(selectRecommendations({ ...state, budget: 'open' }, candidates).map((item) => item.slug), ['a', 'z']);
  const smartThings = { ...state, ecosystem: 'smartthings', extra: 'privacy' };
  const candidate = product({ matter: true, hasSubscriptionRequired: true, subscriptionRequired: false });
  const reasons = getRecommendationReasons(candidate, smartThings, { relaxedFilters: [] });
  assert.ok(reasons.some((reason) => /compatibility is not verified/i.test(reason)));
  assert.ok(!reasons.some((reason) => /no subscription/i.test(reason)));
  assert.ok(!getRecommendationReasons(product({ subscriptionRequired: false, hasSubscriptionRequired: false }), smartThings).some((reason) => /subscription/i.test(reason)));
});

test('manual or stale price and ratings cannot alter ranking or claim a budget match', () => {
  for (const overrides of [{ priceSource: 'manual', ratingSource: 'Amazon customer ratings' }, { priceLastChecked: '2026-09-03T11:00:00Z', ratingLastChecked: '2026-09-03T11:00:00Z' }]) {
    const products = [
      product({ slug: 'z-fake-cheap-high-rating', price: 1, ownerRating: 5, ownerRatingCount: 9_000_000, ...overrides }),
      product({ slug: 'a-category-match', price: 1_000, ownerRating: 1, ownerRatingCount: 1, ...overrides }),
    ];
    const result = selectRecommendationResult({ ...state, extra: 'best-value' }, products);
    assert.deepEqual(result.recommendations.map((product) => product.slug), ['a-category-match', 'z-fake-cheap-high-rating']);
    assert.deepEqual(result.relaxedFilters, ['budget']);
    const reasons = getRecommendationReasons(products[0], { ...state, extra: 'best-value' }, result).join(' ');
    assert.match(reasons, /budget match is not verified/);
    assert.match(reasons, /Value ranking is not verified/);
    assert.doesNotMatch(reasons, /fits your selected budget|support the value ranking/);
  }
});

test('the same quiz payload loses commercial ranking eligibility after its 24-hour boundary', () => {
  const products = [product({ slug: 'z', ownerRating: 5 }), product({ slug: 'a', ownerRating: 1 })];
  const open = { ...state, budget: 'open' };
  assert.deepEqual(selectAt(open, products, 4, NOW).map((product) => product.slug), ['z', 'a']);
  assert.deepEqual(selectAt(open, products, 4, new Date('2026-09-05T11:00:00Z')).map((product) => product.slug), ['a', 'z']);
});
