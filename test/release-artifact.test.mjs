import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createManifest, hash, identityFromEnv, inventory, main, verifyCheckout, verifyManifest } from '../scripts/deploy/release-artifact.mjs';

const identity = { sourceSha: 'a'.repeat(40), runId: '12345', runAttempt: '1', rollbackDeploymentId: '11111111-2222-3333-4444-555555555555' };
const bytesOf = (manifest) => Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'flowhome-release-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dist = path.join(root, 'dist');
  mkdirSync(path.join(dist, '.well-known'), { recursive: true });
  writeFileSync(path.join(dist, 'index.html'), '<h1>FlowHome</h1>');
  writeFileSync(path.join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n');
  writeFileSync(path.join(dist, '.well-known', 'security.txt'), 'Contact: https://flowhome.dev/about/');
  writeFileSync(path.join(dist, 'image.png'), Buffer.from([0, 1, 2, 255]));
  const manifest = createManifest(dist, identity);
  const bytes = bytesOf(manifest);
  return { root, dist, manifest, bytes, expected: { ...identity, manifestSha256: hash(bytes) } };
}

test('manifest is deterministic and preserves binary files, Pages headers and reviewed hidden paths', (t) => {
  const f = fixture(t);
  assert.deepEqual(createManifest(f.dist, identity), f.manifest);
  assert.equal(f.manifest.files.length, 4);
  assert.equal(f.manifest.files[0].path, '.well-known/security.txt');
  const downloaded = path.join(f.root, 'downloaded');
  cpSync(f.dist, downloaded, { recursive: true });
  assert.deepEqual(verifyManifest(downloaded, f.bytes, f.expected), f.manifest);
});

for (const mode of ['modified', 'added', 'missing']) {
  test(`verifier fails closed on ${mode} artifact bytes`, (t) => {
    const f = fixture(t);
    if (mode === 'modified') writeFileSync(path.join(f.dist, 'image.png'), Buffer.from([0, 1, 2, 254]));
    if (mode === 'added') writeFileSync(path.join(f.dist, 'unexpected.html'), 'extra');
    if (mode === 'missing') rmSync(path.join(f.dist, '_headers'));
    assert.throws(() => verifyManifest(f.dist, f.bytes, f.expected), /Artifact files differ/);
  });
}

test('manifest tampering is rejected against a digest independent of the downloaded manifest', (t) => {
  const f = fixture(t);
  const changed = bytesOf({ ...f.manifest, sourceSha: 'b'.repeat(40) });
  assert.throws(() => verifyManifest(f.dist, changed, f.expected), /Manifest digest mismatch/);
  assert.throws(() => verifyManifest(f.dist, f.bytes, { ...f.expected, manifestSha256: '' }), /trusted manifest digest/);
});

test('a different source, workflow run or run attempt cannot reuse the artifact', (t) => {
  const f = fixture(t);
  for (const [key, value] of [['sourceSha', 'b'.repeat(40)], ['runId', '12346'], ['runAttempt', '2']]) {
    assert.throws(() => verifyManifest(f.dist, f.bytes, { ...f.expected, [key]: value }), /mismatch/);
  }
});

test('malformed manifest metadata and path traversal are rejected even if rehashed', (t) => {
  const f = fixture(t);
  for (const change of [
    { project: 'another-site' }, { branch: 'preview' }, { schemaVersion: 2 }, { sourceSha: 'main' },
    { runAttempt: '0' }, { rollbackDeploymentId: 'invalid' }, { distSha256: '0'.repeat(64) },
    { files: [] }, { files: [{ ...f.manifest.files[0], path: '../outside' }] },
    { files: [{ ...f.manifest.files[0], path: 'C:/outside' }] },
    { files: [{ ...f.manifest.files[0], path: '/outside' }] },
    { files: [{ ...f.manifest.files[0], path: 'folder\\outside' }] },
    { files: [{ ...f.manifest.files[0], size: -1 }] },
  ]) {
    const bytes = bytesOf({ ...f.manifest, ...change });
    assert.throws(() => verifyManifest(f.dist, bytes, { ...f.expected, manifestSha256: hash(bytes) }));
  }
});

test('production identity requires an explicit rollback ID; verification-only runs may omit it', () => {
  const env = { RELEASE_SOURCE_SHA: identity.sourceSha, GITHUB_RUN_ID: '12345', GITHUB_RUN_ATTEMPT: '1' };
  assert.equal(identityFromEnv(env).rollbackDeploymentId, null);
  assert.throws(() => identityFromEnv({ ...env, RELEASE_DEPLOY_PRODUCTION: 'true' }), /rollback deployment ID/);
  assert.equal(identityFromEnv({ ...env, RELEASE_DEPLOY_PRODUCTION: 'true', RELEASE_ROLLBACK_DEPLOYMENT_ID: identity.rollbackDeploymentId }).rollbackDeploymentId, identity.rollbackDeploymentId);
});

test('artifact symlinks, hidden secrets, server code and empty roots are rejected', (t) => {
  const f = fixture(t);
  const outside = path.join(f.root, 'outside');
  mkdirSync(outside);
  const linked = path.join(f.dist, 'linked');
  symlinkSync(outside, linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => inventory(f.dist), /Symlinks/);
  rmSync(linked);
  for (const name of ['.env', '_worker.js']) {
    const file = path.join(f.dist, name);
    writeFileSync(file, 'not a production asset');
    assert.throws(() => inventory(f.dist), /hidden|static Pages/);
    rmSync(file);
  }
  writeFileSync(path.join(f.dist, 'private.pem'), ['-----BEGIN', 'PRIVATE KEY-----'].join(' '));
  assert.throws(() => inventory(f.dist), /Private key/);
  assert.throws(() => inventory(outside), /index.html/);
});

test('CLI creates and checks evidence without confusing a changed main branch with the pinned checkout', (t) => {
  const f = fixture(t);
  const git = (...args) => execFileSync('git', args, { cwd: f.root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  writeFileSync(path.join(f.root, '.gitignore'), 'dist/\n');
  writeFileSync(path.join(f.root, 'source.txt'), 'verified source');
  git('init', '-b', 'main');
  git('add', '.gitignore', 'source.txt');
  git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-m', 'fixture');
  const sha = git('rev-parse', 'HEAD');
  // Move generated evidence outside the release checkout.
  const evidence = mkdtempSync(path.join(os.tmpdir(), 'flowhome-release-evidence-'));
  t.after(() => rmSync(evidence, { recursive: true, force: true }));
  const env = {
    RELEASE_SOURCE_SHA: sha, GITHUB_RUN_ID: '12345', GITHUB_RUN_ATTEMPT: '1',
    RELEASE_MANIFEST_PATH: path.join(evidence, 'manifest.json'), GITHUB_OUTPUT: path.join(evidence, 'outputs'),
    RELEASE_ROLLBACK_DEPLOYMENT_ID: identity.rollbackDeploymentId, RELEASE_DEPLOY_PRODUCTION: 'true',
    RELEASE_MANIFEST_SHA256: '',
  };
  writeFileSync(path.join(f.dist, 'release-environment.json'), JSON.stringify({ schemaVersion: 1, environment: 'production', authEnabled: false, analyticsEnabled: false, supabaseProjectRef: null }));
  // The test-only empty directory outside dist is untracked but has no files.
  const manifest = main('create', env, f.root);
  const bytes = readFileSync(env.RELEASE_MANIFEST_PATH);
  env.RELEASE_MANIFEST_SHA256 = hash(bytes);
  assert.match(readFileSync(env.GITHUB_OUTPUT, 'utf8'), new RegExp(`source_sha=${sha}`));
  assert.equal(main('verify', env, f.root).distSha256, manifest.distSha256);
  assert.throws(() => main('create', env, f.root), /EEXIST/);
  writeFileSync(path.join(f.root, 'source.txt'), 'changed source');
  assert.throws(() => verifyCheckout(f.root, sha), /Tracked source changed/);
  git('add', 'source.txt');
  git('-c', 'user.name=Release test', '-c', 'user.email=release-test@example.invalid', 'commit', '-m', 'main advances');
  assert.throws(() => main('verify', env, f.root), /Checkout differs/);
  git('checkout', '--detach', sha);
  assert.equal(main('verify', env, f.root).sourceSha, sha);
  writeFileSync(path.join(f.root, 'untracked-source.txt'), 'unexpected');
  assert.throws(() => verifyCheckout(f.root, sha), /Untracked source/);
});

test('quality report can be generated outside versioned source without changing its historical report', (t) => {
  const f = fixture(t);
  mkdirSync(path.join(f.root, 'src', 'content', 'reviews'), { recursive: true });
  mkdirSync(path.join(f.root, 'data'));
  const historical = path.join(f.root, 'data', 'quality-report.json');
  writeFileSync(historical, '{"historical":true}');
  const report = path.join(f.root, 'isolated-report.json');
  const script = fileURLToPath(new URL('../scripts/content/quality-check.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script], { cwd: f.root, encoding: 'utf8', env: { ...process.env, QUALITY_REPORT_PATH: report } });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(historical, 'utf8'), '{"historical":true}');
  assert.deepEqual(JSON.parse(readFileSync(report, 'utf8')).results, []);
});
