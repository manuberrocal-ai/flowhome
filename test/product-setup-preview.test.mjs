import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { getInstallationEvidence, getInstallationSummary } from '../src/lib/product-installation.ts';
import { selectHomeShortlist } from '../src/lib/home-shortlist.js';

const now = new Date('2026-09-12T12:00:00Z');
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter((file) => file.endsWith('.yaml'))
  .map((file) => parse(readFileSync(new URL(file, directory), 'utf8')));
const card = readFileSync(new URL('../src/components/ProductCard.astro', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');

test('card and profile reuse the model-evidence gate and preserve access to complete checks', () => {
  for (const source of [card, profile]) {
    assert.match(source, /const installation = getInstallationEvidence\(data\)/);
    const preview = source.match(/<div[^>]*data-product-setup-preview>[\s\S]*?<\/div>/)?.[0];
    assert.ok(preview);
    assert.match(preview, /First setup check/);
    assert.doesNotMatch(preview, /line-clamp|truncate|\.slice\(|\.substring\(/);
    assert.match(preview, /min-h-11/);
    assert.match(preview, /All setup checks &amp; sources/);
  }
  assert.match(profile, /\{installation.requirements\[0\]\}/);
  assert.match(card, /\{getInstallationSummary\(installation\)\}/);
  assert.match(card, /<details data-product-setup-details>/);
  assert.match(card, /<summary[^>]*min-h-11[^>]*focus-visible:[^>]*>Setup checks &amp; conditions<\/summary>/);
  assert.match(card, /const cardCheck = getProductCardCheck\(data\)/);
  assert.match(card, /cardCheck && <p[^>]*data-critical-setup>\{cardCheck\}/);
  assert.ok(card.indexOf('data-critical-setup') < card.indexOf('<details data-product-setup-details>'));
  assert.doesNotMatch(card, /installation.assessment === 'advanced'/);
  assert.match(card, /getIdentityClaim\(data, 'role'\)/);
  assert.match(card, /\{role.conditions\}/);
  assert.match(card, /installation.requirements.map\(\(requirement\) => <li>\{requirement\}<\/li>\)/);
  assert.doesNotMatch(card, /<details[^>]*\bopen\b/);
  const styles = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
  assert.match(styles, /\.grid:has\(> \.product-card \[data-product-setup-details\]\[open\], > \[data-catalog-item\] \[data-product-setup-details\]\[open\]\) \.product-card\s*\{\s*height: auto;\s*align-self: start;/);
  assert.match(card, /!compact && installation &&/);
  assert.match(card, /href=\{`\/product\/\$\{slug\}\/#installation-checks`\}/);
  assert.match(card, /aria-label=\{`All setup checks and sources for \$\{data.name\}`\}/);
  assert.match(profile, /href="#installation-checks"/);
  assert.match(profile, /id="installation-checks"/);
  assert.match(profile, /not a hands-on test\. This is one check, not a complete installation guide/);
});

test('the eight home models have distinct summaries without refreshing commercial or source evidence', () => {
  const home = selectHomeShortlist(products.map((data) => ({ data })));
  assert.equal(home.length, 8);
  const summaries = home.map(({ data }) => {
    const evidence = getInstallationEvidence(data, now);
    assert.ok(evidence.summary, data.slug);
    assert.equal(getInstallationSummary(evidence), data.installation.summary);
    assert.equal(data.dateUpdated, '2026-09-12');
    assert.notEqual(data.priceLastChecked, data.dateUpdated);
    assert.notEqual(data.ratingLastChecked, data.dateUpdated);
    assert.ok(evidence.sources.every((source) => source.accessedAt < data.dateUpdated));
    return evidence.summary;
  });
  assert.equal(new Set(summaries).size, 8);
  const summary = (slug) => products.find((data) => data.slug === slug).installation.summary;
  assert.match(summary('ring-video-doorbell-wired'), /compatible power.*bypasses the existing chime.*licensed electrician/);
  assert.match(summary('amazon-smart-thermostat'), /24 V HVAC.*C-wire.*not 120–240 V or millivolt.*power-isolation.*professional/);
  assert.match(summary('tp-link-kasa-smart-plug-mini'), /load limits.*do not stack/);
  assert.match(summary('roborock-q5-plus'), /physical barrier, not just mapping/);
  assert.match(summary('aqara-hub-m2'), /Ethernet does not replace USB power/);
});

test('absent or malformed optional summaries retain the entire first requirement; unknown evidence stays unknown', () => {
  const evidence = getInstallationEvidence(products[0], now);
  for (const summary of [undefined, null, '', '  ', 42, {}]) {
    assert.equal(getInstallationSummary({ ...evidence, summary }), evidence.requirements[0]);
  }
  assert.equal(getInstallationSummary(null), null);
});

test('hero buying check uses model evidence, never a category estimate, with an adjacent source path', () => {
  const home = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.match(home, /getInstallationSummary\(getInstallationEvidence\(data, now\)\)/);
  assert.match(home, /quote: setupSummary \?\? 'Model-specific setup evidence is not available/);
  assert.doesNotMatch(home, /editorialChecks/);
  assert.match(home, /data-hero-checks href=\{`\$\{heroProducts\[0\].detailsUrl\}#installation-checks`\}/);
  assert.match(home, /Setup checks &amp; sources/);
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
