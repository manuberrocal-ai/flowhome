import assert from 'node:assert/strict';
import test from 'node:test';
import { LIFECYCLE_CATEGORIES, LIFECYCLE_MARKETS, LIFECYCLE_TYPES, canReceiveLifecycle, defaultLifecyclePreferences, normalizeLifecyclePreferences } from '../src/lib/lifecycle-preferences.js';

test('preferences use all 14 canonical categories and require explicit active consent', () => {
  assert.equal(LIFECYCLE_CATEGORIES.length, 14);
  assert.deepEqual(LIFECYCLE_CATEGORIES, ['video-doorbell', 'smart-thermostat', 'smart-speaker', 'smart-plug', 'smart-lock', 'smart-lighting', 'smart-hub', 'smart-display', 'security-camera', 'robot-vacuum', 'motion-sensor', 'air-purifier', 'garage-door-opener', 'smart-blinds']);
  assert.equal(defaultLifecyclePreferences().consented, false);
  const active = normalizeLifecyclePreferences({ categories: LIFECYCLE_CATEGORIES, frequency: 'monthly', types: LIFECYCLE_TYPES, consented: true });
  assert.equal(canReceiveLifecycle(active, 'digest'), true);
  assert.equal(canReceiveLifecycle({ ...active, status: 'unsubscribed' }, 'digest'), false);
  assert.equal(canReceiveLifecycle({ ...active, consented: false }, 'digest'), false);
});

test('preferences are US-only until a Canadian lifecycle market is implemented', () => {
  assert.deepEqual(LIFECYCLE_MARKETS, ['US']);
  assert.equal(normalizeLifecyclePreferences({ market: 'CA' }).market, 'US');
});
