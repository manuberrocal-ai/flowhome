import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mountQuizCompatibility } from '../src/lib/blocks/block9/quiz-presentation.ts';
import { selectRecommendationResult } from '../src/lib/quiz-recommend.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';

const base = ['tapo-c120-security-camera', 'eufy-security-indoor-cam-c120'].map(slug => ({ slug, category: 'security-camera', catalogActive: true, alexaCompatible: true }));
function controls() {
  const win = Object.assign(new EventTarget(), { navigator: { onLine: true } });
  const doc = Object.assign(new EventTarget(), { defaultView: win, visibilityState: 'visible' });
  const button = Object.assign(new EventTarget(), { disabled: false, setAttribute() {} });
  const status = { textContent: '' };
  const root = { ownerDocument: doc, hidden: true, querySelector: selector => selector.endsWith('status]') ? status : button };
  return { root, win, button, status };
}
const graph = documentaryCandidateProvider.getGraph();
const options = { enabled: true, endpoint: '/compatibility', pageUrl: 'https://flowhome.invalid/quiz/', fetch: (url, init) => {
  assert.equal(url.searchParams.get('surface'), 'quiz');
  return serveCompatibilityRequest(new Request(url, init), { enabled: true, clock: () => new Date('2026-09-07T01:40:00Z'), readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-10-01T00:00:00Z' }) });
} };

test('quiz mounting is inert by default and isolates base data', async () => {
  for (const enabled of [undefined, false, 'true', 1]) {
    const mounted = mountQuizCompatibility(base, null, () => { throw Error('Unexpected notification'); }, { enabled });
    assert.equal(await mounted.refresh(), false);
    mounted.read()[0].alexaCompatible = false;
    assert.equal(mounted.read()[0].alexaCompatible, true); mounted.dispose();
  }
});

test('quiz changes rerun real selection after refresh, expiry, offline and disposal without changing answers', async () => {
  const ui = controls(); let time = 0; let notifications = 0;
  const answers = Object.freeze({ goal: 'security', ecosystem: 'alexa', budget: 'open', installation: 'advanced', extra: 'open' });
  let result;
  const mounted = mountQuizCompatibility(base, ui.root, () => { notifications++; result = selectRecommendationResult(answers, mounted.read()); }, { ...options, clock: { monotonic: () => time, wall: () => time } });
  try {
    assert.equal(ui.root.hidden, false);
    assert.equal(selectRecommendationResult(answers, mounted.read()).ecosystemEvidenceUnavailable, true);
    assert.equal(await mounted.refresh(), true); await Promise.resolve();
    assert.equal(result.ecosystemEvidenceUnavailable, false);
    time = 60_000; mounted.read(); await Promise.resolve();
    assert.equal(result.ecosystemEvidenceUnavailable, true);
    await mounted.refresh(); await Promise.resolve(); assert.equal(result.ecosystemEvidenceUnavailable, false);
    ui.win.navigator.onLine = false; ui.win.dispatchEvent(new Event('offline')); await Promise.resolve();
    assert.equal(result.ecosystemEvidenceUnavailable, true);
    ui.win.navigator.onLine = true; ui.win.dispatchEvent(new Event('online')); await Promise.resolve();
    assert.equal(result.ecosystemEvidenceUnavailable, true);
    await mounted.refresh(); mounted.dispose();
    assert.equal(result.ecosystemEvidenceUnavailable, true);
    const count = notifications; await Promise.resolve(); assert.equal(notifications, count);
    assert.equal(ui.button.disabled, true); assert.equal(await mounted.refresh(), false);
    assert.deepEqual(answers, { goal: 'security', ecosystem: 'alexa', budget: 'open', installation: 'advanced', extra: 'open' });
  } finally { mounted.dispose(); }
});

test('quiz page consumes current catalog and refresh does not track or move focus', () => {
  const source = readFileSync(new URL('../src/pages/quiz.astro', import.meta.url), 'utf8');
  assert.equal((source.match(/selectRecommendationResult\(state, liveCatalog\.read\(\), 4\)/g) || []).length, 2);
  assert.doesNotMatch(source, /selectRecommendationResult\(state, catalog/);
  assert.match(source, /if \(!results.hidden && isCompleteQuizState\(state\)\) renderResults\(false, false\)/);
  assert.match(source, /if \(moveFocus\) \{\s*results.focus/);
  assert.match(source, /if \(trackCompletion\) queueQuizCompletion/);
  assert.match(source, /escapeHtml\(notice\)/);
});
