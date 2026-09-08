import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEnergySavings } from '../src/lib/energy-savings.js';

const example = { watts: 60, hours: 3, rate: 0.17, cost: 25 };
test('illustrative energy estimate uses a disclosed 30-day month and simple payback', () => {
  const result = calculateEnergySavings(example);
  assert.equal(result.status, 'estimated');
  assert.equal(result.monthly.toFixed(2), '0.92');
  assert.equal(result.annual.toFixed(2), '11.02');
  assert.equal(result.payback.toFixed(1), '27.2');
  assert.equal(calculateEnergySavings({ ...example, cost: 0 }).payback, 0);
});
test('zero savings never promise a zero-month payback', () => {
  for (const field of ['watts', 'hours', 'rate']) assert.deepEqual(calculateEnergySavings({ ...example, [field]: 0 }), { status: 'no_savings' });
});
test('invalid, empty, negative, overflowing and impossible runtime inputs are rejected', () => {
  for (const value of [undefined, null, '', '60', NaN, Infinity, -1]) assert.deepEqual(calculateEnergySavings({ ...example, watts: value }), { status: 'invalid' });
  assert.equal(calculateEnergySavings({ ...example, hours: 25 }).status, 'invalid');
  assert.equal(calculateEnergySavings({ ...example, watts: Number.MAX_VALUE, rate: Number.MAX_VALUE }).status, 'invalid');
  assert.equal(calculateEnergySavings().status, 'invalid');
});
