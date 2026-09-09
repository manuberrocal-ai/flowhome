import assert from 'node:assert/strict';
import test from 'node:test';
import { getProject, prepareRelease, recordRelease, main } from '../scripts/deploy/release-record.mjs';

const previousId = '11111111-2222-3333-4444-555555555555';
const currentId = '99999999-2222-3333-4444-555555555555';
const manifest = { sourceSha: 'a'.repeat(40), runId: '12345', runAttempt: '1', rollbackDeploymentId: previousId, distSha256: 'b'.repeat(64) };
const env = { CLOUDFLARE_ACCOUNT_ID: 'c'.repeat(32), CLOUDFLARE_API_TOKEN: 'test-fixture-not-a-real-token', RELEASE_MANIFEST_SHA256: 'd'.repeat(64), RELEASE_ARTIFACT_ID: '789' };
function project() {
  return {
    name: 'flowhome', production_branch: 'main', domains: ['flowhome.dev'], subdomain: 'flowhome-test.pages.dev',
    source: { config: { production_deployments_enabled: false, preview_deployment_setting: 'none' } },
    // This field must never be copied into a release record.
    deployment_configs: { production: { env_vars: { PRIVATE: { value: 'private-fixture' } } } },
    canonical_deployment: {
      id: previousId, environment: 'production', latest_stage: { name: 'deploy', status: 'success' },
      deployment_trigger: { metadata: { branch: 'main', commit_hash: 'e'.repeat(40), commit_dirty: true } },
      created_on: '2026-09-01T10:00:00.000Z', url: 'https://11111111.flowhome-test.pages.dev',
    },
  };
}
const response = (value) => async () => ({ ok: true, status: 200, json: async () => ({ success: true, result: value }) });

test('preflight performs only a bounded authenticated GET and records exact rollback without copying secrets', async () => {
  const record = await prepareRelease(manifest, env, async (url, options) => {
    assert.equal(url, `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/flowhome`);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${env.CLOUDFLARE_API_TOKEN}`);
    assert.ok(options.signal instanceof AbortSignal);
    return response(project())();
  });
  assert.equal(record.rollback.id, previousId);
  assert.equal(record.rollback.commitDirty, true, 'Historical dirty deployments remain honestly marked');
  assert.doesNotMatch(JSON.stringify(record), /private-fixture|test-fixture-not-a-real-token|env_vars/);
});

test('preflight blocks changed production, previews, failed runs, wrong project/domain/branch and unsafe URLs', async () => {
  for (const mutate of [
    p => { p.canonical_deployment.id = currentId; },
    p => { p.canonical_deployment.environment = 'preview'; },
    p => { p.canonical_deployment.latest_stage.status = 'idle'; },
    p => { p.canonical_deployment.latest_stage.name = 'queued'; },
    p => { p.name = 'another-project'; },
    p => { p.production_branch = 'preview'; },
    p => { p.domains = ['other.dev']; },
    p => { p.canonical_deployment.url = 'https://attacker.example/'; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_dirty = undefined; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_hash = 'main'; },
  ]) {
    const p = project(); mutate(p);
    await assert.rejects(prepareRelease(manifest, env, response(p)));
  }
  await assert.rejects(prepareRelease({ ...manifest, rollbackDeploymentId: null }, env, response(project())));
});

test('API errors and redirects cannot be treated as valid rollback evidence', async () => {
  await assert.rejects(getProject(env, async () => ({ ok: false, status: 401 })), /HTTP 401/);
  await assert.rejects(getProject(env, async () => ({ ok: false, status: 302 })), /HTTP 302/);
  await assert.rejects(getProject(env, async () => ({ ok: true, json: async () => ({ success: false }) })), /unsuccessful/);
  await assert.rejects(getProject({ ...env, CLOUDFLARE_API_TOKEN: '' }, () => { throw new Error('Should not request'); }), /token is required/);
});

test('preflight fails closed on enabled, missing or malformed automatic deployment controls', async () => {
  for (const value of [true, undefined, null, 'false', 0]) {
    const p = project();
    p.source.config.production_deployments_enabled = value;
    await assert.rejects(prepareRelease(manifest, env, response(p)), /Automatic production deployments/);
  }
  for (const value of ['all', 'custom', undefined, null, false, 'NONE']) {
    const p = project();
    p.source.config.preview_deployment_setting = value;
    await assert.rejects(prepareRelease(manifest, env, response(p)), /Automatic preview deployments/);
  }
  for (const mutate of [p => { delete p.source; }, p => { delete p.source.config; }]) {
    const p = project(); mutate(p);
    await assert.rejects(prepareRelease(manifest, env, response(p)), /Automatic production deployments/);
  }
});

test('release record requires a new clean canonical deployment with the exact source and Wrangler URL', async () => {
  const before = await prepareRelease(manifest, env, response(project()));
  const after = project();
  after.canonical_deployment.id = currentId;
  after.canonical_deployment.url = 'https://99999999.flowhome-test.pages.dev';
  after.canonical_deployment.deployment_trigger.metadata = { branch: 'main', commit_hash: manifest.sourceSha, commit_dirty: false };
  const deployedEnv = { ...env, RELEASE_DEPLOYMENT_URL: after.canonical_deployment.url };
  const record = await recordRelease(manifest, before, deployedEnv, response(after));
  assert.equal(record.deployment.id, currentId);
  assert.equal(record.onlineSmoke, 'pending-separate-verification');
  for (const mutate of [
    p => { p.canonical_deployment.id = previousId; },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_hash = 'f'.repeat(40); },
    p => { p.canonical_deployment.deployment_trigger.metadata.commit_dirty = true; },
    p => { p.canonical_deployment.url = 'https://different.flowhome-test.pages.dev'; },
    p => { p.source.config.production_deployments_enabled = true; },
    p => { p.source.config.preview_deployment_setting = 'all'; },
  ]) {
    const changed = structuredClone(after); mutate(changed);
    await assert.rejects(recordRelease(manifest, before, deployedEnv, response(changed)));
  }
  await assert.rejects(recordRelease(manifest, { ...before, runId: '999' }, deployedEnv, response(after)), /identity mismatch/);
});

test('the legacy unverified deployment shortcut cannot contact Cloudflare', async () => {
  await assert.rejects(main('protected-workflow-required', {}, '.', () => { throw new Error('Must never call'); }), /direct unverified deployment is disabled/);
});
