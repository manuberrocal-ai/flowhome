import { createCompatibilityClient } from './delivery-client.ts';
import type { CompatibilityRequestContext } from './request-delivery.ts';

const fields = ['wifi', 'bluetooth', 'zigbee', 'matter', 'thread', 'smartthingsIntegration', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit'] as const;
/** Catalog must be the caller's public base data, never a prior derived recommendation.
 * No requests until refresh/refreshAll; no persistence or automatic polling.
 */
export function createCompatibilityCollection<T extends { slug: string }>(products: readonly T[], options: Omit<Parameters<typeof createCompatibilityClient>[0], 'changed'> & {
  enabled?: boolean;
  surface: CompatibilityRequestContext['surface'];
  changed?: () => void;
}) {
  if (products.length > 100 || new Set(products.map(product => product.slug)).size !== products.length
    || products.some(product => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || product.slug.length > 120)) throw Error('Invalid collection identities');
  const base = structuredClone([...products]);
  const surface = options.surface;
  const enabled = options.enabled === true;
  let disposed = false;
  let permitted = true;
  let batch = 0;
  let queued = false;
  const changed = () => {
    if (queued || disposed) return;
    queued = true;
    queueMicrotask(() => { queued = false; if (!disposed) options.changed?.(); });
  };
  const clients = new Map(base.map(product => [product.slug, enabled ? createCompatibilityClient({ ...options, changed }) : null]));
  const reset = () => { batch++; for (const client of clients.values()) client?.invalidate(); changed(); };
  const refresh = async (slug: string) => {
    if (disposed || !permitted) return false;
    const client = clients.get(slug);
    return client ? client.refresh({ slug, surface, market: 'US' }) : false;
  };
  return {
    /** Read immediately before deriving rankings, tradeoffs, relations or visible text. */
    read() {
      return base.map(product => {
        const envelope = disposed ? null : clients.get(product.slug)?.read();
        const projected = structuredClone(product);
        if (enabled) {
          Object.assign(projected, Object.fromEntries(fields.map(field => [field, undefined])), {
            compatibilityVerificationEnabled: true,
            compatibilityVerified: false,
            compatibilityProvenance: Object.fromEntries(fields.map(field => [field, null])),
            compatibilityConditions: Object.fromEntries(fields.map(field => [field, null])),
          }, envelope?.product ?? {});
        }
        return { product: projected, notices: envelope?.notices ?? [], substitutes: envelope?.substitutes ?? [], complements: envelope?.complements ?? [], relations: envelope?.relations ?? [] };
      });
    },
    refresh,
    async refreshAll() {
      if (!enabled || disposed || !permitted) return false;
      reset();
      const epoch = batch;
      let next = 0;
      const results: boolean[] = [];
      await Promise.all(Array.from({ length: Math.min(3, base.length) }, async () => {
        while (epoch === batch && !disposed && permitted && next < base.length) {
          const index = next++;
          results[index] = await refresh(base[index].slug);
        }
      }));
      return epoch === batch && results.length === base.length && results.every(Boolean);
    },
    invalidate: reset,
    setPermitted(value: boolean) {
      permitted = value;
      if (!value) batch++;
      for (const client of clients.values()) client?.setPermitted(value);
      changed();
    },
    dispose() {
      if (disposed) return;
      disposed = true; batch++;
      for (const client of clients.values()) client?.dispose();
    },
  };
}
