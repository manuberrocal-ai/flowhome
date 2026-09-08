import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { main, prepareDeploymentUrls, shouldNotifyDeployment } from '../scripts/deploy/deployed-urls.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = (file) => readFile(path.join(root, '.github', 'workflows', file), 'utf8');

async function deploymentFixture() {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'flowhome-notification-policy-'));
  const current = path.join(temp, 'current');
  const previous = path.join(temp, 'previous');
  await Promise.all([mkdir(current), mkdir(previous)]);
  return { temp, current, previous };
}

async function writePage(dist, pathname, content) {
  const directory = path.join(dist, pathname.replace(/^\//, ''), 'index.html');
  await mkdir(path.dirname(directory), { recursive: true });
  await writeFile(directory, content);
}

async function writeSitemap(dist, urls) {
  await writeFile(path.join(dist, 'sitemap-0.xml'), `<urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
}

test('daily automation queues review without deployment or discovery notifications', async () => {
  const automation = await source('automation.yml');
  for (const command of ['npm run flowhome:daily', 'upload-artifact', 'FLOWHOME_DAILY_SCHEDULE_ENABLED', 'DAILY_AUTOPUBLISH']) {
    assert.match(automation, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(automation, /websub:publish|indexnow:submit|deploy:cloudflare|git push/i);
  assert.match(automation, /contents: read/);
  assert.match(automation, /persist-credentials: false/);
});

test('preparation policy skips schedule and first pushes without reading dist directories', () => {
  assert.deepEqual(prepareDeploymentUrls({ eventName: 'schedule', currentDist: 'missing-current', previousDist: 'missing-previous' }), []);
  assert.deepEqual(prepareDeploymentUrls({
    eventName: 'push',
    beforeSha: '0000000000000000000000000000000000000000',
    currentDist: 'missing-current',
    previousDist: 'missing-previous',
  }), []);
});

test('preparation policy derives push deltas and validates workflow-dispatch input from the environment', async (t) => {
  const { temp, current, previous } = await deploymentFixture();
  t.after(() => rm(temp, { recursive: true, force: true }));
  const changed = 'https://flowhome.dev/changed/';
  const added = 'https://flowhome.dev/added/';
  const unchanged = 'https://flowhome.dev/unchanged/';
  await Promise.all([
    writeSitemap(current, [changed, added, unchanged]),
    writeSitemap(previous, [changed, unchanged]),
    writePage(current, '/changed/', 'new'),
    writePage(previous, '/changed/', 'old'),
    writePage(current, '/added/', 'new'),
    writePage(current, '/unchanged/', 'same'),
    writePage(previous, '/unchanged/', 'same'),
  ]);
  assert.deepEqual(prepareDeploymentUrls({ eventName: 'push', beforeSha: 'abc', currentDist: current, previousDist: previous }), [added, changed]);

  const output = path.join(temp, 'urls.txt');
  const githubOutput = path.join(temp, 'github-output.txt');
  await writeFile(githubOutput, '');
  assert.deepEqual(main(['--prepare', '--event-name', 'workflow_dispatch', '--current-dist', current, '--output', output, '--github-output', githubOutput], {
    DEPLOYED_URLS_MANUAL_INPUT: ` ${added}\n${changed}\n${added} `,
  }), [added, changed]);
  assert.equal(await readFile(output, 'utf8'), `${added}\n${changed}\n`);
  assert.equal(await readFile(githubOutput, 'utf8'), 'has_urls=true\n');
  assert.throws(() => prepareDeploymentUrls({
    eventName: 'workflow_dispatch',
    currentDist: current,
    manualInput: `${changed}\n$(touch should-not-run)`,
  }), /Invalid canonical URL/);
});

test('post-deploy policy permits only successful push or manual deployments with URLs', async (t) => {
  for (const [eventName, deployOutcome, hasUrls, expected] of [
    ['push', 'skipped', true, false],
    ['push', 'failure', true, false],
    ['push', 'success', false, false],
    ['push', 'success', true, true],
    ['workflow_dispatch', 'success', true, true],
    ['schedule', 'success', true, false],
  ]) {
    assert.equal(shouldNotifyDeployment({ eventName, deployOutcome, hasUrls }), expected);
  }

  const temp = await mkdtemp(path.join(os.tmpdir(), 'flowhome-notification-output-'));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const githubOutput = path.join(temp, 'github-output.txt');
  await writeFile(githubOutput, '');
  assert.equal(main(['--decide-notifications', '--event-name', 'push', '--deploy-outcome', 'success', '--has-urls', 'true', '--github-output', githubOutput]), true);
  assert.equal(await readFile(githubOutput, 'utf8'), 'notify=true\n');
});

test('batched deploy verifies on push and cron, while production deploy is manual and protected', async () => {
  const workflow = await source('batched-deploy.yml');
  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(workflow, /schedule:\s*\n\s*- cron:/);
  const pushTrigger = workflow.slice(workflow.indexOf('  push:'), workflow.indexOf('\n\npermissions:'));
  assert.doesNotMatch(pushTrigger, /paths-ignore/);
  assert.match(workflow, /deploy_production:[\s\S]*required:\s*true[\s\S]*default:\s*false[\s\S]*type:\s*boolean/);
  assert.match(workflow, /deploy-production:\s*\n\s*needs: verify/);
  assert.match(workflow, /environment:\s*production/);
  assert.match(workflow, /group:\s*flowhome-production[\s\S]*cancel-in-progress:\s*false/);
  assert.match(workflow, /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/);
  assert.match(workflow, /actions\/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c/);
  assert.match(workflow, /has_urls:\s*\$\{\{ steps\.notification-urls\.outputs\.has_urls \}\}/);

  const verify = workflow.slice(workflow.indexOf('  verify:'), workflow.indexOf('  deploy-production:'));
  const production = workflow.slice(workflow.indexOf('  deploy-production:'));
  assert.doesNotMatch(verify, /wrangler-action|Deploy to Cloudflare Pages|websub:publish|indexnow:submit/);
  assert.match(production, /if:\s*\$\{\{ github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && inputs\.deploy_production == true \}\}/);
  assert.match(production, /- uses: actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\s+with:\s+ref: \$\{\{ needs\.verify\.outputs\.source_sha \}\}/);
  assert.doesNotMatch(production, /ref: main/);
  assert.match(production, /cloudflare\/wrangler-action@9acf94ace14e7dc412b076f2c5c20b8ce93c79cd/);
  assert.match(production, /needs\.verify\.outputs\.has_urls/);
  assert.match(production, /deployment-urls\/deployed-urls\.txt/);

  assert.match(workflow, /--prepare/);
  assert.match(workflow, /--decide-notifications/);
  assert.match(workflow, /id: notification-decision/);
  assert.match(production, /name: Publish WebSub update[\s\S]*name: Submit IndexNow via default endpoint/);
  assert.match(production, /steps\.notification-decision\.outputs\.notify == 'true'/);
});

test('release artifacts are pinned by immutable ID and checked before credentials and deployment', async () => {
  const workflow = await source('batched-deploy.yml');
  const verify = workflow.slice(workflow.indexOf('  verify:'), workflow.indexOf('  deploy-production:'));
  const production = workflow.slice(workflow.indexOf('  deploy-production:'));
  assert.match(verify, /ref: \$\{\{ github\.sha \}\}/);
  assert.match(verify, /QUALITY_REPORT_PATH: \$\{\{ runner\.temp \}\}\/quality-report\.json/);
  assert.match(verify, /source_sha: \$\{\{ steps\.release-manifest\.outputs\.source_sha \}\}/);
  assert.match(verify, /manifest_sha256: \$\{\{ steps\.release-manifest\.outputs\.manifest_sha256 \}\}/);
  assert.ok(verify.indexOf('npm run seo:audit') < verify.indexOf('release-artifact.mjs create'));
  assert.ok(verify.indexOf('release-artifact.mjs create') < verify.indexOf('Upload static artifact'));
  assert.match(verify, /include-hidden-files: true/);
  assert.match(verify, /flowhome-dist-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  for (const artifact of ['artifact_id', 'manifest_artifact_id', 'urls_artifact_id']) {
    assert.match(production, new RegExp(`artifact-ids: \\$\\{\\{ needs\\.verify\\.outputs\\.${artifact} \\}\\}`));
  }
  for (const command of ['Require Cloudflare credentials', 'npm run deploy:check', 'release-record.mjs preflight', 'Deploy to Cloudflare Pages']) {
    assert.ok(production.indexOf('release-artifact.mjs verify') < production.indexOf(command));
  }
  assert.ok(production.indexOf('release-record.mjs preflight') < production.indexOf('Deploy to Cloudflare Pages'));
  assert.ok(production.indexOf('Deploy to Cloudflare Pages') < production.indexOf('release-record.mjs record'));
  assert.match(production, /--commit-hash \$\{\{ needs\.verify\.outputs\.source_sha \}\} --commit-dirty=false/);
  assert.match(production, /DEPLOYMENT_OUTCOME: \$\{\{ steps\.release-record\.outcome \}\}/);
  assert.match(production, /Preserve release and recovery evidence\s+if: \$\{\{ always\(\) \}\}/);
  assert.match(production, /RELEASE_DEPLOYMENT_URL: \$\{\{ steps\.deploy\.outputs\.deployment-url \}\}/);
  assert.match(production, /NPM_CONFIG_SAVE: 'false'/);
  assert.match(production, /NPM_CONFIG_PACKAGE_LOCK: 'false'/);
  assert.match(production, /wranglerVersion: '4\.129\.0'/);
  assert.match(production, /preCommands: node scripts\/deploy\/release-artifact\.mjs verify/);
});
