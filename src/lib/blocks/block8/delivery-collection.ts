import { createCommerceClient } from './delivery-client.ts';

/** One memory-only client per ASIN, even when several cards display that product.
 * No requests until refreshAll. Caller binds lifecycle and re-reads before rendering.
 * This bounds browser concurrency, not provider/account quotas across users.
 */
export function createCommerceCollection(asins: readonly string[], options: Omit<Parameters<typeof createCommerceClient>[0], 'changed'> & { enabled?: boolean; changed?: () => void }) {
  if (asins.length > 100 || asins.some(asin => !/^[A-Z0-9]{10}$/.test(asin))) throw Error('Invalid commerce collection identities');
  const identities = [...new Set(asins)];
  const enabled = options.enabled === true;
  let permitted = true;
  let disposed = false;
  let busy = false;
  let epoch = 0;
  let queued = false;
  const changed = () => {
    if (disposed || queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; if (!disposed) options.changed?.(); });
  };
  const clients = new Map(identities.map(asin => [asin, enabled ? createCommerceClient({ ...options, changed }) : null]));
  const invalidate = () => { epoch++; for (const client of clients.values()) client?.invalidate(); changed(); };
  const read = () => identities.map(asin => ({ asin, observation: disposed ? null : clients.get(asin)?.read() ?? null }));
  return {
    read,
    async refreshAll(): Promise<boolean> {
      if (!enabled || disposed || !permitted || busy || identities.length === 0) return false;
      busy = true;
      invalidate();
      const current = epoch;
      let next = 0;
      try {
        await Promise.all(Array.from({ length: Math.min(3, identities.length) }, async () => {
          while (current === epoch && !disposed && permitted && next < identities.length) {
            const asin = identities[next++];
            await clients.get(asin)!.refresh(asin);
          }
        }));
        // A successful early response might expire while later requests are pending.
        return current === epoch && !disposed && permitted && read().every(row => row.observation !== null);
      } finally { busy = false; }
    },
    invalidate,
    setPermitted(value: boolean) {
      permitted = value;
      if (!value) epoch++;
      for (const client of clients.values()) client?.setPermitted(value);
      changed();
    },
    dispose() {
      if (disposed) return;
      disposed = true; epoch++;
      for (const client of clients.values()) client?.dispose();
    },
  };
}
