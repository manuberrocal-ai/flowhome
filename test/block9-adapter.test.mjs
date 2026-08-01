import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';
import { applyVerifiedCompatibility, verifiedSubstitutes } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';

test('adapter preserves catalog compatibility while disabled or graphless', () => {
  const product = { slug: 'alpha-hub', alexaCompatible: true };
  assert.equal(applyVerifiedCompatibility(product, product.slug, { enabled: false, graph, now: NOW }).alexaCompatible, true);
  assert.equal(applyVerifiedCompatibility(product, product.slug, { enabled: true, graph: null, now: NOW }).alexaCompatible, true);
});

test('adapter requires the exact product surface ledger location before overriding a field', () => {
  const product = { slug: 'alpha-hub', alexaCompatible: false, googleHomeCompatible: false };
  const verified = applyVerifiedCompatibility(product, product.slug, { enabled: true, graph, market: 'US', now: NOW, visibleLocation: 'product:alpha-hub:ecosystem-chip' });
  assert.equal(verified.alexaCompatible, true);
  assert.equal(verified.compatibilityProvenance.alexaCompatible, 'Fixture manufacturer page');
  const wrongSurface = applyVerifiedCompatibility(product, product.slug, { enabled: true, graph, market: 'US', now: NOW, visibleLocation: 'comparison:alpha-hub:compatibility' });
  assert.equal(wrongSurface.alexaCompatible, undefined);
});

test('adapter reads substitutes only from the exact alternatives surface ledger location', () => {
  assert.deepEqual(verifiedSubstitutes({ enabled: true, graph, market: 'US', now: NOW, visibleLocation: 'alternatives:beta-bulb:compatibility' }, 'beta-bulb'), ['alpha-hub']);
  assert.deepEqual(verifiedSubstitutes({ enabled: true, graph, market: 'US', now: NOW, visibleLocation: 'quiz:beta-bulb:compatibility' }, 'beta-bulb'), []);
});
