import assert from 'node:assert/strict';
import test from 'node:test';
import { selectDirectAlternatives, selectVerifiedDirectAlternatives, selectCurrentDirectAlternatives } from '../src/lib/product-taxonomy.ts';
import { createCompatibilityClient } from '../src/lib/blocks/block9/delivery-client.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { forCompatibilitySurface, getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const current = { data: { slug: 'beta-bulb', category: 'smart-lighting', catalogActive: true } };
const products = [{ data: { slug: 'alpha-hub', category: 'smart-hub', catalogActive: true } }, { data: { slug: 'other-bulb', category: 'smart-lighting', catalogActive: true } }];

test('alternatives remain legacy when central runtime has no approved graph', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' });
  assert.deepEqual(selectVerifiedDirectAlternatives(current, products, forCompatibilitySurface(env, 'alternatives', 'beta-bulb')), selectDirectAlternatives(current, products));
});

test('alternatives surface promotes only the exact ledger-backed substitute', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }, { getGraph: () => graph });
  const result = selectVerifiedDirectAlternatives(current, products, forCompatibilitySurface({ ...env, now: NOW }, 'alternatives', 'beta-bulb'));
  assert.equal(result[0].product.data.slug, 'alpha-hub');
});

test('verified substitutes already present in the editorial list are promoted before the limit', () => {
  // Synthetic catalog deliberately puts the fixture target in the same category.
  const catalog = [{ slug: 'other-bulb', category: 'smart-lighting', catalogActive: true }, { slug: 'alpha-hub', category: 'smart-lighting', catalogActive: true }];
  const environment = { enabled: true, graph, market: 'US', now: NOW };
  const select = surface => selectVerifiedDirectAlternatives(current, catalog, forCompatibilitySurface(environment, surface, 'beta-bulb'), 1).map(item => item.relationship.targetSlug);
  assert.deepEqual(select('alternatives'), ['alpha-hub']);
  assert.deepEqual(select('product'), ['other-bulb']);
  assert.deepEqual(select('quiz'), ['other-bulb']);
  assert.deepEqual(catalog.map(product => product.slug), ['other-bulb', 'alpha-hub']);
});

test('current alternatives deduplicate promoted targets and ignore inactive, missing and self targets', () => {
  const preferred = { slug: 'alpha-hub', category: 'smart-lighting', catalogActive: true };
  const catalog = [current, { slug: 'other-bulb', category: 'smart-lighting', catalogActive: true }, preferred, preferred, { slug: 'off', category: 'smart-lighting', catalogActive: false }];
  const result = selectCurrentDirectAlternatives(current, catalog, ['alpha-hub', 'alpha-hub', 'beta-bulb', 'missing', 'off']);
  assert.deepEqual(result.map(item => item.relationship.targetSlug), ['alpha-hub', 'other-bulb']);
  assert.deepEqual(selectCurrentDirectAlternatives(current, catalog, [], 1).map(item => item.relationship.targetSlug), ['other-bulb']);
});

test('expired or disputed alternatives evidence cannot retain promotion', () => {
  const catalog = [{ slug: 'other-bulb', category: 'smart-lighting', catalogActive: true }, { slug: 'alpha-hub', category: 'smart-lighting', catalogActive: true }];
  for (const state of ['expired', 'disputed']) {
    const candidate = structuredClone(graph);
    if (state === 'expired') candidate.edges.find(edge => edge.id === 'edge:beta-alpha-substitute').expiry = '2026-07-29T00:00:00Z';
    else candidate.ledger.find(row => row.visibleLocation === 'alternatives:beta-bulb:compatibility').status = 'disputed';
    const env = forCompatibilitySurface({ enabled: true, graph: candidate, market: 'US', now: NOW }, 'alternatives', 'beta-bulb');
    assert.equal(selectVerifiedDirectAlternatives(current, catalog, env, 1)[0].relationship.targetSlug, 'other-bulb');
  }
});

test('ranking reverts to editorial order when an alternatives delivery lease expires', async () => {
  let time = 0;
  const client = createCompatibilityClient({ endpoint: '/compatibility', pageUrl: 'https://flowhome.invalid/', clock: { monotonic: () => time, wall: () => time }, fetch: (url, init) => serveCompatibilityRequest(new Request(url, init), { enabled: true, clock: () => new Date(NOW), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-08-01T00:00:00Z' }) }) });
  const catalog = [{ slug: 'other-bulb', category: 'smart-lighting', catalogActive: true }, { slug: 'alpha-hub', category: 'smart-lighting', catalogActive: true }];
  const first = () => selectCurrentDirectAlternatives(current, catalog, client.read()?.substitutes ?? [], 1)[0].relationship.targetSlug;
  try {
    assert.equal(first(), 'other-bulb');
    assert.equal(await client.refresh({ slug: 'beta-bulb', surface: 'alternatives', market: 'US' }), true);
    assert.equal(first(), 'alpha-hub'); time = 60_000;
    assert.equal(first(), 'other-bulb');
  } finally { client.dispose(); }
});
