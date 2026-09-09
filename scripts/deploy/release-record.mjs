import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEPLOYMENT_ID, SHA, main as verifyArtifact } from './release-artifact.mjs';

const PROJECT = 'flowhome';
function deploymentSnapshot(deployment, subdomain) {
  assert.match(deployment?.id, DEPLOYMENT_ID, 'Invalid Pages deployment ID');
  assert.equal(deployment.environment, 'production', 'Deployment is not production');
  assert.equal(deployment.latest_stage?.name, 'deploy', 'Deployment has not reached deploy stage');
  assert.equal(deployment.latest_stage?.status, 'success', 'Deployment is not successful');
  const metadata = deployment.deployment_trigger?.metadata;
  assert.equal(metadata?.branch, 'main', 'Wrong deployment branch');
  assert.match(metadata.commit_hash, SHA, 'Missing deployment source SHA');
  assert.equal(typeof metadata.commit_dirty, 'boolean', 'Unknown source cleanliness');
  assert.ok(Number.isFinite(Date.parse(deployment.created_on)), 'Missing deployment timestamp');
  const url = new URL(deployment.url);
  assert.ok(url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && url.pathname === '/', 'Invalid Pages deployment URL');
  assert.ok(url.hostname.endsWith(`.${subdomain}`), 'Deployment URL is outside project');
  return { id: deployment.id, url: url.origin, sourceSha: metadata.commit_hash, commitDirty: metadata.commit_dirty, createdAt: deployment.created_on };
}

export async function getProject(env, fetcher = fetch) {
  assert.match(env.CLOUDFLARE_ACCOUNT_ID, /^[a-f0-9]{32}$/, 'Invalid Cloudflare account identifier');
  assert.ok(env.CLOUDFLARE_API_TOKEN, 'Cloudflare API token is required');
  const response = await fetcher(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT}`, {
    method: 'GET', redirect: 'error', headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }, signal: AbortSignal.timeout(15000),
  });
  // Do not print server payloads: project responses can include environment secrets.
  assert.ok(response.ok, `Cloudflare read failed (HTTP ${response.status})`);
  const payload = await response.json();
  assert.equal(payload.success, true, 'Cloudflare project read was unsuccessful');
  const project = payload.result;
  assert.equal(project?.name, PROJECT, 'Wrong Pages project');
  assert.equal(project.production_branch, 'main', 'Wrong Pages production branch');
  assert.ok(project.domains?.includes('flowhome.dev'), 'Production domain is not attached to project');
  assert.match(project.subdomain, /^[a-z0-9-]+\.pages\.dev$/, 'Invalid Pages project subdomain');
  // The protected workflow must remain the only publication path. Missing
  // controls are unknown, not equivalent to disabled automatic deployments.
  const controls = project.source?.config;
  assert.equal(controls?.production_deployments_enabled, false, 'Automatic production deployments must be disabled');
  assert.equal(controls?.preview_deployment_setting, 'none', 'Automatic preview deployments must be disabled');
  return { project: PROJECT, productionDomain: 'https://flowhome.dev', current: deploymentSnapshot(project.canonical_deployment, project.subdomain) };
}

export async function prepareRelease(manifest, env, fetcher = fetch) {
  assert.match(manifest.rollbackDeploymentId, DEPLOYMENT_ID, 'Approved rollback ID is required');
  const observed = await getProject(env, fetcher);
  assert.equal(observed.current.id, manifest.rollbackDeploymentId, 'Production changed since rollback target was approved');
  return {
    schemaVersion: 1, phase: 'preflight', checkedAt: new Date().toISOString(), project: PROJECT,
    sourceSha: manifest.sourceSha, runId: manifest.runId, runAttempt: manifest.runAttempt,
    manifestSha256: env.RELEASE_MANIFEST_SHA256, distSha256: manifest.distSha256,
    rollback: observed.current, productionDomain: observed.productionDomain,
    artifactId: env.RELEASE_ARTIFACT_ID || null,
  };
}

export async function recordRelease(manifest, preflight, env, fetcher = fetch) {
  assert.equal(preflight.phase, 'preflight', 'Missing release preflight');
  for (const key of ['sourceSha', 'runId', 'runAttempt', 'distSha256']) assert.equal(preflight[key], manifest[key], 'Preflight identity mismatch');
  assert.equal(preflight.manifestSha256, env.RELEASE_MANIFEST_SHA256, 'Preflight manifest mismatch');
  assert.equal(preflight.rollback?.id, manifest.rollbackDeploymentId, 'Preflight rollback mismatch');
  const observed = await getProject(env, fetcher);
  assert.notEqual(observed.current.id, preflight.rollback.id, 'No new canonical deployment observed');
  assert.equal(observed.current.sourceSha, manifest.sourceSha, 'Deployed SHA differs from verified source');
  assert.equal(observed.current.commitDirty, false, 'Published source was marked dirty');
  assert.equal(observed.current.url, env.RELEASE_DEPLOYMENT_URL, 'Canonical deployment differs from Wrangler result');
  return { ...preflight, phase: 'deployed', observedAt: new Date().toISOString(), deployment: observed.current, onlineSmoke: 'pending-separate-verification' };
}

export async function main(mode, env = process.env, root = process.cwd(), fetcher = fetch) {
  assert.ok(mode === 'preflight' || mode === 'record', 'Use the protected Batched Deploy workflow; direct unverified deployment is disabled');
  // Always verify local artifact integrity before sending even a read-only API request.
  const manifest = verifyArtifact('verify', env, root);
  assert.ok(env.RELEASE_EVIDENCE_PATH, 'RELEASE_EVIDENCE_PATH is required');
  const directory = path.resolve(root, env.RELEASE_EVIDENCE_PATH);
  mkdirSync(directory, { recursive: true });
  const preflightPath = path.join(directory, 'preflight.json');
  const record = mode === 'preflight'
    ? await prepareRelease(manifest, env, fetcher)
    : await recordRelease(manifest, JSON.parse(readFileSync(preflightPath, 'utf8')), env, fetcher);
  writeFileSync(path.join(directory, mode === 'preflight' ? 'preflight.json' : 'deployment.json'), `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' });
  return record;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await main(process.argv[2]);
    console.log(`Release ${result.phase} recorded for source ${result.sourceSha}; rollback ${result.rollback.id}`);
  } catch (error) {
    console.error(`Release record rejected: ${error.code === 'ERR_ASSERTION' ? error.message.split('\n')[0] : 'invalid or unavailable release evidence'}`);
    process.exitCode = 1;
  }
}
