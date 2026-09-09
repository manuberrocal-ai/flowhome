import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runDaily, localDay, QUALITY_COMMANDS } from '../scripts/flowhome-daily.mjs';
import { scoreSignals, DEAL_WEIGHTS } from '../scripts/lib/daily-scoring.mjs';
import { buildDiscoveryReport } from '../scripts/discovery/product-discovery.mjs';
import { prepareReviewJob } from '../scripts/lib/review-queue.mjs';

async function fixture(t) {
  const project = await mkdtemp(join(tmpdir(), 'flowhome-daily-test-'));
  t.after(() => rm(project, { recursive: true, force: true }));
  await mkdir(join(project, 'src/content/products'), { recursive: true });
  await mkdir(join(project, 'src/content/deals'), { recursive: true });
  await writeFile(join(project, 'src/content/products/product.yaml'), 'asin: B000000001\nslug: fixture-plug\ncategory: smart-plug\nprice: 19.99\npriceSource: manual\n');
  await writeFile(join(project, 'src/content/deals/deal.yaml'), 'productSlug: fixture-plug\nstartDate: 2026-09-01T00:00:00Z\nendDate: 2026-09-04T12:00:00Z\n');
  return { project, env: {}, now: new Date('2026-09-04T12:00:00Z'), checkRunner: async () => [{ command: 'fixture-only', status: 'passed' }] };
}
test('missing credentials still produce honest reports, expiry boundary and idempotent queue', async (t) => {
  const options = await fixture(t);
  const first = await runDaily(options);
  assert.equal(first.providerStatus, 'not_configured');
  assert.equal(first.status, 'complete');
  const manifestBefore = await readFile(join(first.reportDir, 'manifest.json'), 'utf8');
  const second = await runDaily(options);
  assert.equal(second.status, 'reused');
  assert.equal(await readFile(join(first.reportDir, 'manifest.json'), 'utf8'), manifestBefore);
  const candidates = JSON.parse(await readFile(join(first.reportDir, 'amazon-candidates.json'), 'utf8'));
  assert.deepEqual(candidates.candidates, []);
  assert.equal(JSON.parse(await readFile(join(first.reportDir, 'expired-deals.json'), 'utf8'))[0].status, 'expired');
  const queue = JSON.parse(await readFile(join(first.reportDir, 'review-queue.json'), 'utf8'));
  assert.equal(queue.length, 1);
  assert.equal(queue[0].preparedJob.payload.asin, 'B000000001');
  assert.equal(queue[0].preparedJob.payload.productSlug, 'fixture-plug');
  assert.equal(queue[0].preparedJob.state, 'pending');
  assert.match(queue[0].preparedJob.payload.revision, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(queue[0].preparedJob.payload).sort(), ['asin', 'intent', 'market', 'productSlug', 'revision', 'schemaVersion']);
  assert.ok(!JSON.stringify(queue[0].preparedJob).includes('19.99'));
  assert.equal(queue[0].dealScore.coverage, 15);
  assert.ok(queue[0].dealScore.missing.includes('historicalDiscount'));
  assert.equal(JSON.parse(await readFile(join(first.reportDir, 'seo.json'), 'utf8')).status, 'unverified');
});
test('dry run, kill switch and publication flag never call provider', async (t) => {
  const options = await fixture(t);
  options.clientFactory = () => { throw new Error('must_not_call'); };
  assert.equal((await runDaily({ ...options, dryRun: true })).providerStatus, 'dry_run');
  assert.equal((await runDaily({ ...options, env: { FLOWHOME_DAILY_KILL_SWITCH: 'true' } })).status, 'stopped');
  await assert.rejects(runDaily({ ...options, env: { DAILY_AUTOPUBLISH: 'true' } }), /autopublish_not_supported/);
});
test('concurrent run cannot duplicate work, lock released after success', async (t) => {
  const options = await fixture(t);
  let release;
  let announce;
  const entered = new Promise((resolve) => { announce = resolve; });
  const hold = new Promise((resolve) => { release = resolve; });
  const running = runDaily({ ...options, checkRunner: async () => { announce(); await hold; return [{ command: 'fixture', status: 'passed' }]; } });
  await entered;
  assert.equal((await runDaily(options)).status, 'locked');
  release();
  assert.equal((await running).status, 'complete');
  assert.equal((await runDaily(options)).status, 'reused');
});
test('Amazon outage is isolated, partial success deduplicates and PAC never persists', async (t) => {
  const options = await fixture(t);
  options.env = { AMAZON_DISCOVERY_APPROVED: 'true', AMAZON_CREATORS_CLIENT_ID: 'fixture', AMAZON_CREATORS_CLIENT_SECRET: 'never-log-me', AMAZON_CREATORS_VERSION: '3.1', AMAZON_PARTNER_TAG: 'fixture-20' };
  options.clientFactory = () => ({ getItems: async () => { throw new Error('never-log-me'); }, searchItems: async () => ({ items: [{ asin: 'B000000002', itemInfo: { title: { displayValue: 'PAC-DO-NOT-STORE' } }, price: 42 }, { asin: 'B000000002' }], partialErrors: 0 }) });
  const result = await runDaily(options);
  assert.equal(result.status, 'needs_attention');
  const text = await readFile(join(result.reportDir, 'amazon-candidates.json'), 'utf8');
  assert.equal(JSON.parse(text).candidates.length, 1);
  assert.ok(!text.includes('PAC-DO-NOT-STORE'));
  const anomalies = await readFile(join(result.reportDir, 'anomalies.json'), 'utf8');
  assert.ok(!anomalies.includes('never-log-me'));
  assert.ok(anomalies.includes('provider_failure'));
  const queue = JSON.parse(await readFile(join(result.reportDir, 'review-queue.json'), 'utf8'));
  assert.equal(queue.length, 2);
  assert.equal(queue.find((entry) => entry.asin === 'B000000002').dealScore.score, null);
});
test('failed checks remain attention-required and resumable; invalid timezone rejected', async (t) => {
  const options = await fixture(t);
  const failed = await runDaily({ ...options, checkRunner: async () => { throw new Error('fixture failure'); } });
  assert.equal(failed.status, 'needs_attention');
  assert.equal((await runDaily(options)).status, 'complete');
  assert.throws(() => localDay(options.now, 'not-a-timezone'));
  assert.equal(localDay(new Date('2026-09-04T01:00:00Z'), 'America/Argentina/Buenos_Aires'), '2026-09-03');
});
test('scoring preserves unknowns, requires provenance and rejects invalid weights', () => {
  assert.equal(scoreSignals({}, DEAL_WEIGHTS).score, null);
  assert.equal(scoreSignals({ relevance: { value: 1 } }, DEAL_WEIGHTS).coverage, 0);
  assert.equal(scoreSignals({ relevance: { value: 1, evidence: 'fixture' } }, DEAL_WEIGHTS).score, 15);
  assert.throws(() => scoreSignals({}, { one: 99 }), /invalid_score_weights/);
});

test('daily and discovery use identical incomplete evidence for the same catalog product', async (t) => {
  const options = await fixture(t);
  const result = await runDaily({ ...options, dryRun: true });
  const queue = JSON.parse(await readFile(join(result.reportDir, 'review-queue.json'), 'utf8'));
  const report = buildDiscoveryReport([{ asin: 'B000000001', slug: 'fixture-plug', category: 'smart-plug', file: 'src/content/products/product.yaml' }], { now: options.now });
  for (const field of ['dealScore', 'trendScore', 'opportunityScore']) assert.deepEqual(queue[0][field], report.evaluations[0][field]);
});
test('page changes, public build flags and corrupt reports invalidate reuse', async (t) => {
  const options = await fixture(t);
  const first = await runDaily(options);
  await mkdir(join(options.project, 'src/pages'), { recursive: true });
  await writeFile(join(options.project, 'src/pages/index.astro'), '<h1>Changed</h1>');
  const changed = await runDaily(options);
  assert.notEqual(changed.fingerprint, first.fingerprint);
  assert.equal(changed.status, 'complete');
  const flagChange = await runDaily({ ...options, env: { PUBLIC_OFFERS_V1: 'on' } });
  assert.notEqual(flagChange.fingerprint, changed.fingerprint);
  await writeFile(join(flagChange.reportDir, 'tests.json'), '{corrupted');
  assert.equal((await runDaily({ ...options, env: { PUBLIC_OFFERS_V1: 'on' } })).status, 'complete');
});
test('invalid configuration is actionable and never makes a provider call', async (t) => {
  const options = await fixture(t);
  options.env = { AMAZON_CREATORS_CLIENT_ID: 'fixture', AMAZON_CREATORS_CLIENT_SECRET: 'fixture', AMAZON_CREATORS_VERSION: '9', AMAZON_PARTNER_TAG: 'fixture-20' };
  const result = await runDaily(options);
  assert.equal(result.status, 'needs_attention');
  const report = JSON.parse(await readFile(join(result.reportDir, 'amazon-candidates.json'), 'utf8'));
  assert.equal(report.configurationReason, 'unsupported_credential_version');
});

test('changed auxiliary data and database migrations cannot reuse old validation', async (t) => {
  const options = await fixture(t);
  let previous = await runDaily(options);
  for (const directory of ['data', 'supabase/migrations']) {
    await mkdir(join(options.project, directory), { recursive: true });
    await writeFile(join(options.project, directory, 'fixture.txt'), 'changed input');
    const current = await runDaily(options);
    assert.equal(current.status, 'complete');
    assert.notEqual(current.fingerprint, previous.fingerprint);
    previous = current;
  }
  assert.equal((await runDaily(options)).status, 'reused');
});

test('nested .yml collections are included and duplicate identities need attention', async (t) => {
  const options = await fixture(t);
  const nested = join(options.project, 'src/content/products/nested');
  await mkdir(nested);
  await writeFile(join(nested, 'extra.yml'), 'asin: B000000002\nslug: extra\ncategory: smart-plug\n');
  const first = await runDaily(options);
  assert.equal(JSON.parse(await readFile(join(first.reportDir, 'review-queue.json'), 'utf8')).length, 2);
  await writeFile(join(nested, 'duplicate.yml'), 'asin: B000000002\nslug: duplicate\ncategory: smart-plug\n');
  const duplicate = await runDaily(options);
  assert.equal(duplicate.status, 'needs_attention');
  assert.equal(JSON.parse(await readFile(join(duplicate.reportDir, 'review-queue.json'), 'utf8')).length, 2);
});

test('changed or missing screenshot evidence invalidates reuse', async (t) => {
  const options = await fixture(t);
  let runs = 0;
  options.checkRunner = async ({ reportDir }) => {
    runs++;
    await writeFile(join(reportDir, 'screenshots/report.json'), JSON.stringify({ summary: { passed: 1 } }));
    await writeFile(join(reportDir, 'screenshots/fixture.png'), Buffer.from([137, 80, 78, 71, runs]));
    return [{ command: 'qa:browser', status: 'passed' }];
  };
  const first = await runDaily(options);
  assert.equal((await runDaily(options)).status, 'reused');
  await writeFile(join(first.reportDir, 'screenshots/fixture.png'), 'tampered');
  assert.equal((await runDaily(options)).status, 'complete');
  assert.equal(runs, 2);
  await rm(join(first.reportDir, 'screenshots/fixture.png'));
  assert.equal((await runDaily(options)).status, 'complete');
  assert.equal(runs, 3);
});

test('edits during verification cannot produce a completed source revision', async (t) => {
  const options = await fixture(t);
  options.checkRunner = async ({ project }) => {
    await writeFile(join(project, 'src/content/products/changed.yml'), 'asin: B000000003\n');
    return [{ command: 'fixture-only', status: 'passed' }];
  };
  const result = await runDaily(options);
  assert.equal(result.status, 'needs_attention');
  assert.ok((await readFile(join(result.reportDir, 'anomalies.json'), 'utf8')).includes('source_changed_during_run'));
});

test('daily passes its fingerprinted environment and rejects altered editorial evidence on reuse', async (t) => {
  const options = await fixture(t);
  options.env = { PUBLIC_APP_ENV: 'local', PUBLIC_OFFERS_V1: 'off' };
  let runs = 0;
  options.checkRunner = async ({ env, reportDir }) => {
    assert.deepEqual(env, options.env);
    runs++;
    await writeFile(join(reportDir, 'editorial-quality.json'), JSON.stringify({ fixture: runs }));
    await writeFile(join(reportDir, 'commercial-links.json'), JSON.stringify({ fixture: runs }));
    return ['quality:check', 'links:check'].map((command) => ({ command, status: 'passed' }));
  };
  const first = await runDaily(options);
  assert.equal(first.status, 'complete');
  assert.equal((await runDaily(options)).status, 'reused');
  assert.equal(runs, 1);
  await writeFile(join(first.reportDir, 'editorial-quality.json'), '{}');
  assert.equal((await runDaily(options)).status, 'complete');
  assert.equal(runs, 2);
  await rm(join(first.reportDir, 'commercial-links.json'));
  assert.equal((await runDaily(options)).status, 'complete');
  assert.equal(runs, 3);
});

test('impact coverage narrows only after intact complete evidence for the same inputs', async (t) => {
  const options = await fixture(t);
  const profiles = [];
  options.checkRunner = async ({ reportDir, browserProfile }) => {
    profiles.push(browserProfile);
    await mkdir(join(reportDir, 'seo-audit'), { recursive: true });
    for (const file of ['editorial-quality.json', 'commercial-links.json', 'seo-audit/report.json', 'screenshots/report.json']) {
      await writeFile(join(reportDir, file), JSON.stringify({ fixture: true, browserProfile }));
    }
    await writeFile(join(reportDir, 'seo-audit/inventory.csv'), 'fixture\n');
    return QUALITY_COMMANDS.map((command) => ({ command, status: 'passed' }));
  };
  const first = await runDaily(options);
  assert.equal(first.status, 'complete');
  assert.deepEqual(profiles, ['full']);
  const nextDay = { ...options, now: new Date('2026-09-05T12:00:00Z') };
  assert.equal((await runDaily(nextDay)).status, 'complete');
  assert.deepEqual(profiles, ['full', 'daily']);
  assert.equal((await runDaily(nextDay)).status, 'reused');
  assert.equal(profiles.length, 2);
  await writeFile(join(options.project, 'src/content/products/product.yaml'), 'asin: B000000001\nslug: changed\n');
  const changed = await runDaily(nextDay);
  assert.equal(profiles.at(-1), 'full');
  await writeFile(join(changed.reportDir, 'screenshots/report.json'), '{}');
  await runDaily({ ...options, now: new Date('2026-09-06T12:00:00Z') });
  assert.equal(profiles.at(-1), 'full', 'corrupt new-source evidence must not fall back to an older source');
  await runDaily({ ...options, now: new Date('2026-09-06T12:00:00Z'), env: { PUBLIC_OFFERS_V1: 'on' } });
  assert.equal(profiles.at(-1), 'full');
  await runDaily({ ...options, profile: 'weekly', now: new Date('2026-09-07T12:00:00Z') });
  assert.equal(profiles.at(-1), 'weekly');
});

test('incomplete quality evidence never authorizes reduced impact coverage', async (t) => {
  const options = await fixture(t);
  const profiles = [];
  options.checkRunner = async ({ browserProfile }) => {
    profiles.push(browserProfile);
    return [{ command: 'fixture-only', status: 'passed' }];
  };
  await runDaily(options);
  await runDaily({ ...options, now: new Date('2026-09-05T12:00:00Z') });
  assert.deepEqual(profiles, ['full', 'full']);
});

async function completeFixtureChecks({ reportDir }) {
  await mkdir(join(reportDir, 'seo-audit'), { recursive: true });
  for (const file of ['editorial-quality.json', 'commercial-links.json', 'seo-audit/report.json', 'screenshots/report.json']) {
    await writeFile(join(reportDir, file), JSON.stringify({ fixture: true }));
  }
  await writeFile(join(reportDir, 'seo-audit/inventory.csv'), 'fixture\n');
  return QUALITY_COMMANDS.map((command) => ({ command, status: 'passed' }));
}

test('daily never persists before required quality artifacts exist or after a weekly failure', async (t) => {
  const options = await fixture(t);
  let calls = 0;
  const reviewStore = {
    targetId: 'fixture-quality-evidence',
    lookup: async () => { calls++; throw new Error('unexpected_read'); },
    enqueue: async () => { calls++; throw new Error('unexpected_write'); },
  };
  const missing = await runDaily({ ...options, reviewStore,
    checkRunner: async () => QUALITY_COMMANDS.map((command) => ({ command, status: 'passed' })),
  });
  assert.equal(missing.status, 'needs_attention');
  assert.equal(calls, 0);
  assert.ok((await readFile(join(missing.reportDir, 'anomalies.json'), 'utf8')).includes('quality_evidence_unconfirmed'));
  const weekly = await runDaily({ ...options, reviewStore, profile: 'weekly',
    checkRunner: async (context) => [...await completeFixtureChecks(context), { command: 'lighthouse:mobile', status: 'failed' }],
  });
  assert.equal(weekly.status, 'needs_attention');
  assert.equal(calls, 0);
  assert.equal(JSON.parse(await readFile(join(weekly.reportDir, 'review-persistence.json'), 'utf8')).status, 'skipped_quality');
  const omitted = await runDaily({ ...options, reviewStore, profile: 'weekly', checkRunner: completeFixtureChecks });
  assert.equal(omitted.status, 'needs_attention');
  assert.equal(calls, 0);
});

test('daily reconciles a committed write with lost acknowledgement without duplicating it', async (t) => {
  const options = await fixture(t);
  options.checkRunner = completeFixtureChecks;
  let saved;
  let writes = 0;
  let reads = 0;
  options.reviewStore = {
    targetId: 'fixture-reconciliation',
    lookup: async () => { reads++; return saved ? { ...saved, status: 'duplicate' } : { status: 'missing' }; },
    enqueue: async (input) => {
      writes++;
      const { job } = prepareReviewJob(input);
      saved = { id: job.id, idempotencyKey: job.idempotencyKey, state: 'pending' };
      throw new Error('sensitive-transport-detail');
    },
  };
  const first = await runDaily(options);
  assert.equal(first.status, 'needs_attention');
  const failedReport = await readFile(join(first.reportDir, 'review-persistence.json'), 'utf8');
  assert.match(await readFile(join(first.reportDir, 'summary.md'), 'utf8'), /unresolved: 1; not attempted: 0/);
  assert.equal(JSON.parse(failedReport).status, 'needs_attention');
  assert.ok(!failedReport.includes('sensitive-transport-detail'));
  const second = await runDaily(options);
  assert.equal(second.status, 'complete');
  assert.equal(JSON.parse(await readFile(join(second.reportDir, 'review-persistence.json'), 'utf8')).entries[0].status, 'duplicate');
  assert.equal(writes, 1);
  assert.equal(reads, 2);
  assert.match(await readFile(join(second.reportDir, 'summary.md'), 'utf8'), /already present: 1; unresolved: 0/);
  assert.equal((await runDaily(options)).status, 'reused');
  assert.equal(reads, 2, 'reuse is historical evidence, not a live queue query');
});

test('weekly reported success with partial Lighthouse evidence cannot persist or be reused', async t => {
  const options = await fixture(t);
  let calls = 0;
  const reviewStore = { targetId: 'fixture-partial-matrix', lookup: async () => { calls++; }, enqueue: async () => { calls++; } };
  const checkRunner = async context => {
    const checks = await completeFixtureChecks(context);
    await mkdir(join(context.reportDir, 'lighthouse'), { recursive: true });
    await writeFile(join(context.reportDir, 'lighthouse/summary.json'), JSON.stringify({ scope: 'targeted', sampleCount: 1, failures: [] }));
    return [...checks, { command: 'lighthouse:mobile', status: 'passed' }];
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await runDaily({ ...options, profile: 'weekly', reviewStore, checkRunner });
    assert.equal(result.status, 'needs_attention');
    assert.equal(calls, 0);
    assert.equal(JSON.parse(await readFile(join(result.reportDir, 'review-persistence.json'), 'utf8')).status, 'skipped_quality');
  }
});

test('daily persistence target changes invalidate reuse and incomplete quality cannot write', async (t) => {
  const options = await fixture(t);
  const disabled = await runDaily(options);
  let calls = 0;
  const reviewStore = {
    targetId: 'fixture-a',
    lookup: async () => { calls++; return { status: 'missing' }; },
    enqueue: async (input) => {
      calls++;
      const { job } = prepareReviewJob(input);
      return { status: 'inserted', id: job.id, idempotencyKey: job.idempotencyKey, state: 'pending' };
    },
  };
  const skipped = await runDaily({ ...options, reviewStore });
  assert.equal(skipped.status, 'needs_attention');
  assert.notEqual(skipped.fingerprint, disabled.fingerprint);
  assert.equal(calls, 0);
  const completeOptions = { ...options, reviewStore, checkRunner: completeFixtureChecks };
  const first = await runDaily(completeOptions);
  assert.equal(first.status, 'complete');
  const changed = await runDaily({ ...completeOptions, reviewStore: { ...reviewStore, targetId: 'fixture-b' } });
  assert.equal(changed.status, 'complete');
  assert.notEqual(changed.fingerprint, first.fingerprint);
  assert.equal(calls, 4);
});

test('missing final evidence is actionable in both manifest and human summary', async (t) => {
  const options = await fixture(t);
  const result = await runDaily({ ...options, checkRunner: async () => [{ command: 'seo:audit', status: 'passed' }] });
  assert.equal(result.status, 'needs_attention');
  const manifest = JSON.parse(await readFile(join(result.reportDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.anomalies, 1);
  assert.match(await readFile(join(result.reportDir, 'summary.md'), 'utf8'), /Run status: needs_attention/);
  assert.match(await readFile(join(result.reportDir, 'summary.md'), 'utf8'), /does not undo already confirmed queue writes/);
  assert.match(await readFile(join(result.reportDir, 'anomalies.json'), 'utf8'), /run_evidence_unconfirmed/);
});
