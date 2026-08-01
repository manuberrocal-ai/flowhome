import assert from 'node:assert/strict';
import test from 'node:test';
import { detectPriceAnomaly } from '../src/lib/blocks/block8/anomaly.ts';
import { ANOMALY_DEFAULTS } from '../src/lib/blocks/block8/domain.ts';

test('rejects non-positive prices via the absolute floor', () => {
  for (const p of [0, -1, NaN]) {
    const d = detectPriceAnomaly(p, { previousPrice: 100, history: [] });
    assert.equal(d.anomaly, true);
    assert.equal(d.reason, 'absolute_floor');
  }
});

test('rejects suspiciously high prices via the absolute ceiling', () => {
  const d = detectPriceAnomaly(2_000_000, { previousPrice: 100, history: [] });
  assert.equal(d.anomaly, true);
  assert.equal(d.reason, 'absolute_ceiling');
});

test('relative threshold flags a >40% single-step drop; within threshold passes when no history', () => {
  const spike = detectPriceAnomaly(50, { previousPrice: 100, history: [] });
  assert.equal(spike.anomaly, true);
  assert.equal(spike.reason, 'relative_threshold');
  assert.equal(spike.details.relativeDelta, 0.5);
  const gradual = detectPriceAnomaly(70, { previousPrice: 100, history: [] });
  assert.equal(gradual.anomaly, false);
  assert.equal(gradual.reason, null);
});

test('MAD outlier rule fires when >5x MAD even if relative delta is below threshold', () => {
  // history tightly clustered -> tiny MAD; a 9-unit drop -> mad_outlier
  const d = detectPriceAnomaly(80, { previousPrice: 90, history: [90, 88, 91, 87, 89] });
  assert.equal(d.anomaly, true);
  assert.equal(d.reason, 'mad_outlier');
});

test('no baseline accepted reason for the first observation with no history', () => {
  const d = detectPriceAnomaly(50, { previousPrice: null, history: [] });
  assert.equal(d.anomaly, false);
  assert.equal(d.reason, 'no_baseline');
});

test('custom thresholds override defaults for test isolation', () => {
  const strict = detectPriceAnomaly(95, { previousPrice: 100, history: [], thresholds: { relativeThreshold: 0.02 } });
  assert.equal(strict.anomaly, true);
  assert.equal(strict.reason, 'relative_threshold');
});

test('applied threshold records the exact config used for the audit trail', () => {
  const d = detectPriceAnomaly(50, { previousPrice: 100, history: [] });
  assert.equal(d.applied.relativeThreshold, ANOMALY_DEFAULTS.relativeThreshold);
  assert.equal(d.applied.absoluteFloor, ANOMALY_DEFAULTS.absoluteFloor);
});