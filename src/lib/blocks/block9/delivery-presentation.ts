import { createCompatibilityClient, bindCompatibilityLifecycle } from './delivery-client.ts';
import { getFeatureEvidenceLabel } from '../../product-feature-evidence.ts';
import type { CompatibilityRequestContext } from './request-delivery.ts';

type Field = 'wifi' | 'bluetooth' | 'zigbee' | 'matter' | 'thread' | 'smartthingsIntegration' | 'alexaCompatible' | 'googleHomeCompatible' | 'appleHomeKit';
export interface CompatibilityPresentation {
  /** Supply every repeated display of a field (chips, rows, etc.), not just one. */
  fields: { field: Field; value: HTMLElement; source: HTMLElement }[];
  notices: HTMLElement;
  status: HTMLElement;
  refresh: HTMLButtonElement;
}

/** Enhances explicitly supplied existing slots. Default is inert; no endpoint is inferred.
 * Callers must bind every display of the current context, including repeated fields.
 * This does not authorize a source, replace the static delivery guard, or refresh relations.
 */
export function mountCompatibilityPresentation(
  elements: CompatibilityPresentation,
  context: CompatibilityRequestContext,
  options: Omit<Parameters<typeof createCompatibilityClient>[0], 'changed'> & { enabled?: boolean },
) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const doc = elements.status.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw Error('Compatibility presentation requires a live document');
  const target = { ...context };
  const slots = elements.fields.map(slot => ({ ...slot }));
  let busy = false;
  let disposed = false;
  const client = createCompatibilityClient({ ...options, changed: render });

  function render() {
    const snapshot = client.read();
    // A single snapshot governs every supplied display; never reuse previous strings.
    for (const slot of slots) {
      slot.value.textContent = snapshot ? getFeatureEvidenceLabel(snapshot.product, slot.field) : 'Not verified';
      slot.source.textContent = snapshot?.product.compatibilityProvenance[slot.field] ?? '';
    }
    const fragment = doc.createDocumentFragment();
    for (const notice of snapshot?.notices ?? []) {
      const item = doc.createElement('li');
      item.textContent = `${notice.message} Evidence: ${notice.evidenceLabel}; confidence: ${notice.confidence}; source: ${notice.sourceLabel}.`;
      fragment.append(item);
    }
    elements.notices.replaceChildren(fragment);
    elements.notices.hidden = !snapshot?.notices.length;
    elements.status.textContent = busy ? 'Checking compatibility evidence…'
      : snapshot ? 'Evidence loaded. Read each condition before choosing a setup.'
        : 'Current compatibility evidence is unavailable. Refresh to check again; missing evidence does not establish incompatibility.';
    elements.status.setAttribute('role', 'status');
    elements.refresh.disabled = busy || disposed;
    elements.refresh.setAttribute('aria-busy', String(busy));
  }

  const unbind = bindCompatibilityLifecycle(client, doc, win);
  async function refresh() {
    if (busy || disposed) return false;
    busy = true;
    const pending = client.refresh(target);
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
