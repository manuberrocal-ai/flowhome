import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import config from '../../astro.config.mjs';

// Review-only build: no provider, application secrets or public source changes.
const root = fileURLToPath(new URL('../../', import.meta.url));
if (process.argv[2] !== '--isolated-child') {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|PATHEXT)$/i.test(key)));
  const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--isolated-child'], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  const work = mkdtempSync(join(tmpdir(), 'flowhome-quiz-live-review-'));
  const target = resolve(root, 'src/lib/blocks/block9/quiz-presentation.ts').replaceAll('\\', '/');
  const original = readFileSync(target, 'utf8');
  const anchor = '  const base = structuredClone([...catalog]);';
  let injected = 0;
  const outDir = join(work, 'output');
  await build({ ...config, root, configFile: false, outDir, cacheDir: join(work, 'cache'), vite: {
    ...config.vite, envDir: work, plugins: [...(config.vite?.plugins ?? []), {
      name: 'flowhome-isolated-quiz-live-review', enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0].replaceAll('\\', '/') !== target) return;
        assert.equal(code, original); assert.equal(code.split(anchor).length, 2);
        injected++;
        return { code: code.replace(anchor, "  options ??= { enabled: true, endpoint: '/compatibility/live', pageUrl: location.href };\n" + anchor), map: null };
      },
    }],
  } });
  assert.ok(injected > 0); assert.equal(readFileSync(target, 'utf8'), original);
  console.log('FLOWHOME_QUIZ_LIVE_REVIEW=' + JSON.stringify({ outDir, sourceUnchanged: true, publicationAuthorized: false }));
}
