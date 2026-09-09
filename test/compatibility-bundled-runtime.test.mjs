import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

// All output stays in memory. No installation in the real site's runtime.
async function bundleProbe(candidate, staticDelivery) {
  const entry = `virtual:compatibility-probe-${candidate ? 'candidate' : 'default'}`;
  const artifact = await build({
    root: fileURLToPath(new URL('../', import.meta.url)),
    configFile: false, envFile: false, logLevel: 'silent',
    define: { 'import.meta.env.PUBLIC_COMPATIBILITY_V1': JSON.stringify('true'), ...(staticDelivery === undefined ? {} : { __FLOWHOME_STATIC_COMPATIBILITY__: staticDelivery }) },
    plugins: [{
      name: 'isolated-compatibility-probe',
      resolveId: id => id === entry ? `\0${entry}` : undefined,
      load: id => id === `\0${entry}` ? `
        import { getCompatibilityEnvironment, forCompatibilitySurface, setApprovedCompatibilityGraphProvider } from '/src/lib/blocks/block9/runtime.ts';
        import { applyVerifiedCompatibility } from '/src/lib/blocks/block9/compatibility-adapter.ts';
        import { getEcosystemFeatures } from '/src/lib/product-specs.ts';
        import { getQuizCompatibilitySignals, prepareQuizCatalog } from '/src/lib/quiz-recommend.ts';
        ${candidate ? `import { documentaryCandidateProvider } from '/src/lib/blocks/block9/documentary-provider.ts';` : ''}
        export function installCandidateForTest() {
          ${candidate ? 'setApprovedCompatibilityGraphProvider(documentaryCandidateProvider);' : ''}
        }
        export function project(slug, now, flag = 'true') {
          const env = { ...getCompatibilityEnvironment({ PUBLIC_COMPATIBILITY_V1: flag }), now };
          const product = { slug, category: 'smart-hub', thread: true, smartthingsIntegration: true };
          const surfaces = ['product', 'comparison', 'alternatives'].map(surface => {
            const prepared = applyVerifiedCompatibility(product, slug, forCompatibilitySurface(env, surface, slug));
            return { surface, prepared, rows: getEcosystemFeatures(prepared) };
          });
          const quiz = JSON.parse(JSON.stringify(prepareQuizCatalog([product], env)))[0];
          return { graphPresent: env.graph !== null, surfaces, quiz, quizRows: getQuizCompatibilitySignals(quiz) };
        }
      ` : undefined,
    }],
    build: { ssr: true, write: false, rollupOptions: { input: entry } },
  });
  const chunks = artifact.output.filter(output => output.type === 'chunk');
  assert.equal(chunks.length, 1, 'The probe must be a self-contained isolated module');
  return { code: chunks[0].code, api: await import(`data:text/javascript;base64,${Buffer.from(chunks[0].code).toString('base64')}`) };
}

const roles = [['thread', 'Thread role / integration'], ['smartthingsIntegration', 'SmartThings role / integration']];
const slug = 'aeotec-smartthings-hub';
const fresh = '2026-09-07T00:00:00Z';

test('static delivery rejects installed documentary evidence instead of freezing it into HTML', async () => {
  const { api } = await bundleProbe(true, true);
  assert.equal(api.project(slug, fresh).graphPresent, false);
  api.installCandidateForTest();
  assert.throws(() => api.project(slug, fresh), /STATIC_COMPATIBILITY_DELIVERY_BLOCKED/);
  assert.throws(() => api.project(slug, '2026-11-01T00:00:00Z'), /STATIC_COMPATIBILITY_DELIVERY_BLOCKED/);
  for (const flag of ['false', 'TRUE', true, '']) assert.equal(api.project(slug, fresh, flag).graphPresent, false);
});

test('static default remains usable and excludes documentary data without an installed provider', async () => {
  const { api, code } = await bundleProbe(false, true);
  assert.equal(api.project(slug, fresh).graphPresent, false);
  assert.ok(!code.includes('aeotec.freshdesk.com'));
});

function assertUnknown(result) {
  // A disabled/absent provider preserves raw catalog values, explicitly unverified.
  // An active graph without matching evidence clears them to unknown.
  const profileExpected = result.graphPresent ? 'Not verified' : 'Catalog: Yes (unverified)';
  for (const [, label] of roles) {
    for (const surface of result.surfaces) assert.equal(surface.rows.find(row => row.label === label).value, profileExpected);
    assert.equal(result.quizRows.find(row => row.label === label).value, profileExpected);
  }
}

test('bundled default stays empty with the flag enabled and excludes documentary evidence', async () => {
  const { api, code } = await bundleProbe(false);
  const result = api.project(slug, fresh);
  assert.equal(result.graphPresent, false);
  assertUnknown(result);
  assert.ok(!code.includes('aeotec.freshdesk.com'));
  assert.ok(!code.includes('documentaryCandidateProvider'));
});

test('isolated bundled candidate preserves qualified roles across surfaces and JSON, with fail-closed gates', async () => {
  const { api } = await bundleProbe(true);
  assertUnknown(api.project(slug, fresh));
  api.installCandidateForTest();
  const result = api.project(slug, fresh);
  assert.equal(result.graphPresent, true);
  for (const [field, label] of roles) {
    const condition = result.quiz.compatibilityConditions[field];
    assert.equal(typeof condition, 'string');
    assert.ok(condition.length > 30);
    assert.equal(result.quiz[field], true);
    const expected = `Evidence-backed signal: ${condition}`;
    assert.equal(result.quizRows.find(row => row.label === label).value, expected);
    for (const surface of result.surfaces) {
      assert.equal(surface.prepared.compatibilityConditions[field], condition);
      assert.equal(surface.prepared[field], true);
      assert.equal(surface.rows.find(row => row.label === label).value, expected);
    }
  }
  for (const flag of ['false', 'TRUE', true, '']) {
    const disabled = api.project(slug, fresh, flag);
    assert.equal(disabled.graphPresent, false);
    assertUnknown(disabled);
  }
  assertUnknown(api.project(slug, '2026-11-01T00:00:00Z'));
  assertUnknown(api.project('unreviewed-model', fresh));
});
