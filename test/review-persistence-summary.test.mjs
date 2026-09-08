import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewPersistenceSummary } from '../scripts/lib/review-persistence-summary.mjs';

test('partial persistence distinguishes known inserts, existing rows and unattempted work', () => {
  const text = reviewPersistenceSummary({ status: 'needs_attention', entries: [
    { status: 'inserted' }, { status: 'duplicate', state: 'completed' }, { status: 'unconfirmed', message: 'secret-fixture' },
  ] }, 5);
  assert.match(text, /Inserted: 1; already present: 1; unresolved: 1; not attempted: 2/);
  assert.match(text, /Do not delete jobs/);
  assert.ok(!text.includes('secret-fixture'));
});

test('disabled, dry-run and failed-quality reports never imply saved work', () => {
  for (const status of ['disabled', 'dry_run', 'skipped_quality']) {
    const text = reviewPersistenceSummary({ status, entries: [] }, 28);
    assert.match(text, /Inserted: 0; already present: 0; unresolved: 0; not attempted: 28/);
  }
  assert.match(reviewPersistenceSummary({ status: 'confirmed', entries: [] }, 0), /not a live queue query or human approval/);
  assert.match(reviewPersistenceSummary({ status: 'secret-fixture', entries: [] }, 0), /Review persistence: unknown/);
  assert.ok(!reviewPersistenceSummary({ status: 'secret-fixture', entries: [] }, 0).includes('secret-fixture'));
});
