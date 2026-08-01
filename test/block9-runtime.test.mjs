import assert from 'node:assert/strict';
import test from 'node:test';
import { compatibilityVisibleLocation, forCompatibilitySurface, getCompatibilityEnvironment, isCompatibilityEnabled } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();

test('runtime enables compatibility only for the canonical true string', () => {
  assert.equal(isCompatibilityEnabled('true'), true);
});

test('runtime keeps a boolean true disabled', () => {
  assert.equal(isCompatibilityEnabled(true), false);
});

test('runtime keeps uppercase TRUE disabled', () => {
  assert.equal(isCompatibilityEnabled('TRUE'), false);
});

test('runtime keeps a missing flag disabled', () => {
  assert.equal(getCompatibilityEnvironment({}).enabled, false);
});

test('runtime does not invoke a graph provider while disabled', () => {
  let calls = 0;
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'false' }, { getGraph: () => { calls += 1; return graph; } });
  assert.deepEqual({ graph: env.graph, calls }, { graph: null, calls: 0 });
});

test('runtime invokes the approved provider when enabled', () => {
  let calls = 0;
  const env = getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }, { getGraph: () => { calls += 1; return graph; } });
  assert.deepEqual({ graph: env.graph, calls }, { graph, calls: 1 });
});

test('runtime default provider exposes no fixture graph', () => {
  assert.equal(getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: 'true' }).graph, null);
});

test('runtime gives product claims a product-only visible location', () => {
  assert.equal(compatibilityVisibleLocation('product', 'alpha-hub'), 'product:alpha-hub:compatibility');
});

test('runtime gives quiz claims a quiz-only visible location', () => {
  assert.equal(compatibilityVisibleLocation('quiz', 'alpha-hub'), 'quiz:alpha-hub:compatibility');
});

test('runtime gives comparison claims a comparison-only visible location', () => {
  assert.equal(compatibilityVisibleLocation('comparison', 'alpha-hub'), 'comparison:alpha-hub:compatibility');
});

test('runtime gives alternatives claims an alternatives-only visible location', () => {
  assert.equal(compatibilityVisibleLocation('alternatives', 'alpha-hub'), 'alternatives:alpha-hub:compatibility');
});

test('runtime surface binding preserves the approved graph and market', () => {
  const bound = forCompatibilitySurface({ enabled: true, graph, market: 'CA' }, 'product', 'delta-cam');
  assert.deepEqual(bound, { enabled: true, graph, market: 'CA', visibleLocation: 'product:delta-cam:compatibility' });
});
