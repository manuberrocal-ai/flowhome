import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { CORE_QUALITY_COMMANDS, DAILY_QUALITY_COMMANDS, qualityCommandSkipReason, qualityCommandEnvironment } from '../scripts/qa/quality-plan.mjs';
import { parseLighthouseRoutes, parseLighthouseRuns } from '../scripts/qa/lighthouse-mobile.mjs';

test('CI and daily share the same mandatory core and exactly one build', () => {
  const action = parse(readFileSync(new URL('../.github/actions/quality/action.yml', import.meta.url), 'utf8'));
  const commands = action.runs.steps.map(({ run }) => run).filter((run) => !['npm audit --omit=dev --audit-level=moderate', 'npm run diff-check'].includes(run)).map((run) => run === 'npm test' ? 'test' : run.replace('npm run ', ''));
  assert.deepEqual(commands, CORE_QUALITY_COMMANDS);
  assert.deepEqual(DAILY_QUALITY_COMMANDS, [...CORE_QUALITY_COMMANDS, 'qa:browser']);
  assert.equal(DAILY_QUALITY_COMMANDS.filter((command) => command === 'build').length, 1);
});

test('failed or missing prerequisites suppress build and dependent audits, not diagnostics', () => {
  const passed = CORE_QUALITY_COMMANDS.slice(0, -2).map((command) => ({ command, status: 'passed' }));
  assert.equal(qualityCommandSkipReason('build', passed), null);
  assert.equal(qualityCommandSkipReason('build', []), 'prerequisite_failed');
  for (const failure of ['failed', 'not_run']) {
    const results = passed.map((result, index) => index === 1 ? { ...result, status: failure } : result);
    assert.equal(qualityCommandSkipReason('build', results), 'prerequisite_failed');
    assert.equal(qualityCommandSkipReason('links:check', results), null);
    for (const command of ['seo:audit', 'qa:browser', 'lighthouse:mobile']) assert.equal(qualityCommandSkipReason(command, [...results, { command: 'build', status: 'not_run' }]), 'build_failed');
  }
  assert.equal(qualityCommandSkipReason('seo:audit', [...passed, { command: 'build', status: 'passed' }]), null);
});

test('command environment preserves selected flags and isolates reports from source', () => {
  const env = { PUBLIC_APP_ENV: 'local', PUBLIC_AUTH_ENABLED: 'false', QUALITY_REPORT_PATH: 'source-data.json' };
  const result = qualityCommandEnvironment({ env, reportDir: 'reports/case', profile: 'daily' });
  assert.equal(result.PUBLIC_APP_ENV, 'local');
  assert.equal(result.PUBLIC_AUTH_ENABLED, 'false');
  assert.equal(result.QUALITY_REPORT_PATH, join('reports/case', 'editorial-quality.json'));
  assert.equal(result.LINK_CHECK_REPORT_PATH, join('reports/case', 'commercial-links.json'));
  assert.equal(env.QUALITY_REPORT_PATH, 'source-data.json');
  assert.equal(result.BROWSER_QA_PROFILE, 'daily');
});

test('coordinated audits cannot inherit reduced Lighthouse coverage from a manual run', () => {
  for (const profile of ['daily', 'full', 'weekly']) {
    const env = { LIGHTHOUSE_ROUTES: '/product/amazon-smart-thermostat/', LIGHTHOUSE_RUNS: '1', PUBLIC_APP_ENV: 'production' };
    const result = qualityCommandEnvironment({ env, reportDir: 'reports/case', profile });
    assert.equal(Object.hasOwn(result, 'LIGHTHOUSE_ROUTES'), false);
    assert.equal(Object.hasOwn(result, 'LIGHTHOUSE_RUNS'), false);
    assert.equal(parseLighthouseRoutes(result.LIGHTHOUSE_ROUTES).length, 4);
    assert.equal(parseLighthouseRuns(result.LIGHTHOUSE_RUNS), 3);
    assert.equal(result.PUBLIC_APP_ENV, 'production');
    assert.equal(env.LIGHTHOUSE_RUNS, '1', 'Caller environment remains untouched');
    assert.equal(env.LIGHTHOUSE_ROUTES, '/product/amazon-smart-thermostat/');
  }
});
