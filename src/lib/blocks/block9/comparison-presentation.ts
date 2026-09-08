import { createCompatibilityCollection } from './delivery-collection.ts';
import { bindCompatibilityLifecycle } from './delivery-client.ts';
import { buildComparisonInsights, getComparisonFeatureLabel, type ComparisonInsightProduct } from '../../comparison-insights.ts';

const fields = new Set(['matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'thread', 'smartthingsIntegration']);
/** Explicit local/integration entry point. Public scripts do not import or call it. */
export function mountComparisonCompatibility(root: HTMLElement, options: Omit<Parameters<typeof createCompatibilityCollection>[1], 'surface' | 'changed'>) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const doc = root.ownerDocument;
  if (!doc.defaultView) throw Error('Comparison requires a live document');
  const required = (selector: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw Error('Incomplete comparison presentation');
    return element;
  };
  const raw: unknown = JSON.parse(required('[data-comparison-base]').textContent ?? 'null');
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > 4) throw Error('Invalid comparison identities');
  // Intentionally no prices or other commercial observations in this static-page payload.
  const products: ComparisonInsightProduct[] = raw.map(row => {
    if (!row || typeof row.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug) || row.slug.length > 120 || typeof row.name !== 'string' || typeof row.category !== 'string'
      || (row.formFactor !== undefined && typeof row.formFactor !== 'string')) throw Error('Invalid comparison identity');
    return { slug: row.slug, name: row.name, category: row.category, formFactor: row.formFactor };
  });
  const identities = new Set(products.map(product => product.slug));
  const slots = [...root.querySelectorAll<HTMLElement>('[data-comparison-field]')];
  for (const slot of slots) if (!identities.has(slot.dataset.comparisonSlug ?? '') || !fields.has(slot.dataset.comparisonField ?? '')) throw Error('Invalid comparison field');
  for (const product of products) {
    if (new Set(slots.filter(slot => slot.dataset.comparisonSlug === product.slug).map(slot => slot.dataset.comparisonField)).size !== fields.size) throw Error('Incomplete comparison fields');
  }
  const status = required('[data-comparison-status]');
  const controls = required('[data-comparison-controls]');
  const button = required('[data-comparison-refresh]') as HTMLButtonElement;
  const tradeoffs = required('[data-comparison-tradeoffs]');
  const leaders = required('[data-comparison-leaders]');
  const limits = required('[data-comparison-limits]');
  const best = required('[data-comparison-best-fit]');
  const final = required('[data-comparison-final]');
  const buyers = products.map(product => required(`[data-comparison-buyer="${product.slug}"]`));
  const sources = [...root.querySelectorAll<HTMLElement>('[data-comparison-source]')];
  let busy = false; let disposed = false;
  const collection = createCompatibilityCollection(products, { ...options, surface: 'comparison', changed: render });
  const list = (element: HTMLElement, values: string[]) => {
    const fragment = doc.createDocumentFragment();
    for (const value of values) { const item = doc.createElement('li'); item.textContent = value; fragment.append(item); }
    element.replaceChildren(fragment);
  };
  function render() {
    const records = collection.read();
    const current = records.map(record => record.product);
    const bySlug = new Map(current.map(product => [product.slug, product]));
    for (const slot of slots) slot.textContent = getComparisonFeatureLabel(bySlug.get(slot.dataset.comparisonSlug!)!, slot.dataset.comparisonField as Parameters<typeof getComparisonFeatureLabel>[1]);
    for (const source of sources) source.textContent = bySlug.get(source.dataset.comparisonSlug ?? '')?.compatibilityProvenance?.[source.dataset.comparisonSource ?? ''] ?? '';
    const insights = buildComparisonInsights(current);
    const notes = records.flatMap(record => record.notices.map(notice => `${record.product.name}: ${notice.message} Evidence: ${notice.evidenceLabel}; confidence: ${notice.confidence}; source: ${notice.sourceLabel}.`));
    list(tradeoffs, [...insights.tradeoffs, ...notes]);
    for (let index = 0; index < buyers.length; index++) list(buyers[index], insights.buyerFits[index].reasons);
    list(leaders, insights.ecosystemLeaders.map(leader => leader.reason)); leaders.hidden = insights.ecosystemLeaders.length === 0;
    list(limits, [...insights.evidenceLimits, ...(records.some(record => record.notices.some(notice => notice.relation === 'conflicts')) ? ['Documented conflicts require review before considering these products comparable.'] : [])]);
    best.textContent = insights.bestFitBySignal; final.textContent = insights.finalRecommendation;
    status.textContent = busy ? 'Checking compatibility evidence…' : 'Compatibility reflects available evidence. Missing evidence does not establish incompatibility; refresh to check again.';
    button.disabled = busy || disposed; button.setAttribute('aria-busy', String(busy));
  }
  const unbind = bindCompatibilityLifecycle(collection, doc, doc.defaultView);
  async function refresh() {
    if (disposed || busy) return false;
    busy = true; const pending = collection.refreshAll(); render();
    try { return await pending; } finally { if (!disposed) { busy = false; render(); } }
  }
  const click = () => { void refresh(); };
  button.addEventListener('click', click); controls.hidden = false; render();
  return { refresh, dispose() { if (disposed) return; disposed = true; busy = false; button.removeEventListener('click', click); unbind(); render(); } };
}
