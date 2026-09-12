import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const workflowUrl = new URL('../.github/workflows/site-health.yml', import.meta.url);

test('health workflow is isolated, read-only, opt-in and independently stoppable', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  assert.match(workflow, /cron: '17 13 \* \* \*'/);
  assert.match(workflow, /github\.repository == 'manuberrocal-ai\/flowhome'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /FLOWHOME_HEALTH_KILL_SWITCH != 'true'/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch' \|\| vars\.FLOWHOME_HEALTH_SCHEDULE_ENABLED == 'true'/);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /timeout-minutes: 3/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /secrets\.|: write|npm (?:ci|install|run)|workflow_run:|pull_request:|push:|issues:|webhook/i);
});

test('health workflow preserves its bounded report and propagates observation failures', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  assert.match(workflow, /run: node scripts\/qa\/site-health\.mjs https:\/\/flowhome\.dev > "\$RUNNER_TEMP\/site-health\.json"/);
  assert.doesNotMatch(workflow, /continue-on-error|\|\| true|exit 0|deploy:|indexnow|websub/i);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /retention-days: 14/);
  assert.match(workflow, /flowhome-health-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
  const uses = [...workflow.matchAll(/uses: ([^\s]+)@([^\s]+)/g)];
  assert.equal(uses.length, 3);
  assert.ok(uses.every(([, , revision]) => /^[0-9a-f]{40}$/.test(revision)));
});

test('real CLI returns valid JSON and a failing exit for a local HTTP incident, then recovers', async () => {
  let incident = false;
  const requests = [];
  const server = createServer((request, response) => {
    requests.push(request.url);
    if (incident && request.url === '/product/amazon-smart-thermostat/') {
      response.writeHead(503, { 'content-type': 'text/html' });
      response.end('private incident details must not appear in the report');
      return;
    }
    const route = request.url;
    const cta = route.startsWith('/product/') ? '<a href="https://www.amazon.com/dp/B08J4C8871?tag=flowhome-20" target="_blank" rel="nofollow sponsored noopener noreferrer" data-fh-amazon-cta data-cta-position="hero">Amazon</a>' : '';
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(`<html><head><title>FlowHome test</title><link rel="canonical" href="https://flowhome.dev${route}">${route === '/cart/' ? '<meta name="robots" content="noindex,follow">' : ''}</head><body><h1>Test</h1>${cta}</body></html>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const run = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL('../scripts/qa/site-health.mjs', import.meta.url)), `http://127.0.0.1:${server.address().port}`], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (bytes) => { stdout += bytes; });
    child.stderr.on('data', (bytes) => { stderr += bytes; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
  try {
    for (const failed of [false, true, false]) {
      incident = failed;
      const result = await run();
      assert.equal(result.code, failed ? 1 : 0);
      assert.equal(result.stderr, '');
      const report = JSON.parse(result.stdout);
      assert.equal(report.status, failed ? 'needs_attention' : 'passed');
      assert.equal(report.checks.length, 3);
      assert.deepEqual(report.checks[1].codes, failed ? ['http_status_unexpected'] : []);
      assert.ok(!result.stdout.includes('private incident details'));
    }
    assert.deepEqual(requests, Array.from({ length: 3 }, () => ['/', '/product/amazon-smart-thermostat/', '/cart/']).flat());
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
