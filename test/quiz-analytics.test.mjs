import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/quiz-analytics.ts', import.meta.url), 'utf8');
const executable = ts.transpileModule(source.replace(
  "import { getAnalyticsClientId, queueEvent } from './analytics';\nimport { getQueuedExperimentExposureScope } from './experiments';",
  "const getAnalyticsClientId = () => globalThis.__quizClientId; const queueEvent = (...args) => globalThis.__quizQueue(...args); const getQueuedExperimentExposureScope = () => globalThis.__quizExposureScope;",
), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const quizAnalytics = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('quiz completion queues once per exposure/session until the explicit restart reset', () => {
  const store = storage();
  const calls = [];
  globalThis.__quizClientId = 'fh-session-1234';
  globalThis.__quizExposureScope = 'home_primary_cta_v1-v1-control-42';
  globalThis.__quizQueue = (...args) => { calls.push(args); return { status: 'queued', eventId: 'evt-1' }; };
  const parameters = { page_type: 'quiz', goal: 'comfort', ecosystem: 'alexa', budget: 'open', installation: 'plug-and-play', extra: 'open', result_count: 2 };
  assert.equal(quizAnalytics.queueQuizCompletion(parameters, store), true);
  assert.equal(quizAnalytics.queueQuizCompletion(parameters, store), false);
  assert.equal(calls.length, 1);
  assert.match(calls[0][1].dedupe_key, /^quiz-complete-home_primary_cta_v1-v1-control-42-fh-session-1234$/);
  quizAnalytics.resetQuizCompletionDedupe(store);
  assert.equal(quizAnalytics.queueQuizCompletion(parameters, store), true);
  assert.equal(calls.length, 2);
});
