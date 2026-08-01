import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { getDealStatus } from '../src/lib/deal-state.ts';

test('an expired deal is not promotable at the client boundary', () => {
  assert.equal(getDealStatus({ end: '2026-08-01T12:00:00Z' }, '2026-08-01T12:00:00Z').status, 'expired');
});

test('deal cards remove promotional UI when their build-time end date has passed', async () => {
  const card = await readFile(new URL('../src/components/DealCard.astro', import.meta.url), 'utf8');
  assert.match(card, /data-deal-card/);
  assert.match(card, /data-deal-end=\{statusInfo\.endIso/);
  assert.match(card, /getDealStatus\(\{ end: card\.dataset\.dealEnd \}, new Date\(\)\)\.status !== 'expired'/);
  assert.match(card, /data-deal-promotion/);
  assert.match(card, /Historical deal price/);
  assert.match(card, /Check current/);
});
