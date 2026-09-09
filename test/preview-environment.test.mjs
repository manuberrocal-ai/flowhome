import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ownedPreviewEnvironment } from '../scripts/qa/preview-environment.mjs';

test('owned preview disables agent auto-background without mutating caller settings', () => {
  for (const value of [undefined, '1', '0']) {
    const original = Object.freeze({ PATH: 'fixture-path', CODEX_THREAD_ID: 'fixture-agent', ASTRO_PREVIEW_BACKGROUND: value });
    assert.deepEqual(ownedPreviewEnvironment(original), { ...original, ASTRO_PREVIEW_BACKGROUND: '0' });
    assert.equal(original.ASTRO_PREVIEW_BACKGROUND, value);
  }
});

test('both QA runners apply foreground environment to every preview spawn', () => {
  const browser = readFileSync(new URL('../scripts/qa/browser-smoke.mjs', import.meta.url), 'utf8');
  const lighthouse = readFileSync(new URL('../scripts/qa/lighthouse-mobile.mjs', import.meta.url), 'utf8');
  const browserSpawns = browser.split('\n').filter((line) => line.includes('previewProcess = spawnLogged('));
  assert.equal(browserSpawns.length, 2);
  for (const line of browserSpawns) assert.match(line, /env: ownedPreviewEnvironment\(\)/);
  assert.match(lighthouse, /function spawnLogged\(command, args\).*env: ownedPreviewEnvironment\(\)/);
});
