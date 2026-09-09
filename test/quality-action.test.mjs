import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (file) => parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));

test('shared quality action preserves every PR gate once in fail-closed order', () => {
  const action = read('.github/actions/quality/action.yml');
  assert.equal(action.runs.using, 'composite');
  assert.deepEqual(action.runs.steps.map(({ run }) => run), [
    'npm audit --omit=dev --audit-level=moderate', 'npm run diff-check', 'npm test',
    'npm run lint', 'npm run typecheck', 'npm run quality:check', 'npm run links:check',
    'npm run build', 'npm run seo:audit',
  ]);
  for (const step of action.runs.steps) {
    assert.equal(step.shell, 'bash');
    assert.equal(step.if, undefined);
    assert.equal(step['continue-on-error'], undefined);
    for (const value of Object.values(step.env ?? {})) assert.ok(value.startsWith('${{ runner.temp }}/'));
  }
});

test('manual and PR workflows call the same gates without changing the required job or triggers', () => {
  for (const name of ['quality.yml', 'quality-check.yml']) {
    const workflow = read(`.github/workflows/${name}`);
    assert.deepEqual(Object.keys(workflow.jobs), ['quality']);
    assert.equal(workflow.permissions.contents, 'read');
    const job = workflow.jobs.quality;
    assert.equal(job['timeout-minutes'], 20);
    assert.equal(job.env.PUBLIC_APP_ENV, 'local');
    assert.equal(job.env.PUBLIC_AUTH_ENABLED, 'false');
    assert.equal(job.env.PUBLIC_ANALYTICS_ENABLED, 'false');
    assert.deepEqual(job.steps.filter(({ run }) => run).map(({ run }) => run), ['npm ci']);
    assert.equal(job.steps.filter(({ uses }) => uses === './.github/actions/quality').length, 1);
    assert.equal(job.steps.at(-1).uses, './.github/actions/quality');
    assert.equal(job.steps.at(-1).if, undefined);
    if (name === 'quality.yml') assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
    else {
      assert.equal(workflow.name, 'Quality Check');
      assert.deepEqual(Object.keys(workflow.on), ['pull_request', 'push', 'workflow_dispatch']);
      assert.deepEqual(workflow.on.push.branches, ['main']);
    }
  }
});
