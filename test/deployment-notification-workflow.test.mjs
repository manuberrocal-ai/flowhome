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

test('automation retains operations but has no discovery notifications', async () => {
  const automation = await source('automation.yml');
  for (const command of ['discover:products', 'deals:detect', 'syndicate', 'maintenance:weekly', 'npm run build', 'upload-artifact']) {
    assert.match(automation, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  }
  assert.doesNotMatch(automation, /websub:publish|indexnow:submit/i);
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

test('batched deploy delegates tested policy modes and keeps notifications after deployment', async () => {
  const workflow = await source('batched-deploy.yml');
  assert.match(workflow, /--prepare/);
  assert.match(workflow, /--decide-notifications/);
  assert.match(workflow, /id: notification-decision/);
  const deploy = workflow.indexOf('name: Deploy to Cloudflare Pages');
  const websub = workflow.indexOf('name: Publish WebSub update');
  const indexNow = workflow.indexOf('name: Submit IndexNow via default endpoint');
  assert.ok(deploy < websub && websub < indexNow);
  const notificationSteps = workflow.slice(websub, workflow.indexOf('name: Upload static artifact'));
  assert.doesNotMatch(notificationSteps, /steps\.deploy\.outcome|notification-urls\.outputs\.has_urls/);
  assert.match(notificationSteps, /steps\.notification-decision\.outputs\.notify == 'true'/);
});
