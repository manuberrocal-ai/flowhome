import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/experiments.ts', import.meta.url), 'utf8');
const executable = ts.transpileModule(source.replace(
  "import { hasAnalyticsConsent } from './consent';\nimport { getAnalyticsClientId, queueEvent } from './analytics';",
  "const hasAnalyticsConsent = () => Boolean(globalThis.__consent); const getAnalyticsClientId = () => globalThis.__clientId; const queueEvent = (...args) => { const result = globalThis.__track?.(...args) ?? true; return result === false ? { status: 'not_queued' } : { status: 'queued', eventId: 'local' }; };",
), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const experiments = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('hashing is deterministic, bounded, and reasonably distributed', () => {
  assert.equal(experiments.HOME_PRIMARY_CTA_EXPERIMENT.state, 'draft');
  assert.ok(experiments.EXPERIMENT_REGISTRY.every((experiment) => experiment.state === 'draft'));
  assert.equal(experiments.assignmentBucket('home_primary_cta_v1:v1:client-1'), experiments.assignmentBucket('home_primary_cta_v1:v1:client-1'));
  const buckets = Array.from({ length: 1000 }, (_, index) => experiments.assignmentBucket(`client-${index}`));
  assert.ok(buckets.every((bucket) => Number.isInteger(bucket) && bucket >= 0 && bucket <= 9999));
  assert.ok(new Set(buckets).size > 900);
});

test('resolution gates consent and enforces one experiment per mutual exclusion group', () => {
  const first = { ...experiments.HOME_PRIMARY_CTA_EXPERIMENT, state: 'active' };
  const second = { ...first, id: 'other', version: 'v1' };
  assert.deepEqual(experiments.resolveAssignments([first, second], 'client', { market: 'US', pageType: 'home', consent: false }), []);
  assert.equal(experiments.resolveAssignments([first, second], 'client', { market: 'US', pageType: 'home', consent: true }).length, 1);
  assert.deepEqual(experiments.resolveAssignments([first], 'client', { market: 'CA', pageType: 'home', consent: true }), []);
});

function activeExperiment() { return { ...experiments.HOME_PRIMARY_CTA_EXPERIMENT, state: 'active' }; }
function element(text = 'Find my setup') {
  const attrs = new Map();
  return { textContent: text, setAttribute: (key, value) => attrs.set(key, value), getAttribute: (key) => attrs.get(key) ?? null, removeAttribute: (key) => attrs.delete(key), attrs };
}
function installExperimentBrowser({ consent = true, flags = true, market = 'US', track = () => true, store = storage(), runtimeStore = storage(), runtimeEnabled = true } = {}) {
  globalThis.__consent = consent; globalThis.__clientId = 'client-1'; globalThis.__track = track;
  if (runtimeEnabled) runtimeStore.setItem(experiments.EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify({ enabled: true }));
  const cta = element();
  const listeners = new Map();
  globalThis.window = { sessionStorage: store, localStorage: runtimeStore, addEventListener: (name, listener) => { listeners.set(name, listener); } };
   globalThis.document = { documentElement: { dataset: { market } }, body: { dataset: { pageType: 'home', funnelExperimentV1: flags ? 'on' : 'off', homePrimaryCtaV1: flags ? 'on' : 'off' } }, querySelectorAll: () => [cta] };
  return { cta, store, runtimeStore, emitConsentChange: () => listeners.get('flowhome:consent-change')?.(), emitRuntimeChange: () => listeners.get('storage')?.({ key: experiments.EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY }) };
}

test('evaluation remains unknown, stops on guardrails, and otherwise requires human review', () => {
  const experiment = experiments.HOME_PRIMARY_CTA_EXPERIMENT;
  assert.equal(experiments.evaluateExperiment(experiment, { days: 13, controlQuizComplete: 30, treatmentQuizComplete: 30, controlExposures: 50, treatmentExposures: 50, protectionMetricsConfirmed: true }).status, 'unknown_insufficient_evidence');
  assert.equal(experiments.evaluateExperiment(experiment, { days: 28, controlQuizComplete: 30, treatmentQuizComplete: 30, controlExposures: 50, treatmentExposures: 50, protectionMetricsConfirmed: true, guardrailBreached: true }).status, 'stopped_guardrail');
  assert.equal(experiments.evaluateExperiment(experiment, { days: 28, controlQuizComplete: 30, treatmentQuizComplete: 30, controlExposures: 50, treatmentExposures: 50, protectionMetricsConfirmed: true }).status, 'ready_for_human_review');
});

test('flags off, consent off, and an empty registry never assign or expose', () => {
  for (const options of [{ flags: false, consent: true, registry: [activeExperiment()] }, { flags: true, consent: false, registry: [activeExperiment()] }, { flags: true, consent: true, registry: [] }]) {
    const browser = installExperimentBrowser({ flags: options.flags, consent: options.consent, track: () => { throw new Error('must not track'); } });
    const rollback = experiments.setupExperiments({ registry: options.registry });
    assert.equal(browser.store.getItem(experiments.EXPERIMENT_STORAGE_KEY), null);
    assert.equal(browser.cta.getAttribute('data-experiment-id'), null);
    assert.equal(typeof rollback, 'function');
  }
});

test('active assignment applies auditable DOM attrs, tracks exactly once, and rollback restores exactly', () => {
  const calls = [];
  const browser = installExperimentBrowser({ track: (...args) => { calls.push(args); return true; } });
  const rollback = experiments.setupExperiments({ registry: [activeExperiment()] });
  const assigned = experiments.resolveAssignments([activeExperiment()], 'client-1', { market: 'US', pageType: 'home', consent: true })[0];
  assert.equal(browser.cta.getAttribute('data-experiment-variant'), assigned.variant.id);
  assert.equal(browser.cta.textContent, assigned.variant.copy);
  assert.equal(browser.cta.getAttribute('data-experiment-id'), 'home_primary_cta_v1');
  assert.equal(browser.cta.getAttribute('data-experiment-assignment-state'), 'eligible');
  assert.equal(browser.cta.getAttribute('data-experiment-queue-state'), 'queued');
  assert.equal(JSON.parse(browser.store.getItem(experiments.EXPERIMENT_STORAGE_KEY)).length, 1);
  assert.equal(JSON.parse(browser.store.getItem(experiments.EXPERIMENT_STORAGE_KEY))[0].dispatch_state, 'queued');
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'experiment_exposure');
  assert.equal(calls[0][1].dedupe_key, `exposure-home_primary_cta_v1-v1-${assigned.variant.id}`);
  rollback();
  assert.equal(browser.cta.textContent, 'Find my setup');
  assert.equal(browser.cta.getAttribute('data-experiment-id'), null);
  assert.equal(browser.cta.getAttribute('data-experiment-variant'), null);

  const wrongSegment = installExperimentBrowser({ market: 'CA', track: () => true });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(wrongSegment.cta.getAttribute('data-experiment-id'), null);
});

test('setup is idempotent and a reload reapplies a valid stored assignment without a second exposure', () => {
  const store = storage();
  const firstCalls = [];
  const firstBrowser = installExperimentBrowser({ store, track: (...args) => { firstCalls.push(args); return true; } });
  const first = experiments.setupExperiments({ registry: [activeExperiment()] });
  const second = experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(first, second);
  assert.equal(firstCalls.length, 1);
  const secondCalls = [];
  const reloaded = installExperimentBrowser({ store, track: (...args) => { secondCalls.push(args); return true; } });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(reloaded.cta.getAttribute('data-experiment-variant'), firstBrowser.cta.getAttribute('data-experiment-variant'));
  assert.equal(secondCalls.length, 0);
});

test('untrusted corrupt or mismatched storage is discarded and a current assignment is exposed', () => {
  const store = storage();
  store.setItem(experiments.EXPERIMENT_STORAGE_KEY, '{bad');
  const corruptCalls = [];
  installExperimentBrowser({ store, track: (...args) => { corruptCalls.push(args); return true; } });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(corruptCalls.length, 1);
  const expected = JSON.parse(store.getItem(experiments.EXPERIMENT_STORAGE_KEY))[0];
  const mismatchStore = storage();
  mismatchStore.setItem(experiments.EXPERIMENT_STORAGE_KEY, JSON.stringify([{ ...expected, assignment_bucket: (expected.assignment_bucket + 1) % 10000 }]));
  const mismatchCalls = [];
  installExperimentBrowser({ store: mismatchStore, track: (...args) => { mismatchCalls.push(args); return true; } });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(mismatchCalls.length, 1);
  assert.deepEqual(JSON.parse(mismatchStore.getItem(experiments.EXPERIMENT_STORAGE_KEY)), [expected]);
});

test('provider failure restores text and attributes, does not persist, and consent revocation rolls back and clears storage', () => {
  const failed = installExperimentBrowser({ track: () => { throw new Error('provider'); } });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(failed.cta.textContent, 'Find my setup');
  assert.equal(failed.cta.getAttribute('data-experiment-id'), null);
  assert.equal(failed.cta.getAttribute('data-experiment-variant'), null);
  assert.equal(failed.store.getItem(experiments.EXPERIMENT_STORAGE_KEY), null);

  const browser = installExperimentBrowser({ track: () => true });
  experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(browser.cta.getAttribute('data-experiment-id'), 'home_primary_cta_v1');
  globalThis.__consent = false;
  browser.emitConsentChange();
  assert.equal(browser.cta.textContent, 'Find my setup');
  assert.equal(browser.cta.getAttribute('data-experiment-id'), null);
  assert.equal(browser.store.getItem(experiments.EXPERIMENT_STORAGE_KEY), null);
});

test('runtime config is fail-closed by default and its local kill switch rolls treatment back without a deploy', () => {
  const browser = installExperimentBrowser({ runtimeEnabled: false });
  const rollback = experiments.setupExperiments({ registry: [activeExperiment()] });
  assert.equal(browser.cta.getAttribute('data-experiment-id'), null);
  assert.equal(experiments.isExperimentRuntimeEnabled(browser.runtimeStore), false);
  assert.equal(experiments.setExperimentRuntimeEnabled(true, browser.runtimeStore), true);
  browser.emitRuntimeChange();
  assert.equal(browser.cta.getAttribute('data-experiment-id'), 'home_primary_cta_v1');
  assert.equal(experiments.setExperimentRuntimeEnabled(false, browser.runtimeStore), true);
  browser.emitRuntimeChange();
  assert.equal(browser.cta.getAttribute('data-experiment-id'), null);
  rollback();
});

test('evaluation requires days, outcomes, balanced exposures, and protection confirmation', () => {
  const e = experiments.HOME_PRIMARY_CTA_EXPERIMENT;
  const base = { days: 14, controlQuizComplete: 30, treatmentQuizComplete: 30, controlExposures: 50, treatmentExposures: 50, protectionMetricsConfirmed: true };
  assert.equal(experiments.evaluateExperiment(e, { ...base, controlExposures: 80, treatmentExposures: 20 }).status, 'unknown_insufficient_evidence');
  assert.equal(experiments.evaluateExperiment(e, { ...base, protectionMetricsConfirmed: false }).status, 'unknown_insufficient_evidence');
  assert.equal(experiments.evaluateExperiment(e, { ...base, guardrailBreached: true }).status, 'stopped_guardrail');
  assert.equal(experiments.evaluateExperiment(e, base).status, 'ready_for_human_review');
});
