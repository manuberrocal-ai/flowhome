import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { comparisonConfigs } from '../src/lib/comparison-content.ts';

test('comparison index and routes consume one shared editorial definition', () => {
  for (const file of ['index.astro', '[...slugs].astro']) {
    const source = fs.readFileSync(new URL(`../src/pages/compare/${file}`, import.meta.url), 'utf8');
    assert.ok(source.includes("from '../../lib/comparison-content'"));
    assert.doesNotMatch(source, /slugs:\s*\[/);
  }
  assert.equal(comparisonConfigs.length, 8);
  assert.equal(new Set(comparisonConfigs.map(({ slugs }) => slugs.join('-vs-'))).size, 8);
  for (const field of ['title', 'description', 'angle', 'guidance']) {
    assert.equal(new Set(comparisonConfigs.map((entry) => entry[field])).size, 8);
    assert.ok(comparisonConfigs.every((entry) => entry[field].trim().length > 30));
  }
});

test('comparison guidance distinguishes catalog flags and unmeasured advantages', () => {
  const guidance = comparisonConfigs.map((entry) => entry.guidance).join('\n');
  assert.match(guidance, /Catalog platform flags do not certify/);
  assert.match(guidance, /Protocol flags do not certify/);
  assert.match(guidance, /no comfort, savings, interface or price advantage/);
  assert.match(guidance, /sound quality and convenience have not been measured/);
  assert.doesNotMatch(guidance, /choose.*(?:lowest price|highest rating)|best value|guaranteed/i);
});
