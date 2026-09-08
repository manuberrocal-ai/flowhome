import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SHA = /^[a-f0-9]{40}$/;
export const DIGEST = /^[a-f0-9]{64}$/;
export const DEPLOYMENT_ID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function safePath(value) {
  assert.ok(typeof value === 'string' && value.length > 0 && !/[\\:]/.test(value)
    && [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127), 'Unsafe artifact path');
  const parts = value.split('/');
  assert.ok(parts.every((part) => part && part !== '.' && part !== '..' && !/[. ]$/.test(part)), 'Unsafe artifact path');
  assert.ok(parts.every((part) => !part.startsWith('.') || part === '.well-known'), 'Unreviewed hidden artifact file');
  assert.ok(!parts.some((part) => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)), 'Non-portable artifact path');
  assert.ok(!/^_worker\.js(?:\/|$)|^functions\//.test(value), 'Only static Pages artifacts are supported');
}

export function inventory(dist) {
  assert.ok(lstatSync(dist).isDirectory() && !lstatSync(dist).isSymbolicLink(), 'Artifact root must be a real directory');
  const files = [];
  function walk(directory, prefix = '') {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      safePath(relative);
      const absolute = path.join(directory, entry.name);
      const stat = lstatSync(absolute);
      assert.ok(!stat.isSymbolicLink(), 'Symlinks are forbidden in release artifacts');
      if (stat.isDirectory()) walk(absolute, `${relative}/`);
      else {
        assert.ok(stat.isFile(), 'Only regular artifact files are supported');
        const bytes = readFileSync(absolute);
        assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(bytes.toString('utf8')), 'Private key material in artifact');
        files.push({ path: relative, size: bytes.length, sha256: hash(bytes) });
      }
    }
  }
  walk(dist);
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  assert.ok(files.some((file) => file.path === 'index.html'), 'Artifact must contain index.html');
  assert.equal(new Set(files.map((file) => file.path.toLowerCase())).size, files.length, 'Case-colliding artifact paths');
  return files;
}

function validateIdentity({ sourceSha, runId, runAttempt, rollbackDeploymentId = null }) {
  assert.match(sourceSha, SHA, 'Invalid source SHA');
  assert.match(runId, /^[1-9]\d*$/, 'Invalid workflow run ID');
  assert.match(runAttempt, /^[1-9]\d*$/, 'Invalid workflow run attempt');
  if (rollbackDeploymentId !== null) assert.match(rollbackDeploymentId, DEPLOYMENT_ID, 'Invalid rollback deployment ID');
}

export function createManifest(dist, identity) {
  validateIdentity(identity);
  const files = inventory(dist);
  return {
    schemaVersion: 1, project: 'flowhome', branch: 'main', sourceSha: identity.sourceSha,
    runId: identity.runId, runAttempt: identity.runAttempt,
    rollbackDeploymentId: identity.rollbackDeploymentId ?? null,
    distSha256: hash(JSON.stringify(files)), files,
  };
}

export function verifyManifest(dist, bytes, expected) {
  assert.match(expected.manifestSha256, DIGEST, 'Missing trusted manifest digest');
  assert.equal(hash(bytes), expected.manifestSha256, 'Manifest digest mismatch');
  const manifest = JSON.parse(bytes.toString('utf8'));
  validateIdentity(manifest);
  assert.equal(manifest.schemaVersion, 1, 'Unsupported manifest schema');
  assert.equal(manifest.project, 'flowhome', 'Wrong release project');
  assert.equal(manifest.branch, 'main', 'Wrong release branch');
  for (const key of ['sourceSha', 'runId', 'runAttempt']) assert.equal(manifest[key], expected[key], `Release ${key} mismatch`);
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'Empty artifact inventory');
  for (const file of manifest.files) {
    safePath(file.path);
    assert.ok(Number.isSafeInteger(file.size) && file.size >= 0, 'Invalid artifact size');
    assert.match(file.sha256, DIGEST, 'Invalid file digest');
  }
  const actual = inventory(dist);
  assert.deepEqual(actual, manifest.files, 'Artifact files differ from verified build');
  assert.equal(hash(JSON.stringify(actual)), manifest.distSha256, 'Artifact tree digest mismatch');
  return manifest;
}

export function verifyCheckout(root, expectedSha) {
  assert.match(expectedSha, SHA, 'Invalid source SHA');
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  assert.equal(git('rev-parse', 'HEAD'), expectedSha, 'Checkout differs from verified SHA');
  assert.equal(git('diff', '--name-only', 'HEAD', '--'), '', 'Tracked source changed during release');
  // This sibling checkout is used only to calculate notification URL deltas.
  assert.equal(git('ls-files', '--others', '--exclude-standard', '--', '.', ':!previous-source'), '', 'Untracked source in release checkout');
}

export function identityFromEnv(env) {
  const identity = {
    sourceSha: env.RELEASE_SOURCE_SHA, runId: env.GITHUB_RUN_ID,
    runAttempt: env.GITHUB_RUN_ATTEMPT,
    rollbackDeploymentId: env.RELEASE_ROLLBACK_DEPLOYMENT_ID || null,
  };
  validateIdentity(identity);
  if (env.RELEASE_DEPLOY_PRODUCTION === 'true') assert.ok(identity.rollbackDeploymentId, 'Production release requires an approved rollback deployment ID');
  return identity;
}

export function verifyProductionEnvironment(dist) {
  let evidence;
  try { evidence = JSON.parse(readFileSync(path.join(dist, 'release-environment.json'), 'utf8')); }
  catch { throw new Error('Production release requires a build environment record'); }
  assert.equal(evidence.schemaVersion, 1, 'Unsupported build environment record');
  assert.equal(evidence.environment, 'production', 'Only a production build may be published to production');
  assert.equal(typeof evidence.authEnabled, 'boolean', 'Invalid build auth mode');
  assert.equal(typeof evidence.analyticsEnabled, 'boolean', 'Invalid build analytics mode');
  assert.ok(evidence.authEnabled ? /^[a-z0-9]{20}$/.test(evidence.supabaseProjectRef) : evidence.supabaseProjectRef === null, 'Invalid build project identity');
  return evidence;
}

export function main(mode, env = process.env, root = process.cwd()) {
  assert.ok(mode === 'create' || mode === 'verify', 'Use create or verify');
  const identity = identityFromEnv(env);
  verifyCheckout(root, identity.sourceSha);
  const dist = path.resolve(root, env.RELEASE_DIST_PATH || 'dist');
  if (env.RELEASE_DEPLOY_PRODUCTION === 'true') verifyProductionEnvironment(dist);
  assert.ok(env.RELEASE_MANIFEST_PATH, 'RELEASE_MANIFEST_PATH is required');
  const manifestPath = path.resolve(root, env.RELEASE_MANIFEST_PATH);
  const relative = path.relative(dist, manifestPath);
  assert.ok(relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative), 'Manifest must be outside dist');
  if (mode === 'create') {
    const manifest = createManifest(dist, identity);
    const bytes = `${JSON.stringify(manifest, null, 2)}\n`;
    mkdirSync(path.dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, bytes, { flag: 'wx' });
    const digest = hash(bytes);
    if (env.GITHUB_OUTPUT) appendFileSync(env.GITHUB_OUTPUT, `source_sha=${identity.sourceSha}\nmanifest_sha256=${digest}\ndist_sha256=${manifest.distSha256}\n`);
    if (env.GITHUB_STEP_SUMMARY) appendFileSync(env.GITHUB_STEP_SUMMARY, `## Verified FlowHome artifact\n\n- Source: \`${identity.sourceSha}\`\n- Manifest SHA-256: \`${digest}\`\n- Static tree SHA-256: \`${manifest.distSha256}\`\n- Files: ${manifest.files.length}\n- Rollback deployment: ${identity.rollbackDeploymentId || 'not supplied; not deployable'}\n\nPublication requires separate production approval.\n`);
    return manifest;
  }
  const result = verifyManifest(dist, readFileSync(manifestPath), { ...identity, manifestSha256: env.RELEASE_MANIFEST_SHA256 });
  assert.equal(result.rollbackDeploymentId, identity.rollbackDeploymentId, 'Rollback target differs from approved input');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = main(process.argv[2]);
    console.log(`Release artifact ${process.argv[2]} passed: ${result.files.length} files, source ${result.sourceSha}, tree ${result.distSha256}`);
  } catch (error) {
    // Assertion diffs can contain untrusted artifact bytes; never print them.
    console.error(`Release artifact rejected: ${error.code === 'ERR_ASSERTION' ? error.message.split('\n')[0] : 'invalid or unreadable release input'}`);
    process.exitCode = 1;
  }
}
