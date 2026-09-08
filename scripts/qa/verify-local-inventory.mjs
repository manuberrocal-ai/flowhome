import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { inventory, hash } from '../deploy/release-artifact.mjs';

// Equality check only; never upgrades local evidence into deployment authority.
export function verifyLocalInventory(dist, record) {
  assert.equal(record.schemaVersion, 1, 'Unsupported local inventory');
  assert.equal(record.kind, 'local-review-inventory-not-release-manifest', 'Not a local review inventory');
  assert.equal(record.publishable, false, 'Local inventory must not authorize publication');
  const files = inventory(dist);
  assert.deepEqual(record.files, files, 'Local inventory is stale');
  assert.equal(record.distSha256, hash(JSON.stringify(files)), 'Tree digest mismatch');
  assert.equal(record.filesCount, files.length, 'File count mismatch');
  assert.equal(record.totalBytes, files.reduce((sum, file) => sum + file.size, 0), 'Byte count mismatch');
  const environment = JSON.parse(readFileSync(path.join(dist, 'release-environment.json'), 'utf8'));
  assert.deepEqual(record.environment, environment, 'Environment record mismatch');
  return { matches: true, publishable: false, files: files.length, distSha256: record.distSha256 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.ok(process.argv[2], 'Inventory path required');
    const record = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    console.log(JSON.stringify(verifyLocalInventory(process.argv[3] || 'dist', record)));
  } catch {
    // Do not expose file contents, assertion diffs, or paths supplied in artifacts.
    console.error('Local inventory rejected: stale, invalid, or unreadable. Publication remains unauthorized.');
    process.exitCode = 1;
  }
}
