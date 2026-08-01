import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GOAL_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS, INSTALLATION_QUIZ_OPTIONS, EXTRA_PRIORITY_QUIZ_OPTIONS,
  createInitialQuizState, parseQuizState, serializeQuizState, selectRecommendations, selectRecommendationResult, getRecommendationReasons,
} from '../src/lib/quiz-recommend.ts';

const state = { goal: 'security', ecosystem: 'alexa', budget: 'under50', installation: 'advanced', extra: 'open' };
function product(overrides = {}) { return { slug: 'p', category: 'security-camera', catalogActive: true, price: 40, ownerRating: 4.5, ownerRatingCount: 100, alexaCompatible: true, ...overrides }; }

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

test('relaxes budget, then installation, then ecosystem in order', () => {
  const products = [product({ slug: 'one', price: 200 }), product({ slug: 'two', category: 'smart-lock', price: 200 }), product({ slug: 'three', category: 'motion-sensor', price: 200, alexaCompatible: false })];
  const result = selectRecommendationResult(state, products);
  assert.deepEqual(result.relaxedFilters, ['budget']);
  assert.equal(result.recommendations.length, 2);
  const fullRelax = selectRecommendationResult(state, [product({ slug: 'only', category: 'smart-lock', price: 200, alexaCompatible: false }), product({ slug: 'other', category: 'motion-sensor', price: 200, alexaCompatible: false })]);
  assert.deepEqual(fullRelax.relaxedFilters, ['budget', 'installation', 'ecosystem']);
});

test('ranking is deterministic and explanations only use backed signals', () => {
  const candidates = [product({ slug: 'z', ownerRating: 4, ownerRatingCount: 10 }), product({ slug: 'a', ownerRating: 4, ownerRatingCount: 10 })];
  assert.deepEqual(selectRecommendations({ ...state, budget: 'open' }, candidates).map((item) => item.slug), ['a', 'z']);
  const smartThings = { ...state, ecosystem: 'smartthings', extra: 'privacy' };
  const candidate = product({ matter: true, hasSubscriptionRequired: true, subscriptionRequired: false });
  const reasons = getRecommendationReasons(candidate, smartThings, { relaxedFilters: [] });
  assert.ok(reasons.some((reason) => /candidate.*verify/i.test(reason)));
  assert.ok(reasons.some((reason) => /no subscription/i.test(reason)));
  assert.ok(!getRecommendationReasons(product({ subscriptionRequired: false, hasSubscriptionRequired: false }), smartThings).some((reason) => /subscription/i.test(reason)));
});
