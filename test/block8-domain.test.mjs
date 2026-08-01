import assert from 'node:assert/strict';
import test from 'node:test';
import {
  toStrictUtc,
  nowUtc,
  FRESHNESS_WINDOWS_MS,
  ANOMALY_DEFAULTS,
  RETRY_DEFAULTS,
} from '../src/lib/blocks/block8/domain.ts';

test('toStrictUtc only accepts strict UTC ISO and rejects date-only and offset forms', () => {
  assert.equal(toStrictUtc('2026-07-30T12:00:00Z'), '2026-07-30T12:00:00.000Z');
  assert.equal(toStrictUtc('2026-07-30T12:00:00.000Z'), '2026-07-30T12:00:00.000Z');
  assert.equal(toStrictUtc('2026-07-30T12:00:00+02:00'), null);
  assert.equal(toStrictUtc('2026-07-30'), null);
  assert.equal(toStrictUtc('not-a-date'), null);
  assert.equal(toStrictUtc(null), null);
  assert.equal(toStrictUtc(undefined), null);
});

test('nowUtc accepts Date and string and falls back to current time', () => {
  const fixed = new Date('2026-07-30T12:00:00Z');
  assert.equal(nowUtc(fixed), '2026-07-30T12:00:00.000Z');
  assert.equal(nowUtc('2026-07-30T12:00:00Z'), '2026-07-30T12:00:00.000Z');
  const res = nowUtc();
  assert.match(res, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('constants document the Block 8 windows and defaults used by scoring and ingestion', () => {
  assert.equal(FRESHNESS_WINDOWS_MS.price, 7 * 24 * 60 * 60 * 1000);
  assert.equal(FRESHNESS_WINDOWS_MS.availability, 24 * 60 * 60 * 1000);
  assert.equal(FRESHNESS_WINDOWS_MS.trend, 14 * 24 * 60 * 60 * 1000);
  assert.equal(FRESHNESS_WINDOWS_MS.history, 90 * 24 * 60 * 60 * 1000);
  assert.equal(ANOMALY_DEFAULTS.relativeThreshold, 0.4);
  assert.equal(ANOMALY_DEFAULTS.absoluteFloor, 0.5);
  assert.equal(ANOMALY_DEFAULTS.absoluteCeiling, 1_000_000);
  assert.equal(ANOMALY_DEFAULTS.madMultiplier, 5);
  assert.equal(RETRY_DEFAULTS.maxAttempts, 5);
  assert.equal(RETRY_DEFAULTS.baseDelayMs, 1_000);
});