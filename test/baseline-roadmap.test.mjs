import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parseCsv } from '../scripts/maintenance/organic-growth-report.mjs';

const root = new URL('..', import.meta.url);
const read = (file) => readFile(new URL(file, root), 'utf8');
const scorecardHeader = ['area', 'metric', 'before', 'current', 'source', 'measured_at', 'owner', 'sample_window', 'status', 'evidence', 'target', 'gap'];
const areas = ['UX', 'reliability', 'conversion', 'technical_seo', 'editorial_eeat', 'geo', 'acquisition', 'catalog_deals', 'trends', 'analytics', 'automation', 'trust_privacy', 'performance', 'accessibility'];
const statuses = new Set(['implemented', 'technically_tested', 'externally_blocked', 'time_volume_dependent']);

test('program scorecard has the exact schema, areas, evidence, and honest unknowns', async () => {
  const rows = parseCsv(await read('data/program-baseline-scorecard.csv'));
  assert.deepEqual(rows[0], scorecardHeader);
  assert.deepEqual(rows.slice(1).map((row) => row[0]), areas);
  for (const row of rows.slice(1)) {
    assert.equal(row.length, scorecardHeader.length);
    assert.ok(row.every((field) => field.trim().length > 0));
    assert.ok(statuses.has(row[8]), row[8]);
    assert.match(`${row[2]} ${row[3]}`, /Unknown|\d|pass|tested/i);
  }
  assert.match(rows.map((row) => row.join(',')).join('\n'), /Unknown/);
});

test('final Block 4 evidence is current while Block 3, P2, and Block 2 remain historical', async () => {
  const rows = parseCsv(await read('data/program-baseline-scorecard.csv'));
  const reliability = rows.find((row) => row[0] === 'reliability');
  const ux = rows.find((row) => row[0] === 'UX');
  const baseline = await read('docs/BASELINE_SCORECARD.md');
  assert.match(reliability[3], /^203\/203 tests;/);
  assert.match(reliability[4], /Final local gates.*Block 4/);
  assert.match(reliability[9], /seo:audit/);
  assert.match(ux[3], /^16\/16 Brave QA cases; 0 failures\/setup\/cleanup errors/);
  assert.match(ux[4], /flowhome-browser-qa-2026-07-29T23-55-24-563Z/);
  assert.match(ux[9], /200\/200\/200\/404 status checks/);
  assert.match(baseline, /current Block 3 `npm\.cmd test` \(2026-07-29\) is 194\/194/);
  assert.match(baseline, /P2 report recorded 182\/182/);
  assert.match(baseline, /Block 2 recorded 186\/186 after adding 4 documentation\/roadmap contract tests/);
  assert.doesNotMatch(baseline, /current[^.]*182\/182/i);
});

test('roadmap contains phases 0 through 6 and required delivery controls', async () => {
  const roadmap = await read('docs/ROADMAP_PHASES_0_6.md');
  for (let phase = 0; phase <= 6; phase += 1) assert.match(roadmap, new RegExp(`Phase ${phase} —`));
  for (const key of ['Dependencies', 'Migrations', 'Environment variables', 'Feature flags', 'Tests', 'Definition of Done', 'Observability', 'Rollout', 'Rollback', 'External blockers']) assert.ok(roadmap.includes(`**${key}:**`), key);
  for (const section of ['Ownership matrix and cadence', 'Daily:', 'Weekly:', 'Monthly:', 'Quarterly:', 'Provisional 90-day validation protocol', 'Windows:', 'Minimum samples:', 'Segments:', 'Intervals:', 'Bias notes:', 'Decision states:']) assert.ok(roadmap.includes(section), section);
  for (const link of ['BASELINE_SCORECARD.md', 'REMAINING_WORK_PROMPTS.md', 'ORGANIC_GROWTH_RUNBOOK.md']) assert.ok(roadmap.includes(link), link);
  assert.match(roadmap, /owner \(unassigned\)/);
  assert.match(roadmap, /Unknown/);
});

test('project plan and readme link both program documents', async () => {
  const [plan, readme] = await Promise.all([read('docs/PROJECT_PLAN.md'), read('README.md')]);
  for (const document of [plan, readme]) {
    assert.ok(document.includes('BASELINE_SCORECARD.md'));
    assert.ok(document.includes('ROADMAP_PHASES_0_6.md'));
  }
});

test('roadmap and CI workflows preserve the documented security gates', async () => {
  const [roadmap, quality, qualityCheck, batchedDeploy] = await Promise.all([
    read('docs/ROADMAP_PHASES_0_6.md'),
    read('.github/workflows/quality.yml'),
    read('.github/workflows/quality-check.yml'),
    read('.github/workflows/batched-deploy.yml'),
  ]);

  assert.match(roadmap, /flowhome-20/);
  assert.doesNotMatch(roadmap, /AMAZON_ASSOCIATE_TAG=Unknown/);
  assert.match(quality, /name: Manual Quality Verification/);
  assert.match(quality, /on:\s+workflow_dispatch:/);
  assert.doesNotMatch(quality, /^\s+pull_request:/m);
  assert.doesNotMatch(quality, /^\s+push:/m);
  assert.match(quality, /npm audit --omit=dev --audit-level=moderate/);
  assert.match(quality, /npm run lint/);
  assert.match(quality, /npm run typecheck/);

  for (const workflow of [qualityCheck, batchedDeploy]) {
    assert.match(workflow, /actions\/checkout@v7/);
    assert.match(workflow, /actions\/setup-node@v6/);
    assert.match(workflow, /node-version: 24/);
    assert.match(workflow, /cache-dependency-path: package-lock\.json/);
    assert.match(workflow, /npm audit --omit=dev --audit-level=moderate/);
    assert.match(workflow, /npm run lint/);
    assert.match(workflow, /npm run typecheck/);
    assert.ok(workflow.indexOf('npm audit') < workflow.indexOf('npm run build'));
    assert.ok(workflow.indexOf('npm run lint') < workflow.indexOf('npm run build'));
    assert.ok(workflow.indexOf('npm run typecheck') < workflow.indexOf('npm run build'));
  }
});
