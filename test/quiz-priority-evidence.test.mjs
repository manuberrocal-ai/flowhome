import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { selectRecommendationResult, getRecommendationReasons, getExtraPriorityNotice, parseQuizState, serializeQuizState, EXTRA_PRIORITY_QUIZ_OPTIONS } from '../src/lib/quiz-recommend.ts';

const NOW = new Date('2026-09-05T16:00:00Z');
const state = { goal: 'security', ecosystem: 'open', budget: 'open', installation: 'advanced', extra: 'open' };
const base = { model: 'Synthetic fixture', category: 'security-camera', catalogActive: true, installation: { model: 'Synthetic fixture', market: 'US', assessment: 'advanced', requirements: ['Synthetic requirement, not catalog evidence.'], sources: [{ label: 'Synthetic source', url: 'https://example.com/setup', accessedAt: '2026-09-03' }] } };
const slugs = result => result.recommendations.map(p => p.slug);
const select = (answers, products) => selectRecommendationResult(answers, products, 4, NOW);

for (const [extra, flags] of [
  ['privacy', { hasSubscriptionRequired: true, subscriptionRequired: false }],
  ['local-control', { matter: true, zigbee: true }],
  ['ease-of-use', { wifi: true, appControl: true }],
]) {
  test(`${extra}: unsupported catalog signals cannot boost ranking`, () => {
    const products = [{ ...base, slug: 'a-unassessed' }, { ...base, slug: 'z-flagged', ...flags }];
    assert.deepEqual(slugs(select({ ...state, extra }, products)), slugs(select(state, products)));
  });
}

test('each unassessed preference stays explicit for absent, false, true and malformed fields', () => {
  for (const extra of ['privacy', 'local-control', 'ease-of-use']) {
    const option = EXTRA_PRIORITY_QUIZ_OPTIONS.find(o => o.id === extra);
    assert.match(option.description, /does not rank/);
    for (const value of [undefined, null, false, true, 'true', 1]) {
      const product = { ...base, slug: 'test', subscriptionRequired: value, hasSubscriptionRequired: value, matter: value, zigbee: value, wifi: value, appControl: value };
      const reasons = getRecommendationReasons(product, { ...state, extra }, undefined, NOW).join(' ');
      assert.match(getExtraPriorityNotice(extra), /not (assessed|verified)/);
      assert.match(getExtraPriorityNotice(extra), /does not change the order/);
      assert.doesNotMatch(reasons, /Catalog lists no subscription required|supports your local-control preference|Catalog lists app or Wi-Fi control/);
    }
  }
  assert.equal(getExtraPriorityNotice('open'), '');
  assert.equal(getExtraPriorityNotice('best-value'), '');
  assert.equal(getExtraPriorityNotice(''), '');
});

test('legacy URLs keep unassessed priorities without inventing a replacement choice', () => {
  for (const extra of ['privacy', 'local-control', 'ease-of-use']) {
    const answers = { ...state, extra };
    assert.deepEqual(parseQuizState(serializeQuizState(answers)), answers);
  }
});

test('real catalog selection and relaxation stay identical to no extra priority in 675 combinations', () => {
  const root = new URL('../src/content/products/', import.meta.url);
  const products = readdirSync(root).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, root), 'utf8')));
  assert.equal(products.length, 28);
  let comparisons = 0;
  for (const goal of ['security', 'comfort', 'cleaning', 'energy', 'entertainment']) {
    for (const ecosystem of ['open', 'alexa', 'google', 'apple', 'smartthings']) {
      for (const budget of ['open', 'under50', 'under150']) {
        for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
          const answers = { goal, ecosystem, budget, installation, extra: 'open' };
          const expected = select(answers, products);
          for (const extra of ['privacy', 'local-control', 'ease-of-use']) {
            const result = select({ ...answers, extra }, products);
            assert.deepEqual(slugs(result), slugs(expected), JSON.stringify({ ...answers, extra }));
            assert.deepEqual(result.relaxedFilters, expected.relaxedFilters);
            assert.equal(result.limitedCatalog, expected.limitedCatalog);
            assert.match(getExtraPriorityNotice(extra), /not (assessed|verified)/);
            comparisons++;
          }
        }
      }
    }
  }
  assert.equal(comparisons, 675);
});

test('quiz payload drops unsupported subscription provenance and unused ease flags', () => {
  const source = readFileSync(new URL('../src/pages/quiz.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /hasSubscriptionRequired|subscriptionRequired|appControl|\bwifi:/);
});
