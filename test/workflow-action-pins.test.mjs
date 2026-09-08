import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

test('all external workflow actions use full immutable commit references', () => {
  const root = new URL('../.github/workflows/', import.meta.url);
  let external = 0;
  for (const file of readdirSync(root).filter((name) => /\.ya?ml$/.test(name))) {
    const workflow = parse(readFileSync(new URL(file, root), 'utf8'));
    for (const job of Object.values(workflow.jobs)) {
      for (const step of job.steps ?? []) {
        if (!step.uses || step.uses.startsWith('./')) continue;
        external++;
        assert.match(step.uses, /^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/, `${file}: ${step.uses}`);
      }
      if (job.uses && !job.uses.startsWith('./')) {
        assert.match(job.uses, /^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/, file);
      }
    }
  }
  assert.ok(external >= 20, 'the inventory must include deployment and scheduled workflows');
});
