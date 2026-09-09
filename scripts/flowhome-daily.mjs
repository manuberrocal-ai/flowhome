import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseFlatYaml } from './lib/content-utils.mjs';
import { ASIN_PATTERN, amazonConfiguration, createAmazonClient } from './lib/amazon-creators.mjs';
import { DEAL_WEIGHTS, OPPORTUNITY_WEIGHTS, TREND_WEIGHTS, scoreSignals } from './lib/daily-scoring.mjs';
import { scoreCatalogProduct } from './lib/catalog-prioritization.mjs';
import { prepareReviewJob } from './lib/review-queue.mjs';
import { persistReviewQueue } from './lib/persist-review-queue.mjs';
import { reviewPersistenceSummary } from './lib/review-persistence-summary.mjs';
import { getDealStatus } from '../src/lib/deal-state.ts';
import { DAILY_QUALITY_COMMANDS, qualityCommandSkipReason, qualityCommandEnvironment } from './qa/quality-plan.mjs';
import { verifyFullLighthouseEvidence } from './qa/lighthouse-evidence.mjs';

const PROJECT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const JSON_FILES = ['seo', 'visual', 'amazon-candidates', 'expired-deals', 'tests', 'anomalies', 'review-queue', 'review-persistence'];
export const QUALITY_COMMANDS = DAILY_QUALITY_COMMANDS;
export function localDay(now, timezone) {
  if (!Number.isFinite(now.getTime())) throw new Error('invalid_run_time');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-');
}

function loadCollection(project, name) {
  const directory = join(project, 'src/content', name);
  if (!existsSync(directory)) return [];
  const records = [];
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      const file = join(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.ya?ml$/.test(entry.name)) records.push({
        ...parseFlatYaml(readFileSync(file, 'utf8')), file: relative(project, file).replaceAll('\\', '/'),
      });
    }
  }
  visit(directory);
  return records;
}

function projectRevision(project) {
  const hash = createHash('sha256');
  function visit(path) {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) continue;
      const file = join(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile()) hash.update(file.slice(project.length)).update(readFileSync(file));
    }
  }
  for (const directory of ['src', 'scripts', 'test', 'data', 'supabase', '.github', 'public']) if (existsSync(join(project, directory))) visit(join(project, directory));
  for (const name of ['package.json', 'package-lock.json', 'astro.config.mjs', 'eslint.config.js', 'tsconfig.json']) if (existsSync(join(project, name))) hash.update(name).update(readFileSync(join(project, name)));
  // Detect environment-file changes without reading their secret values.
  for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) if (existsSync(join(project, name))) {
    const info = statSync(join(project, name));
    hash.update(JSON.stringify({ name, size: info.size, modified: info.mtimeMs }));
  }
  return hash.digest('hex');
}

async function evidenceDigests(reportDir, checks, { qualityOnly = false } = {}) {
  if (checks.some(check => check.command === 'lighthouse:mobile' && check.status === 'passed')) {
    await verifyFullLighthouseEvidence(join(reportDir, 'lighthouse'));
  }
  const files = qualityOnly ? [] : [...JSON_FILES.map((name) => `${name}.json`), 'summary.md'];
  for (const [command, artifact] of [['quality:check', 'editorial-quality.json'], ['links:check', 'commercial-links.json']]) {
    if (checks.some((check) => check.command === command && check.status === 'passed')) files.push(artifact);
  }
  for (const [command, artifact] of [['seo:audit', 'seo-audit/report.json'], ['qa:browser', 'screenshots/report.json'], ['lighthouse:mobile', 'lighthouse/summary.json']]) {
    if (checks.some((check) => check.command === command && check.status === 'passed')) files.push(artifact);
  }
  if (checks.some((check) => check.command === 'seo:audit' && check.status === 'passed')) files.push('seo-audit/inventory.csv');
  // Include actual screenshots and sample reports, not only their summaries.
  function collect(directory) {
    for (const entry of readdirSync(join(reportDir, directory), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isSymbolicLink()) throw new Error('symlink_evidence_not_allowed');
      const file = `${directory}/${entry.name}`;
      if (entry.isDirectory()) collect(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  for (const [command, directory] of [['qa:browser', 'screenshots'], ['lighthouse:mobile', 'lighthouse']]) {
    if (checks.some((check) => check.command === command && check.status === 'passed')) collect(directory);
  }
  const digests = {};
  for (const file of [...new Set(files)].sort()) {
    const content = await readFile(join(reportDir, file));
    if (file.endsWith('.json')) JSON.parse(content.toString('utf8'));
    digests[file] = createHash('sha256').update(content).digest('hex');
  }
  return digests;
}

async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, path);
}

async function browserImpactProfile({ outputRoot, date, verificationKey, profile }) {
  if (profile === 'weekly') return { profile: 'weekly', reason: 'weekly_full_matrix' };
  const dates = readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name) && entry.name <= date)
    .map((entry) => entry.name).sort().reverse().slice(0, 7);
  for (const priorDate of dates) {
    const directory = join(outputRoot, priorDate);
    try {
      const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'));
      if (manifest.status !== 'complete' || manifest.verificationKey !== verificationKey || !['full', 'daily', 'weekly'].includes(manifest.browserProfile)) continue;
      const checks = JSON.parse(await readFile(join(directory, 'tests.json'), 'utf8'));
      if (!QUALITY_COMMANDS.every((command) => checks.some((check) => check.command === command && check.status === 'passed'))) continue;
      const evidence = await evidenceDigests(directory, checks);
      if (JSON.stringify(evidence) !== JSON.stringify(manifest.evidence)) continue;
      return { profile: 'daily', reason: 'same_verified_source_and_environment', baselineDate: priorDate };
    } catch { /* Missing, incomplete or altered evidence never narrows coverage. */ }
  }
  return { profile: 'full', reason: 'changed_or_unverified_source_or_environment' };
}

export async function runQualityChecks({ project, reportDir, profile = 'daily', browserProfile = profile, env = process.env }) {
  const npmCli = env.npm_execpath;
  if (!npmCli || !existsSync(npmCli) || !/npm-cli\.js$/.test(npmCli)) return [{ command: 'quality', status: 'not_run', reason: 'Run through npm run flowhome:daily so the existing npm runtime is available.' }];
  const commands = [...QUALITY_COMMANDS, ...(profile === 'weekly' ? ['lighthouse:mobile'] : [])];
  const results = [];
  await mkdir(join(reportDir, 'seo-audit'), { recursive: true });
  for (const command of commands) {
    const skipReason = qualityCommandSkipReason(command, results);
    if (skipReason) {
      results.push({ command, status: 'not_run', reason: skipReason });
      continue;
    }
    const started = Date.now();
    const result = await new Promise((done) => {
      const child = spawn(process.execPath, [npmCli, 'run', command], {
        cwd: project, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
        env: qualityCommandEnvironment({ env, reportDir, profile: browserProfile }),
      });
      let output = '';
      let timedOut = false;
      const collect = (chunk) => { output = (output + chunk.toString()).slice(-12000); };
      child.stdout.on('data', collect);
      child.stderr.on('data', collect);
      const timer = setTimeout(() => {
        timedOut = true;
        if (process.platform === 'win32' && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' });
        else child.kill('SIGTERM');
      }, 12 * 60 * 1000);
      child.once('error', () => { clearTimeout(timer); done({ status: 'failed', reason: 'could_not_start' }); });
      child.once('close', (exitCode) => {
        clearTimeout(timer);
        const tests = output.match(/(?:#|ℹ) tests (\d+)[\s\S]*?(?:#|ℹ) pass (\d+)[\s\S]*?(?:#|ℹ) fail (\d+)/);
        done({ status: !timedOut && exitCode === 0 ? 'passed' : 'failed', exitCode, timedOut,
          ...(tests ? { tests: Number(tests[1]), passed: Number(tests[2]), failed: Number(tests[3]) } : {}) });
      });
    });
    results.push({ command, ...result, durationMs: Date.now() - started });
  }
  return results;
}

export async function runDaily({ project = PROJECT, outputRoot = join(project, 'reports/daily'), now = new Date(), env = process.env,
  dryRun = false, refresh = false, profile = 'daily', checkRunner = runQualityChecks, clientFactory = createAmazonClient, reviewStore = null } = {}) {
  if (env.FLOWHOME_DAILY_KILL_SWITCH === 'true') return { status: 'stopped', reason: 'kill_switch' };
  if (env.DAILY_AUTOPUBLISH && env.DAILY_AUTOPUBLISH !== 'false') throw new Error('autopublish_not_supported');
  if (!['daily', 'weekly'].includes(profile)) throw new Error('invalid_profile');
  if (reviewStore && (typeof reviewStore.targetId !== 'string' || !/^[a-z0-9:_-]{1,80}$/.test(reviewStore.targetId)
    || typeof reviewStore.lookup !== 'function' || typeof reviewStore.enqueue !== 'function')) throw new Error('invalid_review_store');
  const timezone = env.FLOWHOME_TIMEZONE || 'America/Argentina/Buenos_Aires';
  const date = localDay(now, timezone);
  const reportDir = join(resolve(outputRoot), date);
  await mkdir(outputRoot, { recursive: true });
  const lockPath = join(resolve(outputRoot), '.flowhome-daily.lock');
  let lock;
  try { lock = await open(lockPath, 'wx'); }
  catch (error) { if (error.code === 'EEXIST') return { status: 'locked', reason: 'another_run_or_stale_lock' }; throw error; }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: now.toISOString(), runId: randomUUID() }));
    const products = loadCollection(project, 'products');
    const deals = loadCollection(project, 'deals');
    const configuration = amazonConfiguration(env);
    const approved = env.AMAZON_DISCOVERY_APPROVED === 'true';
    const revision = projectRevision(project);
    const buildEnvironment = Object.fromEntries(Object.entries(env).filter(([name]) => name.startsWith('PUBLIC_')).sort(([a], [b]) => a.localeCompare(b)));
    const verificationKey = createHash('sha256').update(JSON.stringify({ revision, buildEnvironment, node: process.version })).digest('hex');
    const fingerprint = createHash('sha256').update(JSON.stringify({ date, timezone, products, deals, dryRun, profile, approved, reviewStoreTarget: reviewStore?.targetId ?? null, providerStatus: configuration.status, providerReason: configuration.reason, clientId: env.AMAZON_CREATORS_CLIENT_ID, partnerTag: env.AMAZON_PARTNER_TAG, revision, buildEnvironment, node: process.version })).digest('hex');
    const manifestPath = join(reportDir, 'manifest.json');
    if (!refresh && existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
        const checks = JSON.parse(await readFile(join(reportDir, 'tests.json'), 'utf8'));
        const evidence = await evidenceDigests(reportDir, checks);
        if (manifest.fingerprint === fingerprint && manifest.status === 'complete' && JSON.stringify(evidence) === JSON.stringify(manifest.evidence)) return { status: 'reused', reportDir, fingerprint };
      } catch { /* Interrupted/corrupt previous run is rebuilt under the lock. */ }
    }
    const browserCoverage = await browserImpactProfile({ outputRoot: resolve(outputRoot), date, verificationKey, profile });
    const browserProfile = browserCoverage.profile;
    await mkdir(join(reportDir, 'screenshots'), { recursive: true });
    await atomicJson(manifestPath, { status: 'running', fingerprint, verificationKey, browserProfile, browserCoverage, startedAt: now.toISOString(), dryRun, profile });
    const anomalies = [];
    const candidates = new Map();
    const queue = new Map();
    const byAsin = new Map();
    for (const product of products) {
      if (!ASIN_PATTERN.test(String(product.asin || ''))) { anomalies.push({ code: 'invalid_catalog_asin', file: product.file }); continue; }
      if (byAsin.has(product.asin)) { anomalies.push({ code: 'duplicate_catalog_asin', asin: product.asin }); continue; }
      byAsin.set(product.asin, product);
      queue.set(product.asin, {
        id: `US:${product.asin}`, asin: product.asin, productSlug: product.slug, state: 'needs-review',
        reason: 'Verify source-backed compatibility, current price and editorial evidence; never auto-publish.',
        ...scoreCatalogProduct(product),
      });
    }
    let providerStatus = dryRun ? 'dry_run' : configuration.status;
    if (!dryRun && configuration.status === 'configured' && !approved) providerStatus = 'awaiting_owner_policy_approval';
    if (!dryRun && configuration.status === 'configured' && approved) {
      const client = clientFactory(configuration.config);
      const ids = [...byAsin.keys()];
      const requests = [];
      for (let index = 0; index < ids.length; index += 10) requests.push({ operation: 'getItems', input: ids.slice(index, index + 10) });
      const keywords = [...new Set(products.map((product) => product.category).filter(Boolean))].slice(0, 6).map((category) => `smart home ${category.replaceAll('-', ' ')}`);
      for (const keyword of keywords) requests.push({ operation: 'searchItems', input: keyword });
      for (const request of requests) {
        try {
          const result = await client[request.operation](request.input);
          if (result.partialErrors) anomalies.push({ code: 'partial_amazon_response', operation: request.operation, count: result.partialErrors });
          for (const item of result.items) {
            if (!ASIN_PATTERN.test(String(item?.asin || ''))) { anomalies.push({ code: 'invalid_provider_asin' }); continue; }
            if (request.operation === 'getItems' && !request.input.includes(item.asin)) { anomalies.push({ code: 'unexpected_provider_asin', asin: item.asin }); continue; }
            // Deliberately persist only ASIN and our workflow metadata. No PAC
            // titles, prices, images, ratings, stock or price-history snapshots.
            const known = byAsin.has(item.asin);
            const prior = candidates.get(item.asin);
            candidates.set(item.asin, { id: `US:${item.asin}`, asin: item.asin, marketplace: 'www.amazon.com',
              state: 'needs-review', catalogMatch: known, firstObservedAt: prior?.firstObservedAt || now.toISOString(),
              operations: [...new Set([...(prior?.operations || []), request.operation])].sort(),
              evidence: 'ASIN returned by official Creators API; relevance, variants, terms and public claims require human verification.',
              priceStored: false, published: false,
            });
            if (!queue.has(item.asin)) queue.set(item.asin, {
              id: `US:${item.asin}`, asin: item.asin, state: 'needs-review',
              reason: 'New ASIN from official search; verify smart-home relevance, exact variant and primary evidence before drafting.',
              dealScore: scoreSignals({}, DEAL_WEIGHTS), trendScore: scoreSignals({}, TREND_WEIGHTS),
              opportunityScore: scoreSignals({}, OPPORTUNITY_WEIGHTS),
            });
          }
        } catch (error) {
          anomalies.push({ code: 'amazon_request_failed', operation: request.operation,
            reason: ['http_error', 'network_or_timeout', 'retry_deferred', 'request_budget_exhausted', 'invalid_json', 'invalid_catalog_response', 'item_lookup_failed', 'invalid_token_response', 'attempts_exhausted'].includes(error.code) ? error.code : 'provider_failure',
            status: Number.isInteger(error.status) ? error.status : 0 });
          if (['retry_deferred', 'request_budget_exhausted'].includes(error.code)) break;
        }
      }
      providerStatus = anomalies.some((item) => ['amazon_request_failed', 'partial_amazon_response', 'invalid_provider_asin', 'unexpected_provider_asin'].includes(item.code)) ? 'partial_failure' : 'collected_for_review';
    }
    const expired = deals.map((deal) => ({ file: deal.file, productSlug: deal.productSlug, ...getDealStatus({ start: deal.startDate, end: deal.endDate }, now) }))
      .filter((deal) => deal.status !== 'active').map(({ msToNext: _unused, ...deal }) => deal);
    let checks;
    try { checks = await checkRunner({ project, reportDir, profile, browserProfile, env }); }
    catch { checks = [{ command: 'quality', status: 'failed', reason: 'check_runner_failed' }]; }
    if (!checks.length) checks = [{ command: 'quality', status: 'not_run', reason: 'no_check_results' }];
    if (projectRevision(project) !== revision) anomalies.push({ code: 'source_changed_during_run', reason: 'Rerun after edits stop so evidence describes one source revision.' });
    const checkPassed = (command) => checks.some((check) => check.command === command && check.status === 'passed');
    const reports = {
      seo: { status: checkPassed('seo:audit') ? 'passed' : 'unverified', report: 'seo-audit/report.json', fieldData: 'not_configured' },
      visual: { status: checkPassed('qa:browser') ? 'passed' : 'unverified', report: 'screenshots/report.json', profile: browserProfile, coverage: browserCoverage },
      'amazon-candidates': { status: providerStatus, configurationReason: configuration.reason, missingConfiguration: configuration.missing || [], candidates: [...candidates.values()].sort((a, b) => a.asin.localeCompare(b.asin)), retention: 'Only ASIN and own review metadata; no persisted Amazon content or historical prices.' },
      'expired-deals': expired, tests: checks, anomalies, 'review-queue': [...queue.values()].sort((a, b) => a.id.localeCompare(b.id)).map((item) => ({
        ...item,
        // Prepared for a durable adapter, not evidence of a remote insert.
        preparedJob: prepareReviewJob({ asin: item.asin, productSlug: item.productSlug ?? null, revision, now: now.toISOString() }).job,
      })),
    };
    let persistenceQualityPassed = QUALITY_COMMANDS.every(checkPassed)
      && (profile !== 'weekly' || checkPassed('lighthouse:mobile'))
      && checks.every((check) => check.status === 'passed') && anomalies.length === 0;
    if (reviewStore && !dryRun && persistenceQualityPassed) {
      try { await evidenceDigests(reportDir, checks, { qualityOnly: true }); }
      catch {
        persistenceQualityPassed = false;
        anomalies.push({ code: 'quality_evidence_unconfirmed' });
      }
    }
    reports['review-persistence'] = await persistReviewQueue(reports['review-queue'], reviewStore, {
      dryRun, qualityPassed: persistenceQualityPassed,
      now: now.toISOString(),
    });
    if (reviewStore && !dryRun && reports['review-persistence'].status !== 'confirmed') anomalies.push({ code: 'review_persistence_unconfirmed' });
    for (const [name, value] of Object.entries(reports)) await atomicJson(join(reportDir, `${name}.json`), value);
    let incomplete = checks.some((check) => check.status !== 'passed') || ['partial_failure', 'invalid_configuration'].includes(providerStatus) || anomalies.length > 0;
    const summary = () => `# FlowHome daily — ${date}\n\nRun status: ${incomplete ? 'needs_attention' : 'complete'}. Mode: ${dryRun ? 'dry run (network disabled)' : 'observe and review only'}. Timezone: ${timezone}.\n\nAmazon: ${providerStatus}. ${candidates.size} unique ASIN candidates. ${queue.size} catalog review items. ${expired.length} expired/upcoming/unknown deal records.\n\nQuality: ${checks.filter((check) => check.status === 'passed').length}/${checks.length} checks passed. Anomalies: ${anomalies.length}.\n\n${reviewPersistenceSummary(reports['review-persistence'], queue.size)}\n\nNo source content, public prices, remote schedules or deployments were changed. Auto-publication is unsupported and disabled. Missing credentials are not replaced by mock prices. Scores expose missing evidence; historical discounts, demand and conversion remain unknown. See JSON reports for actual results.\n`;
    await writeFile(join(reportDir, 'summary.md'), summary());
    let evidence;
    try { evidence = await evidenceDigests(reportDir, checks); }
    catch {
      incomplete = true;
      anomalies.push({ code: 'run_evidence_unconfirmed' });
      await atomicJson(join(reportDir, 'anomalies.json'), anomalies);
      await writeFile(join(reportDir, 'summary.md'), `${summary()}\nRun evidence is incomplete or unreadable. Preserve the reports and inspect missing artifacts before rerunning. This does not undo already confirmed queue writes.\n`);
    }
    await atomicJson(manifestPath, { status: incomplete ? 'needs_attention' : 'complete', fingerprint, verificationKey, browserProfile, browserCoverage,
      startedAt: now.toISOString(), completedAt: new Date().toISOString(), dryRun, profile, timezone, providerStatus,
      publication: 'disabled', reviewPersistence: reports['review-persistence'].status, sourceChanges: [], anomalies: anomalies.length, evidence });
    return { status: incomplete ? 'needs_attention' : 'complete', reportDir, fingerprint, providerStatus };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--dry-run', '--refresh', '--weekly'].includes(arg))) throw new Error('Allowed arguments: --dry-run, --refresh, --weekly');
  const result = await runDaily({ dryRun: args.includes('--dry-run'), refresh: args.includes('--refresh'), profile: args.includes('--weekly') ? 'weekly' : 'daily' });
  console.log(JSON.stringify(result));
  if (['needs_attention', 'locked'].includes(result.status)) process.exitCode = 1;
}
