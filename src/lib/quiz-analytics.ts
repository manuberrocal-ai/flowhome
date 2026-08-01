import { getAnalyticsClientId, queueEvent } from './analytics';
import { getQueuedExperimentExposureScope } from './experiments';

export const QUIZ_COMPLETION_STORAGE_KEY = 'flowhome-quiz-completions-v1';
const queuedCompletionKeys = new Set<string>();

function getStorage() { try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; } }
function readCompletionKeys(storage = getStorage()) {
  if (!storage) return new Set<string>();
  try {
    const value = JSON.parse(storage.getItem(QUIZ_COMPLETION_STORAGE_KEY) || '[]');
    return Array.isArray(value) && value.every((key) => typeof key === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(key)) ? new Set(value) : new Set<string>();
  } catch { return new Set<string>(); }
}
function completionKey(clientId: string, exposureScope: string) {
  return `quiz-complete-${exposureScope}-${clientId}`.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

/** Queues once per exposure/session. A local queue result is not provider delivery. */
export function queueQuizCompletion(parameters: Record<string, unknown>, storage = getStorage()) {
  const clientId = getAnalyticsClientId();
  if (!clientId) return false;
  const key = completionKey(clientId, getQueuedExperimentExposureScope());
  const stored = readCompletionKeys(storage);
  if (queuedCompletionKeys.has(key) || stored.has(key)) return false;
  if (queueEvent('quiz_complete', { ...parameters, dedupe_key: key }).status !== 'queued') return false;
  queuedCompletionKeys.add(key);
  try { storage?.setItem(QUIZ_COMPLETION_STORAGE_KEY, JSON.stringify([...stored, key].slice(-50))); } catch { /* In-memory dedupe remains for this page. */ }
  return true;
}

/** The quiz restart control is the explicit reset for its current session scope. */
export function resetQuizCompletionDedupe(storage = getStorage()) {
  const clientId = getAnalyticsClientId();
  if (!clientId) return;
  const key = completionKey(clientId, getQueuedExperimentExposureScope());
  queuedCompletionKeys.delete(key);
  const remaining = [...readCompletionKeys(storage)].filter((entry) => entry !== key);
  try { storage?.setItem(QUIZ_COMPLETION_STORAGE_KEY, JSON.stringify(remaining)); } catch { /* Optional storage. */ }
}
