import { mountCommercePresentation, type CommercePresentation } from './delivery-presentation.ts';

/** Caller supplies the expected identity and all product slots in one root. No public caller. */
export function mountProductCommerce(root: HTMLElement, asin: string, options: Parameters<typeof mountCommercePresentation>[2]) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  if (!/^[A-Z0-9]{10}$/.test(asin)) throw Error('Invalid commerce identity');
  const panels = [...root.querySelectorAll<HTMLElement>('[data-commerce-observation]')];
  if (panels.length === 0 || panels.some(panel => panel.dataset.commerceObservation !== asin)) throw Error('Mismatched commerce presentation identity');
  const controls = root.querySelectorAll<HTMLElement>('[data-commerce-controls]');
  if (controls.length !== 1) throw Error('Expected one commerce control group');
  const status = controls[0].querySelector<HTMLElement>('[data-commerce-status]');
  const refresh = controls[0].querySelector<HTMLButtonElement>('[data-commerce-refresh]');
  if (!status || !refresh) throw Error('Incomplete commerce controls');
  const slots: CommercePresentation['slots'] = panels.map(panel => {
    const price = panel.querySelector<HTMLElement>('[data-commerce-price]');
    const source = panel.querySelector<HTMLElement>('[data-commerce-source]');
    const availability = panel.querySelector<HTMLElement>('[data-commerce-availability]');
    if (!price || !source || !availability) throw Error('Incomplete commerce observation');
    return { price, source, availability };
  });
  const mounted = mountCommercePresentation({ slots, status, refresh }, asin, options);
  const notes = [...root.querySelectorAll<HTMLElement>('[data-commerce-static-price-note]')].map(element => ({ element, hidden: element.hidden }));
  for (const { element } of notes) element.hidden = true;
  for (const panel of panels) panel.hidden = false;
  return { refresh: mounted.refresh, dispose() {
    mounted.dispose();
    for (const panel of panels) panel.hidden = true;
    for (const { element, hidden } of notes) element.hidden = hidden;
  } };
}
