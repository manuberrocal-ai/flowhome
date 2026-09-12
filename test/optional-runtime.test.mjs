import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeOptionalRuntime } from '../src/lib/optional-runtime.js';

function fixture(overrides = {}) {
  const calls = [];
  return { calls, loaders: {
    analytics: async () => { calls.push('load analytics'); return { setupAnalytics: config => calls.push(config) }; },
    experiments: async () => { calls.push('load experiments'); return { setupExperiments: () => calls.push('start experiments') }; },
    ...overrides,
  } };
}
const config = { analyticsEnabled: true, experimentsEnabled: true, gtmId: 'GTM-TEST', clarityId: '' };

test('disabled analytics never downloads either optional module, even with experiment flags', async () => {
  const f = fixture();
  assert.deepEqual(await initializeOptionalRuntime({ ...config, analyticsEnabled: false }, f.loaders), { analytics: 'disabled', experiments: 'disabled' });
  assert.deepEqual(f.calls, []);
});
test('enabled analytics receives approved configuration without loading disabled experiments', async () => {
  const f = fixture();
  assert.deepEqual(await initializeOptionalRuntime({ ...config, experimentsEnabled: false }, f.loaders), { analytics: 'ready', experiments: 'disabled' });
  assert.deepEqual(f.calls, ['load analytics', { gtmId: 'GTM-TEST', clarityId: '' }]);
});
test('enabled experiments initialize only after analytics', async () => {
  const f = fixture();
  assert.deepEqual(await initializeOptionalRuntime(config, f.loaders), { analytics: 'ready', experiments: 'ready' });
  assert.deepEqual(f.calls, ['load analytics', { gtmId: 'GTM-TEST', clarityId: '' }, 'load experiments', 'start experiments']);
});
test('failed analytics download does not initialize experiments or reject page setup', async () => {
  const f = fixture({ analytics: async () => { throw new Error('offline'); } });
  assert.deepEqual(await initializeOptionalRuntime(config, f.loaders), { analytics: 'unavailable', experiments: 'disabled' });
  assert.deepEqual(f.calls, []);
});
test('failed experiments leave initialized analytics available', async () => {
  const f = fixture({ experiments: async () => { throw new Error('offline'); } });
  assert.deepEqual(await initializeOptionalRuntime(config, f.loaders), { analytics: 'ready', experiments: 'unavailable' });
});
