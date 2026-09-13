import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parse } from 'yaml';
import { getInstallationEvidence, getInstallationSummary } from '../src/lib/product-installation.ts';
import { getIdentityClaim } from '../src/lib/product-identity.ts';
import { matchesCatalogQuery } from '../src/lib/catalog-filter.js';

const astroRequire = createRequire(import.meta.resolve('astro/package.json'));
const { transform } = await import(pathToFileURL(astroRequire.resolve('@astrojs/compiler-rs')).href);
function componentModule(url) {
  const compiled = transform(readFileSync(url, 'utf8'), { filename: url.pathname, internalURL: 'astro/compiler-runtime', resolvePath: specifier => specifier });
  const code = ts.transpileModule(compiled.code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
    .replace(/from (["'])astro\/compiler-runtime\1/g, `from ${JSON.stringify(import.meta.resolve('astro/compiler-runtime'))}`)
    .replace(/from (["'])(\.[^"']+)\1/g, (_match, _quote, path) => {
      if (path.endsWith('.astro')) return `from ${JSON.stringify(componentModule(new URL(path, url)))}`;
      const resolved = ['.ts', '.js'].map(extension => new URL(path + extension, url)).find(candidate => existsSync(candidate));
      assert.ok(resolved, path);
      return `from ${JSON.stringify(resolved.href)}`;
    });
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const { default: ProductCard } = await import(componentModule(new URL('../src/components/ProductCard.astro', import.meta.url)));
const container = await AstroContainer.create();
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, directory), 'utf8')));
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll("'", '&#39;').replaceAll('"', '&quot;');

test('every card retains full requirements, role conditions and sources; duplicate summaries occur only in the checklist', async () => {
  for (const product of products) {
    const html = await container.renderToString(ProductCard, { props: { product } });
    const details = html.match(/<details\b[^>]*data-product-setup-details[\s\S]*?<\/details>/)?.[0];
    const installation = getInstallationEvidence(product);
    assert.ok(details, product.slug);
    const checklist = details.match(/<ul[^>]*aria-label="Full setup checklist"[\s\S]*?<\/ul>/)?.[0];
    for (const requirement of installation.requirements) assert.ok(checklist.includes(escape(requirement)), product.slug);
    const summary = getInstallationSummary(installation);
    if (installation.requirements.includes(summary)) {
      assert.doesNotMatch(details, /First setup check/);
      assert.equal(details.split(escape(summary)).length - 1, 1, product.slug);
    } else {
      assert.match(details, /First setup check/);
      assert.ok(details.includes(escape(summary)), product.slug);
    }
    const role = getIdentityClaim(product, 'role');
    if (role) assert.ok(details.includes(escape(role.conditions)), product.slug);
    assert.ok(details.includes(`/product/${product.slug}/#installation-checks`));
    assert.ok(html.indexOf('data-critical-setup') < html.indexOf('data-product-setup-details'));
  }
});

test('Aeotec fallback appears once in the expanded checklist while a distinct summary is preserved', async () => {
  const aeotec = products.find(product => product.slug === 'aeotec-smartthings-hub');
  for (const summary of [undefined, aeotec.installation.requirements[0], 'A distinct documentary summary retained for this fixture.']) {
    const product = { ...aeotec, installation: { ...aeotec.installation, summary } };
    const html = await container.renderToString(ProductCard, { props: { product } });
    const details = html.match(/<details\b[^>]*data-product-setup-details[\s\S]*?<\/details>/)[0];
    assert.equal(details.split(escape(aeotec.installation.requirements[0])).length - 1, 1);
    if (summary && !aeotec.installation.requirements.includes(summary)) assert.ok(details.includes(summary));
  }
});

const catalog = readFileSync(new URL('../src/pages/products/index.astro', import.meta.url), 'utf8');
// Execute the actual update body, with only its DOM inputs replaced by fixtures.
const updateBody = catalog.match(/const update = \(\) => \{([\s\S]*?)\n {6}\};/)[1];
const update = new Function('items', 'search', 'category', 'installation', 'count', 'empty', 'reset', 'chips', 'guide', 'robotResearch', 'matchesCatalogQuery', updateBody);
function fixture() {
  const items = products.map(product => ({ hidden: false, dataset: { ...product, installation: getInstallationEvidence(product)?.assessment ?? '' } }));
  const search = { value: '' }, category = { value: '' }, installation = { value: '' };
  const count = {}, empty = {}, reset = {}, robotResearch = {};
  return { search, category, installation, empty, reset, robotResearch, run: () => update(items, search, category, installation, count, empty, reset, [], null, robotResearch, matchesCatalogQuery) };
}

test('robot research follows relevant results/category and returns after reset or restored filters', () => {
  const state = fixture();
  for (const [query, category, setup, expectedHidden, expectedEmpty] of [
    ['', '', '', false, false],
    ['Kasa', '', '', true, false],
    ['no-such-model', 'smart-hub', '', true, true],
    ['', 'smart-hub', '', true, false],
    ['Roborock', '', '', false, false],
    ['no-such-model', 'robot-vacuum', '', false, true],
    ['', '', 'advanced', true, false],
    ['', '', '', false, false],
    ['Kasa', '', '', true, false],
  ]) {
    state.search.value = query;
    state.category.value = category;
    state.installation.value = setup;
    state.run();
    assert.equal(state.robotResearch.hidden, expectedHidden, `${query}/${category}/${setup}`);
    assert.equal(state.empty.hidden, !expectedEmpty);
  }
});

test('editorial paths remain in no-JS markup and category directory offers a permanent alternative', () => {
  assert.match(catalog, /<section[^>]*data-catalog-robot-research>/);
  assert.doesNotMatch(catalog.match(/<section[^>]*data-catalog-robot-research>/)[0], /\bhidden\b/);
  for (const path of ['/best/best-robot-vacuums-for-smart-homes/', '/review/roborock-q5-plus-review/', '/review/irobot-roomba-j7-plus-review/', '/compare/roborock-q5-plus-vs-irobot-roomba-j7-plus/']) assert.ok(catalog.includes(`href="${path}"`));
  assert.match(catalog, /<details class="catalog-guide-directory/);
  assert.match(catalog, /categories.map\(category => <a href=\{'\/category\/' \+ category \+ '\/'\}/);
  assert.match(catalog, /id="catalog-empty-reset"/);
  assert.match(catalog, /window.addEventListener\('popstate',[\s\S]*?restore\(\);\s*update\(\);/);
});
