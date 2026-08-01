import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflows = ['automation.yml', 'batched-deploy.yml', 'quality-check.yml', 'quality.yml'];

test('every build workflow runs the static SEO audit immediately after its current build', async () => {
  for (const workflow of workflows) {
    const source = await readFile(new URL(`../.github/workflows/${workflow}`, import.meta.url), 'utf8');
    assert.match(source, /- run: npm run build\r?\n\s+- run: npm run seo:audit/, workflow);
  }
});
