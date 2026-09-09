import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderProjectPlan, verifyProjectPlan } from '../scripts/qa/project-plan.mjs';

const backlog = JSON.parse(readFileSync(new URL('../docs/project/BACKLOG.json', import.meta.url), 'utf8'));
test('operational plan retains every current task, status, dependency and acceptance criterion', () => {
  const plan = readFileSync(new URL('../docs/project/PLAN_DE_TRABAJO.md', import.meta.url), 'utf8');
  assert.equal(verifyProjectPlan(backlog, plan).tasks, backlog.tasks.length);
  for (const task of backlog.tasks) assert.ok(plan.includes(task.acceptance));
});
test('stale status, omitted task or weakened acceptance rejects the plan without changing backlog', () => {
  const before = JSON.stringify(backlog);
  const plan = renderProjectPlan(backlog);
  assert.throws(() => verifyProjectPlan(backlog, plan.replace('Estado: hecho.', 'Estado: pendiente.')));
  assert.throws(() => verifyProjectPlan(backlog, plan.replace(backlog.tasks[0].acceptance, 'Finished')));
  assert.throws(() => verifyProjectPlan(backlog, plan.replace(/^\| FH-31.*\n/m, '')));
  assert.equal(JSON.stringify(backlog), before);
});
test('ambiguous task identities, statuses and dependencies are rejected', () => {
  for (const patch of [{ id: backlog.tasks[1].id }, { status: 'invented' }, { depends_on: ['FH-99'] }, { depends_on: [backlog.tasks[0].id] }]) {
    const invalid = structuredClone(backlog);
    Object.assign(invalid.tasks[0], patch);
    assert.throws(() => renderProjectPlan(invalid));
  }
});
