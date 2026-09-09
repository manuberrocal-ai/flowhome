import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('home return actions describe the working browser list and RSS channel', async () => {
  const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  const feed = await readFile(new URL('../src/components/Newsletter.astro', import.meta.url), 'utf8');
  assert.match(home, /Save products in this browser without an account/);
  assert.match(home, /clearing browser data can remove it/);
  assert.doesNotMatch(home, /synced across devices|Create account/);
  assert.match(feed, /not an email subscription/);
  assert.doesNotMatch(feed, /Weekly brief|price drops|No spam/);
  assert.match(feed, /href="\/rss.xml"/);
});
