import { mountCompatibilityPresentation, type CompatibilityPresentation } from './delivery-presentation.ts';

const fields = new Set(['wifi', 'bluetooth', 'zigbee', 'matter', 'thread', 'smartthingsIntegration', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit']);
/** Explicit trusted integration entry point; no import/call from public page scripts. */
export function mountProductCompatibility(root: HTMLElement, options: Parameters<typeof mountCompatibilityPresentation>[2]) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const slug = root.dataset.compatibilityProduct;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error('Invalid product presentation context');
  const status = root.querySelector<HTMLElement>('[data-compatibility-status]');
  const notices = root.querySelector<HTMLElement>('[data-compatibility-notices]');
  const refresh = root.querySelector<HTMLButtonElement>('[data-compatibility-refresh]');
  const controls = root.querySelector<HTMLElement>('[data-compatibility-controls]');
  if (!status || !notices || !refresh || !controls) throw Error('Incomplete product presentation controls');
  const slots: CompatibilityPresentation['fields'] = [];
  for (const value of root.querySelectorAll<HTMLElement>('[data-compatibility-value]')) {
    const field = value.dataset.compatibilityValue;
    if (!field || !fields.has(field)) throw Error('Invalid product presentation field');
    const source = root.querySelector<HTMLElement>(`[data-compatibility-source="${field}"]`);
    if (!source) throw Error('Missing product presentation source');
    slots.push({ field: field as CompatibilityPresentation['fields'][number]['field'], value, source });
  }
  if (new Set(slots.map(slot => slot.field)).size !== fields.size) throw Error('Incomplete product presentation fields');
  const mounted = mountCompatibilityPresentation({ fields: slots, status, notices, refresh }, { slug, surface: 'product', market: 'US' }, options);
  for (const old of root.querySelectorAll('[data-compatibility-static-notices]')) old.remove();
  controls.hidden = false;
  return mounted;
}
