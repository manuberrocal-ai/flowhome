import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { subset, satisfies } = require('semver');
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('declared Node support fits locked engines for Windows x64 and Linux x64', () => {
  const supported = manifest.engines.node;
  assert.equal(lock.packages[''].engines.node, supported);
  const matches = (constraint, value) => !constraint || (constraint.includes(value) || constraint.every(item => item.startsWith('!'))) && !constraint.includes(`!${value}`);
  for (const os of ['win32', 'linux']) {
    for (const [path, entry] of Object.entries(lock.packages)) {
      if (entry.optional && (!matches(entry.os, os) || !matches(entry.cpu, 'x64'))) continue;
      if (path && entry.engines?.node) assert.ok(subset(supported, entry.engines.node), `${os}/x64 ${path}: ${entry.engines.node}`);
    }
  }
});

test('Node runtime contract retains compatible lines and rejects unsupported older minors', () => {
  for (const version of ['22.22.3', '24.16.0', '26.3.0']) assert.ok(satisfies(version, manifest.engines.node), version);
  for (const version of ['22.12.0', '22.19.0', '24.15.0', '25.0.0', '26.2.0']) assert.equal(satisfies(version, manifest.engines.node), false, version);
});
