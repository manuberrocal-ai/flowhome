import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { QUALITY_COMMANDS } from '../scripts/flowhome-daily.mjs';
import { expandQualityWorkflow } from './helpers/quality-workflow.mjs';

const workflows = ['automation.yml', 'batched-deploy.yml', 'quality-check.yml', 'quality.yml'];

test('every build workflow runs the static SEO audit immediately after its current build', async () => {
  for (const workflow of workflows) {
    const source = expandQualityWorkflow(await readFile(new URL(`../.github/workflows/${workflow}`, import.meta.url), 'utf8'));
    if (workflow === 'automation.yml') {
      assert.match(source, /npm run flowhome:daily/);
      assert.equal(QUALITY_COMMANDS[QUALITY_COMMANDS.indexOf('build') + 1], 'seo:audit');
      const runner = await readFile(new URL('../scripts/flowhome-daily.mjs', import.meta.url), 'utf8');
      assert.match(runner, /for \(const command of commands\)/);
      assert.match(runner, /qualityCommandSkipReason\(command, results\)/);
    } else assert.match(source, /- run: npm run build\r?\n\s+- run: npm run seo:audit/, workflow);
  }
});
