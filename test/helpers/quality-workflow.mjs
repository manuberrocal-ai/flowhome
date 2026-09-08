import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

// Resolve the local action's actual run steps for existing ordering contracts.
// Dedicated tests also verify the action is unconditional and called exactly once.
export function expandQualityWorkflow(source) {
  if (!source.includes('uses: ./.github/actions/quality')) return source;
  const action = parse(readFileSync(new URL('../../.github/actions/quality/action.yml', import.meta.url), 'utf8'));
  const runs = action.runs.steps.map((step) => `- run: ${step.run}`).join('\n      ');
  return source.replace(/- uses: \.\/\.github\/actions\/quality/, runs);
}
