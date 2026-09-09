import { createCommerceClient, bindCommerceLifecycle } from './delivery-client.ts';
import { getAvailabilitySchemaUrl, type AvailabilityStatus } from '../../commerce-data.ts';

export interface CommercePresentation {
  /** Bind every repeated display. These elements must contain only transient text. */
  slots: { price: HTMLElement; source: HTMLElement; availability: HTMLElement }[];
  status: HTMLElement;
  refresh: HTMLButtonElement;
}

const stockLabels: [AvailabilityStatus, string][] = [
  ['in-stock', 'In stock'], ['out-of-stock', 'Out of stock'],
  ['preorder', 'Preorder'], ['discontinued', 'Discontinued'],
];
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function renderCommerceObservation(slot: CommercePresentation['slots'][number], snapshot: ReturnType<ReturnType<typeof createCommerceClient>['read']>) {
  slot.price.textContent = snapshot ? dollars.format(snapshot.price.value) : '';
  slot.source.textContent = snapshot ? `Amazon price snapshot · Captured ${snapshot.price.capturedAt}` : '';
  slot.availability.textContent = snapshot?.availability
    ? stockLabels.find(([state]) => getAvailabilitySchemaUrl(state) === snapshot.availability?.value)?.[1] ?? '' : '';
}

/** Explicit, default-inert enhancement. Never changes purchase links or static guards.
 * The caller supplies empty transient slots and keeps the Amazon fallback outside them.
 */
export function mountCommercePresentation(
  elements: CommercePresentation,
  asin: string,
  options: Omit<Parameters<typeof createCommerceClient>[0], 'changed'> & { enabled?: boolean },
) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const doc = elements.status.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw Error('Commerce presentation requires a live document');
  const slots = elements.slots.map(slot => ({ ...slot }));
  let busy = false;
  let disposed = false;
  const client = createCommerceClient({ ...options, changed: render });

  function render() {
    const snapshot = client.read();
    for (const slot of slots) {
      renderCommerceObservation(slot, snapshot);
    }
    elements.status.setAttribute('role', 'status');
    elements.status.textContent = busy ? 'Checking price and availability…'
      : snapshot ? 'Price snapshot loaded, not a checkout quote. Confirm price and availability on Amazon.'
        : 'A current price is unavailable here. Refresh to check again, or check on Amazon.';
    // Keep keyboard focus during a request; the refresh guard prevents duplicates.
    elements.refresh.disabled = disposed;
    elements.refresh.setAttribute('aria-disabled', String(busy || disposed));
    elements.refresh.setAttribute('aria-busy', String(busy));
  }

  const unbind = bindCommerceLifecycle(client, doc, win);
  async function refresh() {
    if (busy || disposed) return false;
    busy = true;
    const pending = client.refresh(asin);
    render();
    try { return await pending; }
    finally { if (!disposed) { busy = false; render(); } }
  }
  const click = () => { void refresh(); };
  elements.refresh.addEventListener('click', click);
  render();
  return {
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true; busy = false;
      elements.refresh.removeEventListener('click', click);
      unbind();
      render();
    },
  };
}
