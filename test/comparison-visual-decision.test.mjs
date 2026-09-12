import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parse } from 'yaml';
import { comparisonConfigs } from '../src/lib/comparison-content.ts';
import { getProductDecision } from '../src/lib/product-decision.ts';

// Render the real component with Astro's server runtime; CSS is checked in the browser.
const componentUrl = new URL('../src/components/CompareTable.astro', import.meta.url);
const astroRequire = createRequire(import.meta.resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(astroRequire.resolve('@astrojs/compiler-rs')).href);
const compiled = transform(readFileSync(componentUrl, 'utf8'), { filename: componentUrl.pathname, internalURL: 'astro/compiler-runtime', resolvePath: specifier => specifier });
const code = ts.transpileModule(compiled.code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  .replace(/^import\s+["'][^"']+\?astro&type=style[^"']+["'];?\s*$/gm, '')
  .replace(/from (["'])astro\/compiler-runtime\1/g, `from ${JSON.stringify(import.meta.resolve('astro/compiler-runtime'))}`)
  .replace(/from (["'])(\.\.\/lib\/[^"']+)\1/g, (_match, _quote, path) => `from ${JSON.stringify(new URL(`${path}.ts`, componentUrl).href)}`);
const { default: CompareTable } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const container = await AstroContainer.create();
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, directory), 'utf8')));
const render = selected => container.renderToString(CompareTable, { props: { products: selected } });

test('every editorial comparison starts with sourced decisions and setup, preserving all commerce and feature records', async () => {
  for (const comparison of comparisonConfigs) {
    const selected = comparison.slugs.map(slug => products.find(product => product.slug === slug));
    const html = await render(selected);
    const tables = html.match(/<table\b[\s\S]*?<\/table>/g);
    assert.equal(tables.length, 2);
    assert.match(tables[0], /Documented use[\s\S]*First setup check/);
    assert.doesNotMatch(tables[0], /<th[^>]*>Price<|<th[^>]*>Amazon customer rating</);
    assert.match(html, /<details[^>]*data-comparison-records/);
    for (const label of ['Price', 'Price source', 'Amazon customer rating', 'Amazon rating count', 'Rating checked', 'Matter', 'Alexa', 'Google Home', 'Apple HomeKit', 'Energy monitoring']) assert.ok(tables[1].includes(label), label);
    for (const product of selected) {
      assert.ok(getProductDecision(product));
      assert.ok(tables[0].includes(`/product/${product.slug}/#buying-context`));
      assert.ok(tables[0].includes(`/product/${product.slug}/#installation-checks`));
      const header = tables[0].slice(0, tables[0].indexOf('</thead>'));
      assert.ok(header.includes(`Check on Amazon: ${product.name.replaceAll('&', '&amp;')}`), product.name);
      assert.ok(header.includes('nofollow sponsored noopener noreferrer'));
    }
    assert.match(tables[1], /Catalog: (?:Yes|No) \(unverified\)|Not verified/);
  }
});

test('missing or wrong-model evidence remains unknown instead of acquiring a category recommendation', async () => {
  const original = products[0];
  const html = await render([{ ...original, model: 'unverified-generation', priceSource: 'manual', ratingSource: 'manual', price: 12.34, ownerRating: 4.9, ownerRatingCount: 999 }]);
  assert.match(html, /A model-specific use summary is not yet available/);
  assert.match(html, /Model-specific setup requirements are not yet verified/);
  assert.doesNotMatch(html, /\$12\.34|4\.9 \/ 5|>999</);
  assert.match(html, /Current authorized price unavailable/);
  assert.match(html, /Check current ratings on Amazon/);
});

test('comparison regions keep named keyboard access and column identity in both tables', async () => {
  const html = await render(products.slice(0, 2));
  assert.equal((html.match(/tabindex="0" role="region"/g) ?? []).length, 2);
  assert.match(html, /aria-label="Scrollable product comparison"/);
  assert.match(html, /aria-label="Scrollable feature and commerce records"/);
  assert.equal((html.match(/scope="col"/g) ?? []).length, 6);
  const layout = readFileSync(new URL('../src/layouts/CompareLayout.astro', import.meta.url), 'utf8');
  for (const target of ['comparison-table', 'quick-decision', 'evidence-limits', 'comparison-methodology']) assert.ok(layout.includes(`href="#${target}"`));
});
