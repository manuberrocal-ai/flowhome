import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleSlot } from '../scripts/daily-schedule.mjs';
import { VIEWPORTS, TEMPLATES, viewportCases } from '../scripts/qa/viewport-cases.mjs';

test('schedule respects local timezone, configured time, weekdays and malformed input', () => {
  const timezone = 'America/Argentina/Buenos_Aires';
  assert.equal(scheduleSlot(new Date('2026-09-04T13:07:00Z'), timezone, '10:07').due, true);
  assert.equal(scheduleSlot(new Date('2026-09-04T13:22:00Z'), timezone, '10:07').due, false);
  assert.equal(scheduleSlot(new Date('2026-09-04T13:06:00Z'), timezone, '10:07').due, false);
  assert.equal(scheduleSlot(new Date('2026-09-07T13:07:00Z'), timezone, '10:07').weekly, true);
  assert.throws(() => scheduleSlot(new Date(), timezone, '25:00'));
  assert.throws(() => scheduleSlot(new Date(), 'invalid', '10:07'));
});
test('V3 full viewport matrix and economical daily subset are explicit and unique', () => {
  assert.deepEqual(VIEWPORTS, [[320, 800], [375, 812], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900]]);
  assert.equal(viewportCases().length, TEMPLATES.length * 7);
  assert.equal(new Set(viewportCases().map((item) => item.name)).size, viewportCases().length);
  assert.equal(viewportCases('daily').length, 10);
  assert.throws(() => viewportCases('unknown'));
});
