import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inventory, hash } from '../scripts/deploy/release-artifact.mjs';
import { verifyLocalInventory } from '../scripts/qa/verify-local-inventory.mjs';

test('local inventory detects drift and cannot authorize a release', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'flowhome-local-inventory-'));
  try {
    const environment = { schemaVersion: 1, environment: 'local', authEnabled: false, analyticsEnabled: false, supabaseProjectRef: null };
    writeFileSync(path.join(root, 'index.html'), '<h1>Fixture</h1>');
    writeFileSync(path.join(root, 'release-environment.json'), JSON.stringify(environment));
    const files = inventory(root);
    const record = { schemaVersion: 1, kind: 'local-review-inventory-not-release-manifest', publishable: false, files, environment, filesCount: files.length, totalBytes: files.reduce((s,f) => s+f.size,0), distSha256: hash(JSON.stringify(files)) };
    assert.equal(verifyLocalInventory(root, record).publishable, false);
    for (const patch of [{ publishable: true }, { kind: 'release' }, { distSha256: 'bad' }, { filesCount: 99 }, { totalBytes: 0 }, { environment: { environment: 'production' } }]) assert.throws(() => verifyLocalInventory(root, { ...record, ...patch }));
    writeFileSync(path.join(root, 'index.html'), '<h1>Changed</h1>');
    assert.throws(() => verifyLocalInventory(root, record), /stale/);
    writeFileSync(path.join(root, 'index.html'), '<h1>Fixture</h1>');
    writeFileSync(path.join(root, 'extra.txt'), 'new');
    assert.throws(() => verifyLocalInventory(root, record), /stale/);
    rmSync(path.join(root, 'extra.txt'));
    rmSync(path.join(root, 'release-environment.json'));
    assert.throws(() => verifyLocalInventory(root, record));
  } finally {
    // Only the unique test-owned directory is removed.
    rmSync(root, { recursive: true, force: true });
  }
});
