import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const profile = readFileSync(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');
const table = readFileSync(new URL('../src/components/CompareTable.astro', import.meta.url), 'utf8');

test('profile introduces one model heading before its artwork in the actual document order', () => {
  const markup = profile.slice(profile.indexOf('<ProductLayout'));
  const heading = markup.indexOf('<h1 ');
  const media = markup.indexOf('data-image-fallback-scope');
  const context = markup.indexOf('id="buying-context"');
  assert.equal((markup.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(heading > 0 && heading < media && media < context);
  assert.match(markup, /aria-labelledby="product-profile-name"/);
  assert.match(markup, /<h1[^>]*id="product-profile-name"[^>]*>\{data\.name\}<\/h1>/);
  assert.doesNotMatch(markup.slice(0, context), /\border-\d|flex-col-reverse|grid-area/);
  assert.ok(markup.indexOf('<AffiliateDisclosure') < heading);
  assert.ok(markup.indexOf('data-image-source-caption') > media);
});

test('comparison row labels preserve complete words while products retain local horizontal navigation', () => {
  const labelRule = table.match(/\.comparison-tables th:first-child\s*\{([^}]+)\}/)?.[1];
  assert.ok(labelRule);
  assert.match(labelRule, /min-width:\s*10rem/);
  assert.match(labelRule, /overflow-wrap:\s*normal/);
  assert.match(labelRule, /word-break:\s*normal/);
  assert.equal((table.match(/\.comparison-tables th:first-child/g) ?? []).length, 1, 'no narrow-screen override reintroduces split labels');
  assert.equal((table.match(/tabindex="0" role="region"/g) ?? []).length, 2);
  assert.match(table, /overflow-x-auto/);
  assert.match(table, /data-cta-position="compare_table_top"/);
  assert.match(table, /data-cta-position="compare_table"/);
});
