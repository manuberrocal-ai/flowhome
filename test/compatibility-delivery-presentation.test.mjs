import assert from 'node:assert/strict';
import test from 'node:test';
import { mountCompatibilityPresentation } from '../src/lib/blocks/block9/delivery-presentation.ts';
import { mountProductCompatibility } from '../src/lib/blocks/block9/product-presentation.ts';
import { mountComparisonCompatibility } from '../src/lib/blocks/block9/comparison-presentation.ts';
import { mountRelationPresentation } from '../src/lib/blocks/block9/relations-presentation.ts';

test('presentation is inert without explicit enablement, even with no DOM or endpoint', async () => {
  for (const enabled of [undefined, false, 'true', 1]) {
    const result = mountCompatibilityPresentation(null, null, { enabled });
    assert.equal(await result.refresh(), false);
    assert.doesNotThrow(() => result.dispose());
    assert.equal(await mountProductCompatibility(null, { enabled }).refresh(), false);
    assert.equal(await mountComparisonCompatibility(null, { enabled }).refresh(), false);
    assert.equal(await mountRelationPresentation(null, { enabled }).refresh(), false);
  }
});
