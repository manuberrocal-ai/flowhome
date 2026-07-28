import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRIORITY_QUIZ_OPTIONS,
  ECOSYSTEM_QUIZ_OPTIONS,
  BUDGET_QUIZ_OPTIONS,
  selectRecommendations,
  getQuizStepLabel,
  createInitialQuizState,
  isMatterFriendly,
} from '../src/lib/quiz-recommend.ts';

function makeProduct(overrides = {}) {
  return {
    slug: 'p',
    name: 'P',
    brand: 'B',
    price: 30,
    category: 'security-camera',
    catalogActive: true,
    ownerRating: 4.5,
    ownerRatingCount: 100,
    priority: 'standard',
    alexaCompatible: false,
    googleHomeCompatible: false,
    appleHomeKit: false,
    matter: false,
    ...overrides,
  };
}

const sec = (overrides = {}) => makeProduct({ slug: `sec-${Math.random()}`, ...overrides });
const comf = (overrides = {}) => makeProduct({ slug: `comf-${Math.random()}`, category: 'smart-speaker', ...overrides });
const clean = (overrides = {}) => makeProduct({ slug: `clean-${Math.random()}`, category: 'robot-vacuum', ...overrides });

test('priority=security returns only catalog-active security products (filter is strict)', () => {
  const products = [
    sec({ slug: 'cam-a' }),
    sec({ slug: 'lock-b' }),
    comf({ slug: 'spk' }),
    clean({ slug: 'rv' }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'open', budget: 'open' }, products);
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.slug === 'cam-a' || p.slug === 'lock-b'));
});

test('ecosystem=alexa filters by alexaCompatible when there are >=2 matching', () => {
  const products = [
    comf({ slug: 'alexa-good-1', alexaCompatible: true }),
    comf({ slug: 'alexa-good-2', alexaCompatible: true }),
    comf({ slug: 'alexa-bad', alexaCompatible: false }),
  ];
  const result = selectRecommendations({ priority: 'comfort', ecosystem: 'alexa', budget: 'open' }, products);
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.alexaCompatible));
});

test('budget=under150 filters by price when there are >=2 matching (no relaxation triggered)', () => {
  const products = [
    clean({ slug: 'cheap-1', price: 40 }),
    clean({ slug: 'cheap-2', price: 60 }),
    clean({ slug: 'pricy', price: 200 }),
  ];
  const result = selectRecommendations({ priority: 'cleaning', ecosystem: 'open', budget: 'under150' }, products);
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.price <= 150));
});

test('budget=under50 keeps only price <= 50 when there are >=2 matching', () => {
  const products = [
    clean({ slug: 'cheap-a', price: 40 }),
    clean({ slug: 'cheap-b', price: 49 }),
    clean({ slug: 'mid', price: 80 }),
  ];
  const result = selectRecommendations({ priority: 'cleaning', ecosystem: 'open', budget: 'under50' }, products);
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.price <= 50));
});

test('relaxes budget when strict results are thin and never relaxes category', () => {
  const products = [
    sec({ slug: 'apple-expensive', price: 200, appleHomeKit: true }),
    sec({ slug: 'apple-cheap', price: 40, appleHomeKit: true }),
    comf({ slug: 'irrelevant' }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'apple', budget: 'under50' }, products, 6);
  assert.ok(result.length >= 2, `expected >=2, got ${result.length}`);
  assert.deepEqual(result.map((p) => p.slug).sort(), ['apple-cheap', 'apple-expensive']);
});

test('relaxes ecosystem after budget when still thin', () => {
  const products = [
    sec({ slug: 'non-ecosystem-1', price: 200, alexaCompatible: false, googleHomeCompatible: false, appleHomeKit: false }),
    sec({ slug: 'non-ecosystem-2', price: 200, alexaCompatible: false, googleHomeCompatible: false, appleHomeKit: false }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'google', budget: 'under50' }, products);
  assert.ok(result.length >= 2, `expected >=2, got ${result.length}`);
  assert.ok(result.every((p) => p.slug.startsWith('non-ecosystem-')));
});

test('never relaxes category priority even when only one product in category matches', () => {
  const products = [
    sec({ slug: 'only-one', price: 300, alexaCompatible: false, googleHomeCompatible: false, appleHomeKit: false }),
    comf({ slug: 'comfy-1' }),
    comf({ slug: 'comfy-2' }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'google', budget: 'under50' }, products);
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, 'only-one');
});

test('hero priority ranks ahead of standard with similar rating', () => {
  const products = [
    sec({ slug: 'standard-H-ratings', ownerRating: 4.8, ownerRatingCount: 1000, priority: 'standard' }),
    sec({ slug: 'hero-lower-ratings', ownerRating: 4.7, ownerRatingCount: 1000, priority: 'hero' }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'open', budget: 'open' }, products);
  assert.equal(result[0].slug, 'hero-lower-ratings');
});

test('QUIZ_OPTIONS sizes are correct (3 priorities, 4 ecosystems, 3 budgets)', () => {
  assert.equal(PRIORITY_QUIZ_OPTIONS.length, 3);
  assert.equal(ECOSYSTEM_QUIZ_OPTIONS.length, 4);
  assert.equal(BUDGET_QUIZ_OPTIONS.length, 3);
});

test('every option has id + heading + description (no HTML anywhere)', () => {
  for (const group of [PRIORITY_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS]) {
    for (const opt of group) {
      assert.equal(typeof opt.id, 'string');
      assert.equal(typeof opt.heading, 'string');
      assert.equal(typeof opt.description, 'string');
      assert.ok(!/<|>/.test(opt.heading), 'heading must not contain HTML');
      assert.ok(!/<|>/.test(opt.description), 'description must not contain HTML');
    }
  }
});

test('getQuizStepLabel returns empty for unknown step and text for known steps', () => {
  assert.equal(getQuizStepLabel(0), '');
  assert.equal(getQuizStepLabel(99), '');
  assert.equal(typeof getQuizStepLabel(1), 'string');
  assert.equal(typeof getQuizStepLabel(2), 'string');
  assert.equal(typeof getQuizStepLabel(3), 'string');
});

test('createInitialQuizState starts blank', () => {
  assert.deepEqual(createInitialQuizState(), { priority: '', ecosystem: '', budget: '' });
});

test('catalogActive=false products are never returned even when priority matches', () => {
  const products = [
    sec({ slug: 'active', catalogActive: true }),
    sec({ slug: 'inactive-1', catalogActive: false }),
    sec({ slug: 'inactive-2', catalogActive: false }),
  ];
  const result = selectRecommendations({ priority: 'security', ecosystem: 'open', budget: 'open' }, products);
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, 'active');
});

test('limit caps the number of returned recommendations', () => {
  const products = Array.from({ length: 10 }, (_, i) => sec({ slug: `s${i}`, ownerRating: 4 + i / 10, ownerRatingCount: 500 + i }));
  const a = selectRecommendations({ priority: 'security', ecosystem: 'open', budget: 'open' }, products, 3);
  assert.equal(a.length, 3);
  const b = selectRecommendations({ priority: 'security', ecosystem: 'open', budget: 'open' }, products, 6);
  assert.equal(b.length, 6);
});

test('isMatterFriendly flags matter-enabled products', () => {
  assert.equal(isMatterFriendly(makeProduct({ matter: true })), true);
  assert.equal(isMatterFriendly(makeProduct({ matter: false })), false);
});

test('PRIORITY_QUIZ_OPTIONS categories do not overlap across priorities', () => {
  const seen = new Set();
  for (const opt of PRIORITY_QUIZ_OPTIONS) {
    for (const cat of opt.categories) {
      assert.ok(!seen.has(cat), `category ${cat} listed twice across priorities`);
      seen.add(cat);
    }
  }
});

