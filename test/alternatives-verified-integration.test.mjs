import assert from 'node:assert/strict';
import test from 'node:test';
import { selectVerifiedDirectAlternatives } from '../src/lib/product-taxonomy.ts';
import { forCompatibilitySurface } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const beta = { slug: 'beta-bulb', category: 'smart-lighting', catalogActive: true };
const alpha = { slug: 'alpha-hub', category: 'smart-hub', catalogActive: true };

test('alternatives surface promotes only the exact alternatives ledger substitute', () => {
  const alternatives = selectVerifiedDirectAlternatives(beta, [alpha], forCompatibilitySurface({ enabled: true, graph, market: 'US', now: NOW }, 'alternatives', beta.slug));
  assert.deepEqual(alternatives.map((item) => item.relationship.targetSlug), ['alpha-hub']);
});
