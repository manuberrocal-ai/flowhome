import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getFeatureEvidenceLabel, hasFeatureEvidence } from '../src/lib/product-feature-evidence.ts';
import { getProductFeatures, getEcosystemFeatures } from '../src/lib/product-specs.ts';
import { getComparisonFeatureLabel } from '../src/lib/comparison-insights.ts';
import { prepareVerifiedProductCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
import { forCompatibilitySurface } from '../src/lib/blocks/block9/runtime.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const values = (product) => Object.fromEntries(getProductFeatures(product).map(({ label, value }) => [label, value]));
const graph = loadBlock9Fixtures();
const prepare = (product, override = {}) => prepareVerifiedProductCompatibility(product, product.slug,
  forCompatibilitySurface({ enabled: true, graph, now: '2026-07-30T12:00:00Z', ...override }, 'product', product.slug)).product;

test('profile boolean claims distinguish catalog values from missing or malformed evidence', () => {
  for (const [raw, expected] of [[true, 'Catalog: Yes (unverified)'], [false, 'Catalog: No (unverified)'], [undefined, 'Not verified'], [null, 'Not verified'], ['Yes', 'Not verified'], [1, 'Not verified'], [{}, 'Not verified']]) {
    const rows = values({ category: 'smart-hub', wifi: raw, matter: raw, alexaCompatible: raw });
    assert.equal(rows['Wi-Fi'], expected);
    assert.equal(rows.Matter, expected);
    assert.equal(rows.Alexa, expected);
  }
});

test('all ecosystem rows retain explicit unknowns instead of silently dropping missing fields', () => {
  const rows = getEcosystemFeatures({});
  assert.equal(rows.length, 9);
  assert.ok(rows.every(({ value }) => value === 'Not verified'));
});

test('profile features use exact product evidence even when the catalog says false', () => {
  const prepared = prepare({ slug: 'alpha-hub', category: 'smart-hub', alexaCompatible: false, matter: true });
  assert.equal(values(prepared).Alexa, `Evidence-backed signal: ${prepared.compatibilityConditions.alexaCompatible}`);
  assert.equal(values(prepared).Matter, 'Not verified');
  assert.equal(getEcosystemFeatures(prepared).find(({ label }) => label === 'Alexa').value, values(prepared).Alexa);
});

test('quiz-only, expired, disputed and mismatched product evidence never certifies profile features', () => {
  const product = { slug: 'alpha-hub', category: 'smart-hub', alexaCompatible: true };
  const variants = [
    { ...graph, ledger: graph.ledger.filter((row) => row.id !== 'claim:product-alpha-alexa') },
    { ...graph, ledger: graph.ledger.map((row) => row.id === 'claim:product-alpha-alexa' ? { ...row, status: 'disputed' } : row) },
    { ...graph, ledger: graph.ledger.map((row) => row.id === 'claim:product-alpha-alexa' ? { ...row, source: { ...row.source, label: 'Mismatch' } } : row) },
    { ...graph, edges: graph.edges.map((edge) => edge.id === 'edge:alpha-alexa' ? { ...edge, expiry: '2026-01-01T00:00:00Z' } : edge) },
  ];
  for (const altered of variants) assert.equal(values(prepare(product, { graph: altered })).Alexa, 'Not verified');
});

test('absent provider or disabled graph keeps catalog uncertainty, not a verified label', () => {
  const product = { slug: 'alpha-hub', category: 'smart-hub', alexaCompatible: true };
  for (const override of [{ graph: null }, { enabled: false }]) {
    assert.equal(values(prepare(product, override)).Alexa, 'Catalog: Yes (unverified)');
  }
});

test('compatibility metadata cannot certify unrelated functions or another field', () => {
  const product = { category: 'smart-plug', energyMonitoring: true, surgeProtection: false, wifi: true,
    compatibilityVerificationEnabled: true, compatibilityProvenance: { energyMonitoring: 'Not a supported graph field', matter: 'Another field' } };
  const rows = values(product);
  assert.equal(rows['Energy monitoring'], 'Catalog: Yes (unverified)');
  assert.equal(rows['Surge protection'], 'Catalog: No (unverified)');
  assert.equal(rows['Wi-Fi'], 'Not verified');
});

test('profiles and comparisons share the same evidence wording', () => {
  for (const product of [{ matter: true }, { matter: false }, {}, { matter: true, compatibilityVerificationEnabled: true, compatibilityProvenance: { matter: 'Test fixture' } }]) {
    assert.equal(values({ category: 'smart-hub', ...product }).Matter, getComparisonFeatureLabel(product, 'matter'));
  }
});

test('all nine graph fields require their own source, condition and explicit positive signal', () => {
  for (const field of ['wifi', 'bluetooth', 'zigbee', 'matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'thread', 'smartthingsIntegration']) {
    for (const value of [true, false, undefined, 'true', 1]) {
      for (const source of ['Test fixture', '', ' ', null, 1]) {
        for (const condition of ['Only this documented function', '', ' ', null, undefined, 1]) {
          const product = { [field]: value, compatibilityVerificationEnabled: true, compatibilityProvenance: { [field]: source }, compatibilityConditions: { [field]: condition } };
          const verified = value === true && source === 'Test fixture' && condition === 'Only this documented function';
          assert.equal(hasFeatureEvidence(product, field), verified);
          assert.equal(getFeatureEvidenceLabel(product, field), verified ? `Evidence-backed signal: ${condition}` : 'Not verified');
          assert.equal(getComparisonFeatureLabel(product, field), getFeatureEvidenceLabel(product, field));
        }
      }
    }
  }
});

test('malformed scalar specs are not stringified as product facts', () => {
  for (const raw of [{}, [], true, NaN, Infinity, null, ' ']) {
    assert.equal(values({ category: 'security-camera', resolution: raw }).Resolution, undefined);
  }
});

test('scalar catalog facts cannot borrow verification from installation or compatibility sources', () => {
  const product = { category: 'smart-display', screenSize: '8 in', speakers: 'Spatial audio', compatibilityVerificationEnabled: true,
    compatibilityProvenance: { screenSize: 'Unrelated evidence' }, sources: [{ label: 'General source' }], installation: { model: 'Example' } };
  assert.equal(values(product)['Screen size'], 'Catalog: 8 in (unverified)');
  assert.equal(values(product).Speakers, 'Catalog: Spatial audio (unverified)');
  assert.equal(values({ category: 'smart-plug' })['USB ports'], undefined);
  assert.equal(values({ category: 'smart-plug', usbPorts: 0 })['USB ports'], 'Catalog: 0 (unverified)');
  const schema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  assert.match(schema, /usbPorts: z\.number\(\)\.optional\(\)/);
  assert.doesNotMatch(schema, /usbPorts:.*default\(0\)/);
});

test('the page consumes prepared feature data without raw compatibility summaries or approval icons', () => {
  const page = readFileSync(new URL('../src/pages/product/[slug].astro', import.meta.url), 'utf8');
  assert.match(page, /getProductFeatures\(verifiedProduct\)/);
  assert.match(page, /getEcosystemFeatures\(verifiedProduct\)/);
  assert.doesNotMatch(page, /getProductFeatures\(data\)|catalogConnect|catalogVoice|verifiedConnect|verifiedVoice/);
  assert.match(page, /data-product-feature>\{feature.label\}/);
  assert.match(page, /data-compatibility-value=\{feature.sourceField\}/);
  assert.doesNotMatch(page, /product-detail-chip--feature/);
});
