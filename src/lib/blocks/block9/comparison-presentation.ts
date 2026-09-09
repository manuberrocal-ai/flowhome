import { createCompatibilityCollection } from './delivery-collection.ts';
import { bindCompatibilityLifecycle } from './delivery-client.ts';
import { buildComparisonInsights, formatComparisonSignals, getComparisonFeatureLabel, type ComparisonInsightProduct } from '../../comparison-insights.ts';
import { createCommerceCollection } from '../block8/delivery-collection.ts';

const fields = new Set(['matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'thread', 'smartthingsIntegration']);
const mountedRoots = new WeakSet<HTMLElement>();
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
/** Explicit local/integration entry point. Public scripts do not import or call it. */
export function mountComparisonCompatibility(root: HTMLElement, options: Omit<Parameters<typeof createCompatibilityCollection>[1], 'surface' | 'changed'> & {
  commerce?: Omit<Parameters<typeof createCommerceCollection>[1], 'changed'>;
}) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  if (mountedRoots.has(root)) throw Error('Comparison already mounted');
  const commerceEnabled = options.commerce?.enabled === true;
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
    if (commerceEnabled && (typeof row.asin !== 'string' || !/^[A-Z0-9]{10}$/.test(row.asin))) throw Error('Invalid comparison commerce identity');
    return { slug: row.slug, asin: row.asin, name: row.name, category: row.category, formFactor: row.formFactor };
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
  const originalButtonText = button.textContent;
  const tradeoffs = required('[data-comparison-tradeoffs]');
  const leaders = required('[data-comparison-leaders]');
  const limits = required('[data-comparison-limits]');
  const best = required('[data-comparison-best-fit]');
  const final = required('[data-comparison-final]');
  const buyers = products.map(product => required(`[data-comparison-buyer="${product.slug}"]`));
  const sources = [...root.querySelectorAll<HTMLElement>('[data-comparison-source]')];
  const priceSlots = commerceEnabled ? [...root.querySelectorAll<HTMLElement>('[data-comparison-commerce]')] : [];
  for (const slot of priceSlots) if (!identities.has(slot.dataset.comparisonSlug ?? '') || !['price', 'source'].includes(slot.dataset.comparisonCommerce ?? '')) throw Error('Invalid comparison commerce slot');
  if (commerceEnabled) for (const product of products) {
    const matched = priceSlots.filter(slot => slot.dataset.comparisonSlug === product.slug);
    if (matched.filter(slot => slot.dataset.comparisonCommerce === 'price').length < 2 || !matched.some(slot => slot.dataset.comparisonCommerce === 'source')) throw Error('Incomplete comparison commerce slots');
  }
  let busy = false; let disposed = false;
  const collection = createCompatibilityCollection(products, { ...options, surface: 'comparison', changed: render });
  const commerce = commerceEnabled ? createCommerceCollection(products.map(product => product.asin!), { ...options.commerce!, changed: render }) : null;
  const list = (element: HTMLElement, values: string[]) => {
    const fragment = doc.createDocumentFragment();
    for (const value of values) { const item = doc.createElement('li'); item.textContent = value; fragment.append(item); }
    element.replaceChildren(fragment);
  };
  function render() {
    const records = collection.read();
    const current = records.map(record => record.product);
    const bySlug = new Map(current.map(product => [product.slug, product]));
    const prices = new Map(commerce?.read().map(record => [record.asin, record.observation]) ?? []);
    for (const slot of priceSlots) {
      const observation = prices.get(bySlug.get(slot.dataset.comparisonSlug!)!.asin!);
      slot.textContent = slot.dataset.comparisonCommerce === 'price'
        ? observation ? `${dollars.format(observation.price.value)} snapshot` : 'Check price on Amazon'
        : observation ? `Amazon price snapshot · Captured ${observation.price.capturedAt}` : 'Current authorized price unavailable';
    }
    for (const slot of slots) slot.textContent = getComparisonFeatureLabel(bySlug.get(slot.dataset.comparisonSlug!)!, slot.dataset.comparisonField as Parameters<typeof getComparisonFeatureLabel>[1]);
    for (const source of sources) source.textContent = bySlug.get(source.dataset.comparisonSlug ?? '')?.compatibilityProvenance?.[source.dataset.comparisonSource ?? ''] ?? '';
    const insights = commerce ? formatComparisonSignals(current.map(product => ({
      ...product, price: prices.get(product.asin!)?.price.value,
      ownerRating: undefined, ownerRatingCount: undefined,
    }))) : buildComparisonInsights(current);
    const notes = records.flatMap(record => record.notices.map(notice => `${record.product.name}: ${notice.message} Evidence: ${notice.evidenceLabel}; confidence: ${notice.confidence}; source: ${notice.sourceLabel}.`));
    list(tradeoffs, [...insights.tradeoffs, ...notes]);
    for (let index = 0; index < buyers.length; index++) list(buyers[index], insights.buyerFits[index].reasons);
    list(leaders, insights.ecosystemLeaders.map(leader => leader.reason)); leaders.hidden = insights.ecosystemLeaders.length === 0;
    list(limits, [...insights.evidenceLimits, ...(records.some(record => record.notices.some(notice => notice.relation === 'conflicts')) ? ['Documented conflicts require review before considering these products comparable.'] : [])]);
    best.textContent = insights.bestFitBySignal; final.textContent = insights.finalRecommendation;
    const evidenceStatus = 'Compatibility reflects available evidence. Missing evidence does not establish incompatibility; refresh to check again.';
    status.textContent = busy ? commerce ? 'Checking prices and compatibility evidence…' : 'Checking compatibility evidence…'
      : commerce ? `${[...prices.values()].filter(Boolean).length} of ${prices.size} products have a current price snapshot. Confirm price on Amazon. ${evidenceStatus}` : evidenceStatus;
    // Keep keyboard focus while pending; refresh() guards repeated activation.
    button.disabled = disposed;
    button.setAttribute('aria-disabled', String(busy || disposed));
    button.setAttribute('aria-busy', String(busy));
  }
  const unbind = bindCompatibilityLifecycle({
    setPermitted(value: boolean) { collection.setPermitted(value); commerce?.setPermitted(value); },
    dispose() { collection.dispose(); commerce?.dispose(); },
  }, doc, doc.defaultView);
  async function refresh() {
    if (disposed || busy) return false;
    busy = true;
    const pending = Promise.all([collection.refreshAll(), ...(commerce ? [commerce.refreshAll()] : [])]).then(results => results.every(Boolean)); render();
    try { return await pending; } finally { if (!disposed) { busy = false; render(); } }
  }
  const click = () => { void refresh(); };
  mountedRoots.add(root);
  if (commerce) button.textContent = 'Refresh prices and evidence';
  button.addEventListener('click', click); controls.hidden = false; render();
  return { refresh, dispose() { if (disposed) return; disposed = true; busy = false; button.removeEventListener('click', click); unbind(); render(); button.textContent = originalButtonText; mountedRoots.delete(root); } };
}
