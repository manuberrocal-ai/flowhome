import { createCompatibilityClient, bindCompatibilityLifecycle } from './delivery-client.ts';

/** Explicit integration; alternatives permission is separate from the product field surface. */
export function mountRelationPresentation(root: HTMLElement, options: Omit<Parameters<typeof createCompatibilityClient>[0], 'changed'> & { enabled?: boolean }) {
  if (options.enabled !== true) return { refresh: async () => false, dispose: () => {} };
  const slug = root.dataset.relationshipProduct;
  const validSlug = (value: unknown): value is string => typeof value === 'string' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  if (!validSlug(slug)) throw Error('Invalid relationship context');
  const context = { slug, surface: 'alternatives' as const, market: 'US' as const };
  const doc = root.ownerDocument; const win = doc.defaultView;
  if (!win) throw Error('Relationships require a live document');
  const required = (selector: string) => {
    const element = root.querySelector<HTMLElement>(selector);
    if (!element) throw Error('Incomplete relationship presentation');
    return element;
  };
  const raw: unknown = JSON.parse(required('[data-relationship-catalog]').textContent ?? 'null');
  if (!Array.isArray(raw) || raw.length > 100 || raw.some(row => !row || !validSlug(row.slug) || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 300)
    || new Set(raw.map(row => row.slug)).size !== raw.length) throw Error('Invalid relationship catalog');
  const names = new Map<string, string>(raw.map(row => [row.slug, row.name]));
  const status = required('[data-relationship-status]');
  const button = required('[data-relationship-refresh]') as HTMLButtonElement;
  const notices = required('[data-relationship-notices]');
  const lists = { substitutes: required('[data-relationship-substitutes]'), complements: required('[data-relationship-complements]') };
  let busy = false; let disposed = false;
  const client = createCompatibilityClient({ ...options, changed: render });
  function render() {
    const snapshot = client.read();
    for (const kind of ['substitutes', 'complements'] as const) {
      const fragment = doc.createDocumentFragment();
      for (const relation of snapshot?.relations.filter(row => row.relation === kind) ?? []) {
        const item = doc.createElement('li'); item.className = 'my-4';
        const name = relation.targetType === 'product' ? names.get(relation.targetSlug) : undefined;
        const title = doc.createElement(name ? 'a' : 'strong');
        title.textContent = name ?? `${relation.targetType === 'hardware' ? 'Hardware reference' : 'Catalog entry unavailable'}: ${relation.targetSlug}`;
        title.className = 'font-bold';
        if (name) { (title as HTMLAnchorElement).href = `/product/${relation.targetSlug}/`; title.classList.add('text-blue-700', 'underline'); }
        const condition = doc.createElement('p'); condition.textContent = relation.condition;
        const source = doc.createElement('p'); source.className = 'text-sm text-slate-600';
        source.textContent = `Evidence: ${relation.evidenceLabel}; confidence: ${relation.confidence}; source: ${relation.sourceLabel}.`;
        item.append(title, condition, source); fragment.append(item);
      }
      lists[kind].replaceChildren(fragment);
    }
    const fragment = doc.createDocumentFragment();
    for (const notice of snapshot?.notices ?? []) {
      const item = doc.createElement('li');
      item.textContent = `${notice.message} Evidence: ${notice.evidenceLabel}; confidence: ${notice.confidence}; source: ${notice.sourceLabel}.`;
      fragment.append(item);
    }
    notices.replaceChildren(fragment); notices.hidden = !snapshot?.notices.length;
    status.textContent = busy ? 'Checking relationship evidence…' : snapshot?.relations.length
      ? 'Read each relationship condition. These records do not certify your exact variant or setup.'
      : 'No current relationship evidence is available here. This does not establish incompatibility; refresh to check again.';
    button.disabled = busy || disposed; button.setAttribute('aria-busy', String(busy));
  }
  const unbind = bindCompatibilityLifecycle(client, doc, win);
  async function refresh() {
    if (busy || disposed) return false;
    busy = true; const pending = client.refresh(context); render();
    try { return await pending; } finally { if (!disposed) { busy = false; render(); } }
  }
  const click = () => { void refresh(); };
  button.addEventListener('click', click); root.hidden = false; render();
  return { refresh, dispose() {
    if (disposed) return;
    disposed = true; busy = false; button.removeEventListener('click', click); unbind(); render();
  } };
}
