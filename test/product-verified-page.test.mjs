import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareVerifiedProductCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
import { forCompatibilitySurface, getCompatibilityEnvironment } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const provider = { getGraph: () => graph };
const gamma = { slug: 'gamma-lock', appleHomeKit: false, wifi: true };

test('product surface stays legacy when the central provider has no graph', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' });
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface(env, 'product', gamma.slug));
  assert.equal(env.graph, null);
  assert.equal(result.product.appleHomeKit, false);
  assert.deepEqual(result.notices, []);
});

test('product surface consumes the central provider at its exact location with provenance', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }, provider);
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ ...env, now: NOW }, 'product', gamma.slug));
  assert.equal(result.product.appleHomeKit, true);
  assert.equal(result.notices.length, 1);
  assert.deepEqual(result.notices[0], {
    edgeId: 'edge:gamma-subs', relation: 'requires-subscription', message: 'Requires subscription Vendor Cloud.',
    confidence: 'medium', evidence: 'research-verified', evidenceLabel: 'Research verified', sourceLabel: 'Fixture vendor page',
  });
});

test('product surface preserves catalog fields while the runtime flag is disabled', () => {
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ enabled: false, graph, now: NOW }, 'product', gamma.slug));
  assert.equal(result.product.appleHomeKit, false);
  assert.equal(result.product.compatibilityVerificationEnabled, false);
});

test('product surface degrades an enabled graph with no exact ledger row to Unknown', () => {
  const result = prepareVerifiedProductCompatibility({ slug: 'alpha-hub', alexaCompatible: true }, 'alpha-hub', forCompatibilitySurface({ enabled: true, graph, now: NOW }, 'product', 'alpha-hub'));
  assert.equal(result.product.alexaCompatible, true);
  const withoutExactRow = { ...graph, ledger: graph.ledger.filter((row) => row.id !== 'claim:product-alpha-alexa') };
  const unknown = prepareVerifiedProductCompatibility({ slug: 'alpha-hub', alexaCompatible: true }, 'alpha-hub', forCompatibilitySurface({ enabled: true, graph: withoutExactRow, now: NOW }, 'product', 'alpha-hub'));
  assert.equal(unknown.product.alexaCompatible, undefined);
});

test('product surface ignores a quiz-only ledger row', () => {
  const quizOnly = { ...graph, ledger: graph.ledger.filter((row) => row.id !== 'claim:product-alpha-alexa') };
  const result = prepareVerifiedProductCompatibility({ slug: 'alpha-hub', alexaCompatible: false }, 'alpha-hub', forCompatibilitySurface({ enabled: true, graph: quizOnly, now: NOW }, 'product', 'alpha-hub'));
  assert.equal(result.product.alexaCompatible, undefined);
});

test('product surface rejects a product ledger row with mismatched provenance', () => {
  const altered = {
    ...graph,
    ledger: graph.ledger.map((row) => row.id === 'claim:product-alpha-alexa' ? { ...row, source: { ...row.source, label: 'Wrong source' } } : row),
  };
  const result = prepareVerifiedProductCompatibility({ slug: 'alpha-hub', alexaCompatible: false }, 'alpha-hub', forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', 'alpha-hub'));
  assert.equal(result.product.alexaCompatible, undefined);
});

test('product surface returns structured notice provenance instead of a bare message', () => {
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }, provider);
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ ...env, now: NOW }, 'product', gamma.slug));
  assert.deepEqual(Object.keys(result.notices[0]).sort(), ['confidence', 'edgeId', 'evidence', 'evidenceLabel', 'message', 'relation', 'sourceLabel']);
});

test('product surface retains a stale notice only with low confidence', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:gamma-subs' ? { ...edge, verifiedAt: '2025-12-01T00:00:00Z' } : edge),
  };
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', gamma.slug));
  assert.equal(result.notices[0].confidence, 'low');
});

test('product surface removes an expired notice', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:gamma-subs' ? { ...edge, expiry: '2026-01-01T00:00:00Z' } : edge),
  };
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', gamma.slug));
  assert.equal(result.notices.some((notice) => notice.edgeId === 'edge:gamma-subs'), false);
});

test('product surface removes a disputed notice', () => {
  const altered = {
    ...graph,
    ledger: graph.ledger.map((row) => row.id === 'claim:product-gamma-subs' ? { ...row, status: 'disputed' } : row),
  };
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', gamma.slug));
  assert.equal(result.notices.some((notice) => notice.edgeId === 'edge:gamma-subs'), false);
});

test('product surface removes an unknown-confidence compatibility flag', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:gamma-apple' ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.id === 'claim:product-gamma-apple' ? { ...row, confidence: 'unknown' } : row),
  };
  const result = prepareVerifiedProductCompatibility(gamma, gamma.slug, forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', gamma.slug));
  assert.equal(result.product.appleHomeKit, undefined);
});

test('product surface rejects a bare tested method for a hands-on claim', () => {
  const betaRow = graph.ledger.find((row) => row.id === 'claim:beta-matter');
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:beta-matter' ? { ...edge, validationMethod: 'Tested in 2026.' } : edge),
    ledger: [...graph.ledger, { ...betaRow, id: 'claim:product-beta-matter', visibleLocation: 'product:beta-bulb:compatibility', validationMethod: 'Tested in 2026.' }],
  };
  const result = prepareVerifiedProductCompatibility({ slug: 'beta-bulb', matter: false }, 'beta-bulb', forCompatibilitySurface({ enabled: true, graph: altered, now: NOW }, 'product', 'beta-bulb'));
  assert.equal(result.product.matter, undefined);
});

test('product surface uses the canonical product ledger row to override a false catalog field', () => {
  const result = prepareVerifiedProductCompatibility({ slug: 'alpha-hub', alexaCompatible: false }, 'alpha-hub', forCompatibilitySurface({ enabled: true, graph, now: NOW }, 'product', 'alpha-hub'));
  assert.equal(result.product.alexaCompatible, true);
  assert.equal(result.product.compatibilityProvenance.alexaCompatible, 'Fixture manufacturer page');
});
