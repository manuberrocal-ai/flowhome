import assert from 'node:assert/strict';
import test from 'node:test';
import { selectDirectAlternatives, selectVerifiedDirectAlternatives } from '../src/lib/product-taxonomy.ts';
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
