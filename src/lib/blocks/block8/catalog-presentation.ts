import { createCommerceCollection } from './delivery-collection.ts';
import { bindCommerceLifecycle } from './delivery-client.ts';
import { renderCommerceObservation } from './delivery-presentation.ts';

/** Explicit catalog enhancement, not imported by public page scripts. */
export function mountCatalogCommerce(root: HTMLElement, options: Parameters<typeof createCommerceCollection>[1]) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const controls = root.querySelector<HTMLElement>('[data-commerce-catalog-controls]');
  const status = controls?.querySelector<HTMLElement>('[data-commerce-status]');
  const button = controls?.querySelector<HTMLButtonElement>('[data-commerce-refresh]');
  const win = root.ownerDocument.defaultView;
  if (!controls || !status || !button || !win) throw Error('Incomplete commerce catalog controls');
  const slots = [...root.querySelectorAll<HTMLElement>('[data-commerce-observation]')].map(panel => {
    const asin = panel.dataset.commerceObservation ?? '';
    const price = panel.querySelector<HTMLElement>('[data-commerce-price]');
    const source = panel.querySelector<HTMLElement>('[data-commerce-source]');
    const availability = panel.querySelector<HTMLElement>('[data-commerce-availability]');
    if (!price || !source || !availability) throw Error('Incomplete catalog observation');
    return { asin, panel, price, source, availability };
  });
  let disposed = false; let busy = false;
  const collection = createCommerceCollection(slots.map(slot => slot.asin), { ...options, changed: render });
  function render() {
    const rows = collection.read();
    const values = new Map(rows.map(row => [row.asin, row.observation]));
    for (const slot of slots) {
      const observation = values.get(slot.asin) ?? null;
      renderCommerceObservation(slot, observation);
      slot.panel.hidden = observation === null;
    }
    const available = rows.filter(row => row.observation !== null).length;
    status!.textContent = busy ? `Checking catalog prices: ${available} of ${rows.length} snapshots loaded…`
      : `${available} of ${rows.length} products have a current price snapshot. Refresh to check again. Confirm price and availability on Amazon before buying.`;
    button!.disabled = disposed;
    button!.setAttribute('aria-disabled', String(busy || disposed));
    button!.setAttribute('aria-busy', String(busy));
  }
  const unbind = bindCommerceLifecycle(collection, root.ownerDocument, win);
  const refresh = async () => {
    if (disposed || busy) return false;
    busy = true;
    const pending = collection.refreshAll(); render();
    try { return await pending; } finally { if (!disposed) { busy = false; render(); } }
  };
  const click = () => { void refresh(); };
  button.addEventListener('click', click); controls.hidden = false; render();
  return { refresh, dispose() {
    if (disposed) return;
    disposed = true; busy = false; button.removeEventListener('click', click);
    unbind(); render(); controls.hidden = true;
  } };
}
