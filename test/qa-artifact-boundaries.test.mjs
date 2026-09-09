import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('transient browser evidence stays out of source while reviewed evidence remains visible', () => {
  const paths = [
    '.playwright-cli/page-fixture.yml',
    '.playwright-cli/console-fixture.log',
    'reports/daily/fixture/report.json',
    'artifacts/fixture/index.html',
    'docs/project/FH12P_RENDIMIENTO_2026-09-08.md',
    'docs/project/FH12P_HERO_MOVIL_2026-09-08.png',
    'scripts/qa/desktop-navigation.cjs',
  ];
  const ignored = execFileSync('git', ['check-ignore', '--no-index', '--stdin'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8', input: `${paths.join('\n')}\n`, windowsHide: true,
  }).trim().split(/\r?\n/);
  assert.deepEqual(ignored, paths.slice(0, 4));
});
