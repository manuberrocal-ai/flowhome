import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/comparison-insights.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  fileName: 'comparison-insights.ts',
});
const load = async () => import(`data:text/javascript,${encodeURIComponent(outputText)}`);

const products = [
  { slug: 'alpha', name: 'Alpha', category: 'smart-hub', price: 80, matter: true, alexaCompatible: true, ownerRating: 4.5, ownerRatingCount: 100 },
  { slug: 'beta', name: 'Beta', category: 'smart-hub', price: 120, googleHomeCompatible: true, ownerRating: 4.2, ownerRatingCount: 80 },
];

test('insights are deterministic and never assign a universal winner or value', async () => {
  const { buildComparisonInsights } = await load();
  const first = buildComparisonInsights(products);
  assert.deepEqual(first, buildComparisonInsights(products));
  assert.match(first.finalRecommendation, /not assigned.*evidence is insufficient/i);
  assert.ok(!first.tradeoffs.some((item) => /best value|winner/i.test(item)));
});

test('reports unique ecosystem signal and labels price as snapshot', async () => {
  const { buildComparisonInsights } = await load();
  const result = buildComparisonInsights(products);
  assert.equal(result.ecosystemLeaders[0].platform, 'Matter');
  assert.match(result.tradeoffs.join(' '), /price snapshots/i);
  assert.doesNotMatch(result.tradeoffs.join(' '), /best value/i);
});

test('missing data and category mismatch become evidence limits or tradeoffs', async () => {
  const { buildComparisonInsights } = await load();
  const result = buildComparisonInsights([{ slug: 'one', category: 'smart-speaker' }, { slug: 'two', category: 'smart-display' }]);
  assert.match(result.tradeoffs.join(' '), /Category mismatch disclosed/);
  assert.ok(result.evidenceLimits.length >= 2);
});
