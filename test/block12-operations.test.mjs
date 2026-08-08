import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = () => import(new URL('../src/lib/blocks/block12/index.ts', import.meta.url).href);

test('catalogue has ten complete contracts with distinct connection and evidence states', async () => {
  const {
    BLOCK12_DOMAINS,
    OPERATIONAL_CONTRACTS,
    INFRASTRUCTURE_BOUNDARY,
    validateOperationalCatalog,
  } = await load();

  assert.equal(BLOCK12_DOMAINS.length, 10);
  assert.deepEqual(validateOperationalCatalog(), []);
  assert.equal(INFRASTRUCTURE_BOUNDARY.workflowDefinition, 'definition present');
  assert.equal(INFRASTRUCTURE_BOUNDARY.remoteExecution, 'not observed');
  for (const workflowPath of INFRASTRUCTURE_BOUNDARY.workflowPaths) {
    const workflowUrl = new URL(`../${workflowPath}`, import.meta.url);
    const workflowContent = readFileSync(workflowUrl, 'utf8');
    assert.match(workflowContent, /(^|\n)name:\s/m);
    assert.match(workflowContent, /(^|\n)on:\s/m);
  }

  for (const contract of OPERATIONAL_CONTRACTS) {
    assert.ok(contract.title);
    assert.equal(contract.slo.observed, false);
    assert.equal(contract.owner.humanAssignment, 'pending');
    assert.equal(
      contract.postmortem,
      'BLOCK12_RUNBOOKS.md#blameless-postmortem-template',
    );
    assert.ok(contract.runbookAnchor.includes(contract.domain));
    assert.ok(contract.evidence.length >= 1);
  }
  assert.ok(
    new Set(OPERATIONAL_CONTRACTS.map((contract) => contract.connection)).size > 1,
  );
  assert.deepEqual(
    new Set(OPERATIONAL_CONTRACTS.flatMap((contract) => contract.evidence.map((item) => item.kind))),
    new Set(['real_local', 'synthetic', 'mocked', 'simulated', 'externally_blocked', 'time_volume_dependent']),
  );
});

test('Wilson helper and 90-day gate handle valid and invalid boundaries', async () => {
  const { wilson95, evaluate90DayGate } = await load();

  const interval = wilson95(0, 10);
  assert.equal(interval.lower, 0);
  assert.ok(interval.upper > 0.27 && interval.upper < 0.28);

  assert.equal(
    evaluate90DayGate({
      day: 89,
      outcomesBySegment: { a: 100 },
      comparableWindows: 2,
      confidenceIntervalsComputed: true,
      biasReviewComplete: true,
      decision: 'continue',
    }).state,
    'defer',
  );
  assert.equal(
    evaluate90DayGate({
      day: 90,
      outcomesBySegment: { a: 29 },
      comparableWindows: 2,
      confidenceIntervalsComputed: true,
      biasReviewComplete: true,
      decision: 'continue',
    }).state,
    'defer',
  );
  assert.equal(
    evaluate90DayGate({
      day: 90,
      outcomesBySegment: { a: 30 },
      comparableWindows: 2,
      confidenceIntervalsComputed: true,
      biasReviewComplete: true,
      decision: 'continue',
    }).state,
    'continue',
  );
  assert.equal(
    evaluate90DayGate({
      day: 90,
      outcomesBySegment: { a: 30 },
      comparableWindows: 2,
      confidenceIntervalsComputed: true,
      biasReviewComplete: true,
      externalBlocked: true,
    }).state,
    'externally_blocked',
  );

  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: {}, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }),
    /must_not_be_empty/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: [30], comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }),
    /must_be_a_record/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: null, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }),
    /must_be_a_record/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: { a: -1 }, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }),
    /non_negative_integers/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: { a: 30.5 }, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }),
    /non_negative_integers/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: { a: 30 }, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'success' }),
    /success_is_not_a_valid_gate_state/,
  );
  assert.throws(
    () => evaluate90DayGate({ day: 90, outcomesBySegment: { a: 30 }, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'approve' }),
    /invalid_gate_decision/,
  );
  for (const missing of [
    {
      comparableWindows: 1,
      confidenceIntervalsComputed: true,
      biasReviewComplete: true,
      reason: 'insufficient_comparable_windows',
    },
    {
      comparableWindows: 2,
      confidenceIntervalsComputed: false,
      biasReviewComplete: true,
      reason: 'confidence_intervals_required',
    },
    {
      comparableWindows: 2,
      confidenceIntervalsComputed: true,
      biasReviewComplete: false,
      reason: 'bias_review_required',
    },
  ]) {
    const result = evaluate90DayGate({ day: 90, outcomesBySegment: { a: 30 }, ...missing, decision: 'continue' });
    assert.equal(result.state, 'defer');
    assert.equal(result.reason, missing.reason);
  }
  assert.equal(
    evaluate90DayGate({ day: 120, outcomesBySegment: { a: 30 }, comparableWindows: 2, confidenceIntervalsComputed: true, biasReviewComplete: true, decision: 'continue' }).state,
    'continue',
  );
});

test('rollback simulation is reversible, non-mutating, and blocks external mode', async () => {
  const { simulateRollback } = await load();
  assert.deepEqual(simulateRollback('simulated'), {
    mode: 'simulated',
    action: 'disable_flags_restore_last_known_valid_snapshot',
    mutated: false,
    blocked: false,
  });
  assert.equal(simulateRollback('external').blocked, true);
});
