import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const directory = new URL('../.github/workflows/', import.meta.url);
const read = (name) => parse(readFileSync(new URL(name, directory), 'utf8'));

test('workflow and job environment maps do not reference unavailable runner context', () => {
  for (const name of readdirSync(directory).filter((name) => /\.ya?ml$/.test(name))) {
    const workflow = read(name);
    for (const [scope, env] of [
      ['workflow', workflow.env],
      ...Object.entries(workflow.jobs).map(([id, job]) => [id, job.env]),
    ]) {
      for (const value of Object.values(env ?? {})) {
        assert.doesNotMatch(String(value), /\$\{\{[^}]*\brunner\s*(?:\.|\[)/, `${name}: ${scope}`);
      }
    }
  }
});

test('release paths are initialized on the runner before consumers and retain separate destinations', () => {
  const { jobs } = read('batched-deploy.yml');
  const expected = {
    verify: {
      QUALITY_REPORT_PATH: '${{ runner.temp }}/quality-report.json',
      RELEASE_MANIFEST_PATH: '${{ runner.temp }}/release-manifest.json',
    },
    'deploy-production': {
      RELEASE_MANIFEST_PATH: '${{ runner.temp }}/release-manifest/release-manifest.json',
      RELEASE_EVIDENCE_PATH: '${{ runner.temp }}/release-evidence',
    },
  };
  for (const [id, paths] of Object.entries(expected)) {
    const job = jobs[id];
    const initialize = job.steps[0];
    assert.equal(job['runs-on'], 'ubuntu-latest');
    assert.deepEqual(initialize.env, paths);
    assert.equal(initialize.if, undefined);
    assert.equal(initialize['continue-on-error'], undefined);
    const assignments = Object.keys(paths).map((key) => `"${key}=$${key}"`).join(' ');
    assert.equal(initialize.run.trim(), `printf '%s\\n' ${assignments} >> "$GITHUB_ENV"`);
    for (const key of Object.keys(paths)) {
      assert.equal(job.env[key], undefined);
      assert.ok(job.steps.slice(1).every((step) => !Object.hasOwn(step.env ?? {}, key)), `${id}: no later override of ${key}`);
    }
  }
});
