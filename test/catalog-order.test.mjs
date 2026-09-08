import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('directory order is transparent and independent of unverified commercial ratings', async () => {
  const source = await readFile(new URL('../src/pages/products/index.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /ownerRating|ownerRatingCount|Math.log10/);
  assert.match(source, /name.localeCompare\(b.data.name, 'en'\)/);
  assert.match(source, /Products are listed alphabetically, not ranked by customer ratings/);
});
