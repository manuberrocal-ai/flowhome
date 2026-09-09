import assert from 'node:assert/strict';
import test from 'node:test';
import { mountComparisonCompatibility } from '../src/lib/blocks/block9/comparison-presentation.ts';

test('comparison remains inert without explicit top-level enablement, even with commerce requested', async () => {
  for (const enabled of [undefined, false, 'true', 1]) {
    const mounted = mountComparisonCompatibility(null, { enabled, commerce: { enabled: true } });
    assert.equal(await mounted.refresh(), false);
    assert.doesNotThrow(() => mounted.dispose());
  }
});
