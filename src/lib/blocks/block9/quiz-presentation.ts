import { createCompatibilityCollection } from './delivery-collection.ts';
import { bindCompatibilityLifecycle } from './delivery-client.ts';

type Options = Omit<Parameters<typeof createCompatibilityCollection>[1], 'surface' | 'changed'>;
/** Explicit integration only. Disabled callers retain their existing catalog and make no requests. */
export function mountQuizCompatibility<T extends { slug: string }>(catalog: readonly T[], controls: HTMLElement, changed: () => void, options?: Options) {
  const base = structuredClone([...catalog]);
  if (options?.enabled !== true) return { read: () => structuredClone(base), refresh: async () => false, dispose: () => {} };
  const doc = controls.ownerDocument;
  const win = doc.defaultView;
  const status = controls.querySelector<HTMLElement>('[data-quiz-evidence-status]');
  const button = controls.querySelector<HTMLButtonElement>('[data-quiz-evidence-refresh]');
  if (!win || !status || !button) throw Error('Incomplete quiz evidence controls');
  let busy = false; let disposed = false;
  const collection = createCompatibilityCollection(base, { ...options, surface: 'quiz', changed: () => { if (!disposed) changed(); } });
  const read = () => collection.read().map(record => ({ ...record.product, compatibilityNotices: record.notices.map(notice => `${notice.message} Evidence: ${notice.evidenceLabel}; confidence: ${notice.confidence}; source: ${notice.sourceLabel}.`) }));
  const renderStatus = () => {
    status.textContent = busy ? 'Checking compatibility evidence…' : 'Recommendations use available evidence. Missing evidence does not establish incompatibility; refresh to check again.';
    button.disabled = busy || disposed; button.setAttribute('aria-busy', String(busy));
  };
  const unbind = bindCompatibilityLifecycle(collection, doc, win);
  async function refresh() {
    if (disposed || busy) return false;
    busy = true; renderStatus();
    try { return await collection.refreshAll(); } finally { if (!disposed) { busy = false; renderStatus(); } }
  }
  const click = () => { void refresh(); };
  button.addEventListener('click', click); controls.hidden = false; renderStatus();
  return { read, refresh, dispose() {
    if (disposed) return;
    disposed = true; busy = false; button.removeEventListener('click', click); unbind(); renderStatus(); changed();
  } };
}
