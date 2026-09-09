import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { selectRecommendationResult, getRecommendationReasons, prepareQuizCatalog, isMatterFriendly, getQuizCompatibilitySignals, getQuizEcosystemNotice, selectVerifiedRecommendationResult } from '../src/lib/quiz-recommend.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const NOW = new Date('2026-09-05T12:00:00Z');
const state = { goal: 'security', ecosystem: 'alexa', budget: 'under50', installation: 'plug-and-play', extra: 'open' };
const product = (slug, overrides = {}) => ({ slug, category: 'security-camera', catalogActive: true, model: 'Synthetic model',
  installation: { model: 'Synthetic model', market: 'US', assessment: 'plug-and-play', requirements: ['Synthetic setup fixture.'], sources: [{ label: 'Synthetic fixture', url: 'https://example.com/setup', accessedAt: '2026-09-04' }] },
  price: 40, priceSource: 'amazon-creators-api', priceLastChecked: '2026-09-05T11:00:00Z', asin: 'B012345678', affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20', ...overrides });
const select = (products, answers = state) => selectRecommendationResult(answers, products, 4, NOW);
const backed = { alexaCompatible: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { alexaCompatible: 'Synthetic prepared source' }, compatibilityConditions: { alexaCompatible: 'Synthetic scoped function' } };

test('raw, missing and malformed flags do not discard valid budget and installation matches', () => {
  for (const raw of [true, false, undefined, null, 'true', 1]) {
    const result = select([product('a', { alexaCompatible: raw }), product('b'), product('expensive', { price: 200 }), product('unknown-setup', { installation: undefined })]);
    assert.deepEqual(result.recommendations.map(p => p.slug), ['a', 'b']);
    assert.deepEqual(result.relaxedFilters, []);
    assert.equal(result.ecosystemEvidenceUnavailable, true);
  }
});

test('one backed candidate does not force unrelated filter relaxation and leads peers', () => {
  const result = select([product('a-unknown'), product('z-backed', backed), product('expensive', { ...backed, price: 200, catalogActive: false })]);
  assert.deepEqual(result.recommendations.map(p => p.slug), ['z-backed', 'a-unknown']);
  assert.deepEqual(result.relaxedFilters, []);
  assert.equal(result.ecosystemEvidenceUnavailable, true);
});

test('two backed candidates enable an actual ecosystem filter, excluding raw positives', () => {
  const result = select([product('a-raw', { alexaCompatible: true }), product('b-backed', backed), product('c-backed', backed)]);
  assert.deepEqual(result.recommendations.map(p => p.slug), ['b-backed', 'c-backed']);
  assert.equal(result.ecosystemEvidenceUnavailable, false);
});

test('source-only candidates cannot activate ecosystem filtering or evidence reasons', () => {
  const incomplete = { ...backed, compatibilityConditions: {} };
  const result = select([product('a-unknown'), product('b-source-only', incomplete), product('c-source-only', incomplete)]);
  assert.equal(result.ecosystemEvidenceUnavailable, true);
  assert.deepEqual(result.recommendations.map(p => p.slug), ['a-unknown', 'b-source-only', 'c-source-only']);
  for (const candidate of result.recommendations) assert.doesNotMatch(getRecommendationReasons(candidate, state, result, NOW).join(' '), /evidence-backed signal/);
});

test('Matter or Zigbee, even backed, never establish SmartThings support', () => {
  const result = select([product('a'), product('b', { matter: true, zigbee: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { matter: 'Fixture', zigbee: 'Fixture' } })], { ...state, ecosystem: 'smartthings' });
  assert.equal(result.ecosystemEvidenceUnavailable, true);
  assert.deepEqual(result.relaxedFilters, []);
  for (const candidate of result.recommendations) assert.match(getRecommendationReasons(candidate, { ...state, ecosystem: 'smartthings' }, result, NOW).join(' '), /compatibility is not verified/);
});

test('reasons distinguish prepared evidence from unknown support even without result metadata', () => {
  assert.match(getRecommendationReasons(product('raw', { alexaCompatible: true }), state, undefined, NOW).join(' '), /compatibility is not verified/);
  assert.match(getRecommendationReasons(product('backed', backed), state, undefined, NOW).join(' '), /evidence-backed signal/);
  assert.doesNotMatch(getRecommendationReasons(product('raw', { matter: true }), state, undefined, NOW).join(' '), /Marked as|SmartThings candidate/);
  assert.equal(isMatterFriendly(product('raw', { matter: true })), false);
});

test('quiz serialization preserves exact-surface evidence and rejects product-only and disputed claims', () => {
  const graph = loadBlock9Fixtures();
  const alpha = product('alpha-hub', { alexaCompatible: false });
  for (const [altered, expected] of [[graph, true], [{ ...graph, ledger: graph.ledger.filter(r => r.id !== 'claim:quiz-alpha-alexa') }, false], [{ ...graph, ledger: graph.ledger.map(r => r.id === 'claim:quiz-alpha-alexa' ? { ...r, status: 'disputed' } : r) }, false]]) {
    const prepared = JSON.parse(JSON.stringify(prepareQuizCatalog([alpha], { enabled: true, graph: altered, now: '2026-07-30T12:00:00Z' })))[0];
    const reason = getRecommendationReasons(prepared, state, undefined, NOW).join(' ');
    assert.equal(reason.includes('evidence-backed signal'), expected);
  }
});

test('card signals qualify seven fields including false, absent and malformed values', () => {
  for (const [raw, expected] of [[true, 'Catalog: Yes (unverified)'], [false, 'Catalog: No (unverified)'], [undefined, 'Not verified'], ['true', 'Not verified']]) {
    const rows = getQuizCompatibilitySignals(product('fixture', { matter: raw, zigbee: raw, alexaCompatible: raw, googleHomeCompatible: raw, appleHomeKit: raw, thread: raw, smartthingsIntegration: raw }));
    assert.equal(rows.length, 7);
    assert.ok(rows.every(row => row.value === expected));
  }
  assert.equal(getQuizCompatibilitySignals(product('fixture', backed)).find(row => row.label === 'Alexa').value, 'Evidence-backed signal: Synthetic scoped function');
});

test('notices distinguish no preference, insufficient evidence and unsupported SmartThings inference', () => {
  assert.equal(getQuizEcosystemNotice({ ...state, ecosystem: 'open' }, { ecosystemEvidenceUnavailable: true }), '');
  assert.equal(getQuizEcosystemNotice(state, { ecosystemEvidenceUnavailable: false }), '');
  assert.match(getQuizEcosystemNotice(state, { ecosystemEvidenceUnavailable: true }), /not enough source-backed Alexa evidence/);
  assert.match(getQuizEcosystemNotice({ ...state, ecosystem: 'smartthings' }, { ecosystemEvidenceUnavailable: true }), /Matter or Zigbee alone does not prove support/);
});

test('the verified wrapper also enforces the exact quiz surface', () => {
  const graph = loadBlock9Fixtures();
  const productOnly = { ...graph, ledger: graph.ledger.filter(row => row.id !== 'claim:quiz-alpha-alexa') };
  const result = selectVerifiedRecommendationResult(state, [product('alpha-hub', { alexaCompatible: true })], { enabled: true, graph: productOnly, now: '2026-07-30T12:00:00Z' });
  assert.equal(result.recommendations[0].alexaCompatible, undefined);
});

test('a backed but unsuitable setup never outranks a matching setup when evidence is sparse', () => {
  const result = select([product('a-backed-unknown', { ...backed, installation: undefined }), product('b-setup'), product('c-setup')]);
  assert.deepEqual(result.recommendations.map(p => p.slug), ['b-setup', 'c-setup']);
  assert.deepEqual(result.relaxedFilters, []);
});

test('all 180 real-catalog ecosystem combinations preserve other preferences without a graph', () => {
  const root = new URL('../src/content/products/', import.meta.url);
  const products = readdirSync(root).filter(f => f.endsWith('.yaml')).map(f => parse(readFileSync(new URL(f, root), 'utf8')));
  assert.equal(products.length, 28);
  let cases = 0;
  for (const goal of ['security', 'comfort', 'cleaning', 'energy', 'entertainment']) {
    for (const budget of ['open', 'under50', 'under150']) {
      for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
        const answers = { goal, budget, installation, ecosystem: 'open', extra: 'open' };
        const expected = select(products, answers);
        for (const ecosystem of ['alexa', 'google', 'apple', 'smartthings']) {
          const result = select(products, { ...answers, ecosystem });
          assert.equal(result.ecosystemEvidenceUnavailable, true);
          assert.deepEqual(result.recommendations.map(p => p.slug), expected.recommendations.map(p => p.slug));
          assert.deepEqual(result.relaxedFilters, expected.relaxedFilters);
          cases++;
        }
      }
    }
  }
  assert.equal(cases, 180);
});
