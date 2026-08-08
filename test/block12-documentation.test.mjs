import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (name) => readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8');
const docs = [
  'BLOCK12_OPERATIONAL_READINESS.md',
  'BLOCK12_SLO_CATALOG.md',
  'BLOCK12_RUNBOOKS.md',
  'BLOCK12_90_DAY_GATE.md',
  'BLOCK12_FINAL_REPORT.md',
].map(read);

test('documentation preserves separated evidence, connection, and pending gates', () => {
  const all = docs.join('\n');
  for (const phrase of [
    'real_local',
    'synthetic',
    'mocked',
    'simulated',
    'externally_blocked',
    'time_volume_dependent',
    'connected_local',
    'definition_present_remote_execution_unobserved',
    'not_connected',
    'PENDING',
    '30 outcomes',
    'blameless',
    'Browser QA',
    'Lighthouse',
    'No historical metrics are invented',
  ]) {
    assert.match(all, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  const readiness = read('BLOCK12_OPERATIONAL_READINESS.md');
  assert.match(readiness, /Their remote execution was not observed in this change\./);
  assert.match(readiness, /Remote `quality` and `verify` executions were observed passing on 2026-08-08\./);
  assert.match(readiness, /no active connector, production queue, monitor, or provider is implied\./i);
  assert.match(all, /deals:detect.*not.*productive|local.*deals:detect/i);
});

test('SLO and runbook documents cover every operational domain', () => {
  const slo = read('BLOCK12_SLO_CATALOG.md');
  const runbooks = read('BLOCK12_RUNBOOKS.md');
  for (const title of [
    'Site and critical-flow availability',
    'Retailer CTA integrity',
    'Offer freshness and expiry',
    'Source ingestion lag',
    'Jobs, queues, and APIs',
    'CWV and budgets',
    'Indexation and SEO budgets',
    'Traffic, conversion, and citability',
    'Consent and security incidents',
    'Operational anomalies',
  ]) {
    assert.match(slo, new RegExp(title, 'i'));
    assert.match(runbooks, new RegExp(title.split(' — ')[0], 'i'));
  }
  for (const anchor of [
    'site_flow_availability',
    'broken_retailer_ctas',
    'expired_offers',
    'ingestion_lag',
    'jobs_queues_apis',
    'cwv_budgets',
    'indexation',
    'traffic_conversion_citability',
    'consent_security_incidents',
    'anomalies',
  ]) {
    assert.match(runbooks, new RegExp(`id="${anchor}"`));
    assert.match(slo, new RegExp(`BLOCK12_RUNBOOKS[.]md#${anchor}`));
  }
  for (const field of ['Candidate', 'window', 'Measurement/source', 'Observed', 'Severity', 'trigger', 'Channel', 'Connection', 'Owner', 'response', 'Runbook', 'rollback', 'escalation', 'postmortem']) {
    assert.match(slo, new RegExp(field, 'i'));
  }
});

test('roadmap and baseline state preparation without business completion', () => {
  const roadmap = readFileSync(new URL('../docs/ROADMAP_PHASES_0_6.md', import.meta.url), 'utf8');
  const baseline = readFileSync(new URL('../docs/BASELINE_SCORECARD.md', import.meta.url), 'utf8');
  assert.match(roadmap, /Block 12 local operational contracts technically prepared\/closed/);
  assert.match(roadmap, /90-day\/business outcomes (?:are not validated|remain not validated)/);
  assert.match(baseline, /Block 12 current local technical evidence/);
  assert.match(baseline, /Technical gates pass; the 90-day gate/);
  assert.match(baseline, /No historical baseline is converted into validation/);
  assert.doesNotMatch(roadmap, /Phase 6.*business completion/i);
});

test('append-only operational revalidation preserves staging-only and deployment-control boundaries', () => {
  const readiness = read('BLOCK12_OPERATIONAL_READINESS.md');
  const finalReport = read('BLOCK12_FINAL_REPORT.md');
  const baseline = readFileSync(new URL('../docs/BASELINE_SCORECARD.md', import.meta.url), 'utf8');
  const lifecycle = readFileSync(new URL('../docs/BLOCK7_LIFECYCLE_RUNBOOK.md', import.meta.url), 'utf8');
  const block10 = readFileSync(new URL('../docs/BLOCK10_COMPLETION_REPORT.md', import.meta.url), 'utf8');
  const threatModel = readFileSync(new URL('../docs/BLOCK10_THREAT_MODEL.md', import.meta.url), 'utf8');
  const deployment = readFileSync(new URL('../docs/DEPLOYMENT_RUNBOOK.md', import.meta.url), 'utf8');
  const roadmap = readFileSync(new URL('../docs/ROADMAP_PHASES_0_6.md', import.meta.url), 'utf8');
  const all = [readiness, finalReport, baseline, lifecycle, block10, threatModel, deployment, roadmap].join('\n');

  for (const phrase of [
    'Append-only operational revalidation (2026-08-08)',
    'migrations `001`–`008`',
    '28/28 target tables had RLS',
    'automatic production deployments were Disabled',
    'Preview was set to None',
    '`3912e2f`',
    'No manual protected production dispatch',
  ]) {
    assert.match(all, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(lifecycle, /Edge Functions.*not deploy|does not deploy Edge Functions/i);
  assert.match(deployment, /does not establish current production availability/i);
  assert.match(threatModel, /No production Supabase activation is claimed/i);
});
