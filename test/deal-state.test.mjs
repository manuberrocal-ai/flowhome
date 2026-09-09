import assert from 'node:assert/strict';
import test from 'node:test';
import { filterLiveDeals, formatPriceLastChecked, getDealStatus, getDealUrgencyCopy, isDealActive } from '../src/lib/deal-state.ts';

const NOW = '2026-09-04T12:00:00Z';
const window = { start: '2026-09-04T10:00:00Z', end: '2026-09-04T14:00:00Z' };

test('deal start is inclusive and end is exclusive', () => {
  assert.equal(getDealStatus(window, '2026-09-04T09:59:59.999Z').status, 'upcoming');
  assert.equal(getDealStatus(window, window.start).status, 'active');
  assert.equal(getDealStatus(window, NOW).msToNext, 2 * 60 * 60 * 1000);
  assert.equal(getDealStatus(window, window.end).status, 'expired');
  assert.equal(isDealActive(window, window.end), false);
});

test('an end is required even when the start is valid or upcoming', () => {
  for (const start of ['2026-09-03T10:00:00Z', '2026-09-05T10:00:00Z', undefined]) {
    const status = getDealStatus({ start }, NOW);
    assert.equal(status.status, 'unknown');
    assert.equal(getDealUrgencyCopy({ start }, NOW).canShowCountdown, false);
  }
  assert.equal(getDealStatus({ end: window.end }, NOW).status, 'active');
  assert.equal(getDealStatus({ end: NOW }, NOW).status, 'expired');
});

test('explicit offsets represent the same instant without using local machine timezone', () => {
  const offset = getDealStatus({ start: '2026-09-04T07:00:00-03:00', end: '2026-09-04T11:00:00-03:00' }, NOW);
  assert.equal(offset.status, 'active');
  assert.equal(offset.startIso, '2026-09-04T10:00:00.000Z');
  assert.equal(offset.endIso, '2026-09-04T14:00:00.000Z');
});

test('legacy date-only boundaries have the documented UTC-midnight meaning', () => {
  const info = getDealStatus({ start: '2026-09-04', end: '2026-09-05' }, NOW);
  assert.equal(info.status, 'active');
  assert.equal(info.endIso, '2026-09-05T00:00:00.000Z');
  assert.equal(getDealStatus({ start: '2026-09-04', end: '2026-09-05' }, '2026-09-05T00:00:00Z').status, 'expired');
});

test('invalid supplied boundaries fail closed instead of becoming missing data', () => {
  for (const invalid of ['2026-02-30', '2026-02-30T12:00:00Z', '2026-09-04T24:00:00Z', '2026-09-04T12:00:60Z', '2026-09-04T12:00:00', '2026-09-04 12:00:00Z', '2026-09-04T12:00:00+15:00', '2026-09-04T12:00:00+14:01', '2026-09-04T12:00:00+01:60', '2026-09-04T12:00:00+0300', 'garbage', '', new Date(NaN)]) {
    for (const key of ['start', 'end']) {
      const status = getDealStatus({ ...window, [key]: invalid }, NOW);
      assert.equal(status.status, 'unknown', `${key}: ${invalid}`);
      assert.equal(Number.isNaN(status.msToNext), true);
    }
  }
});

test('inverted and zero-duration windows are unknown, never upcoming or active', () => {
  assert.equal(getDealStatus({ start: window.end, end: window.start }, NOW).status, 'unknown');
  assert.equal(getDealStatus({ start: window.start, end: window.start }, NOW).status, 'unknown');
});

test('invalid now never throws or fabricates a reference instant', () => {
  for (const now of [new Date(NaN), 'invalid', '2026-02-30T12:00:00Z', '2026-09-04T12:00:00', '2026-09-04']) {
    const info = getDealStatus(window, now);
    assert.equal(info.status, 'unknown');
    assert.equal(info.referenceIso, '');
  }
});

test('filtering promotes only active windows unless upcoming is explicitly requested', () => {
  const deals = [
    { id: 'active', data: window },
    { id: 'upcoming', data: { start: '2026-09-05', end: '2026-09-06' } },
    { id: 'unknown', data: { start: '2026-09-01' } },
    { id: 'expired', data: { end: '2026-09-01' } },
  ];
  assert.deepEqual(filterLiveDeals(deals, NOW).map((deal) => deal.id), ['active']);
  assert.deepEqual(filterLiveDeals(deals, NOW, true).map((deal) => deal.id), ['active', 'upcoming']);
});

test('historical date formatting rejects invalid dates and rollover', () => {
  assert.equal(formatPriceLastChecked('2026-02-30'), null);
  assert.equal(formatPriceLastChecked(new Date(NaN)), null);
  assert.equal(formatPriceLastChecked('2026-02-28'), 'Price last checked Feb 28, 2026');
});
