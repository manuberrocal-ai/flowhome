import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { getInstallationEvidence } from '../src/lib/product-installation.ts';

const now = new Date('2026-09-12T12:00:00Z');
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter((file) => file.endsWith('.yaml'))
  .map((file) => parse(readFileSync(new URL(file, directory), 'utf8')));
const card = readFileSync(new URL('../src/components/ProductCard.astro', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');

test('card and profile reuse the model-evidence gate and complete first requirement', () => {
  for (const source of [card, profile]) {
    assert.match(source, /const installation = getInstallationEvidence\(data\)/);
    const preview = source.match(/<div[^>]*data-product-setup-preview>[\s\S]*?<\/div>/)?.[0];
    assert.ok(preview);
    assert.match(preview, /First setup check/);
    assert.match(preview, /\{installation.requirements\[0\]\}/);
    assert.doesNotMatch(preview, /line-clamp|truncate|\.slice\(|\.substring\(/);
    assert.match(preview, /min-h-11/);
    assert.match(preview, /All setup checks &amp; sources/);
  }
  assert.match(card, /!compact && installation &&/);
  assert.match(card, /href=\{`\/product\/\$\{slug\}\/#installation-checks`\}/);
  assert.match(card, /aria-label=\{`All setup checks and sources for \$\{data.name\}`\}/);
  assert.match(profile, /href="#installation-checks"/);
  assert.match(profile, /id="installation-checks"/);
  assert.match(profile, /not a hands-on test\. This is one check, not a complete installation guide/);
});

test('all current cards have distinct sourced requirements, without invented category fallbacks', () => {
  const requirements = products.map((product) => {
    const evidence = getInstallationEvidence(product, now);
    assert.ok(evidence, product.slug);
    assert.equal(evidence.requirements[0], product.installation.requirements[0]);
    assert.ok(evidence.sources.length > 0);
    return evidence.requirements[0];
  });
  assert.equal(new Set(requirements).size, products.length);
});

test('missing, mismatched, future-dated or invalid-source evidence cannot provide a preview', () => {
  const product = products[0];
  assert.equal(getInstallationEvidence({ category: product.category }, now), null);
  assert.equal(getInstallationEvidence({ ...product, model: 'different-model' }, now), null);
  for (const change of [{ sources: [] }, { requirements: [] }, {
    sources: [{ ...product.installation.sources[0], accessedAt: '2099-01-01' }],
  }, { sources: [{ ...product.installation.sources[0], url: 'javascript:alert(1)' }] }]) {
    assert.equal(getInstallationEvidence({ ...product, installation: { ...product.installation, ...change } }, now), null);
  }
});
