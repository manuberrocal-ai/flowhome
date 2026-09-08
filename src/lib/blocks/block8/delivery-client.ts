import { createTransientLease, type LeaseClock } from '../block9/transient-lease.ts';
import { parseCommerceEnvelope, type CommerceEnvelope } from './delivery-envelope.ts';
export { bindTransientLifecycle as bindCommerceLifecycle } from '../../transient-lifecycle.ts';

/** Memory-only, unregistered client. Caller must invalidate on hide/offline/navigation. */
export function createCommerceClient(options: { endpoint: string; pageUrl: string; fetch?: typeof fetch; clock?: LeaseClock; changed?: () => void }) {
  const page = new URL(options.pageUrl); const endpoint = new URL(options.endpoint, page);
  const local = page.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(page.hostname);
  if (endpoint.origin !== page.origin || (page.protocol !== 'https:' && !local) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw Error('Invalid commerce endpoint');
  const fetcher = options.fetch ?? fetch;
  const price = createTransientLease<{ asin: string; price: CommerceEnvelope['price'] }>({ clock: options.clock, changed: options.changed });
  const availability = createTransientLease<NonNullable<CommerceEnvelope['availability']>>({ clock: options.clock, changed: options.changed });
  return {
    read() { const current = price.read(); return current ? { ...current, availability: availability.read() } : null; },
    setPermitted(value: boolean) { price.setPermitted(value); availability.setPermitted(value); },
    invalidate() { price.invalidate(); availability.invalidate(); },
    dispose() { price.dispose(); availability.dispose(); },
    async refresh(asin: string): Promise<boolean> {
      const pending = price.begin(); const stock = availability.begin();
      if (!pending || !stock) return false;
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let abort = () => {};
      try {
        if (!/^[A-Z0-9]{10}$/.test(asin)) throw Error('Invalid identity');
        const url = new URL(endpoint); url.search = new URLSearchParams({ asin, market: 'US' }).toString();
        const stopped = new Promise<never>((_, reject) => {
          abort = () => { void reader?.cancel().catch(() => {}); reject(Error('Unavailable')); };
          pending.signal.addEventListener('abort', abort, { once: true });
          timer = setTimeout(() => price.fail(pending.token), 5000);
        });
        const receive = async () => {
          const response = await fetcher(url, { method: 'GET', cache: 'no-store', credentials: 'omit', mode: 'same-origin', redirect: 'error', signal: pending.signal, headers: { Accept: 'application/json' } });
          if (pending.signal.aborted || response.status !== 200 || response.redirected || !/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get('content-type') ?? '')
            || !response.headers.get('cache-control')?.toLowerCase().split(',').some(part => part.trim() === 'no-store') || !response.body) {
            void response.body?.cancel().catch(() => {}); throw Error('Unavailable');
          }
          reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true });
          let bytes = 0; let body = '';
          while (true) {
            const chunk = await reader.read(); if (pending.signal.aborted) throw Error('Unavailable');
            if (chunk.done) break;
            bytes += chunk.value.byteLength; if (bytes > 16_384) throw Error('Unavailable');
            body += decoder.decode(chunk.value, { stream: true });
          }
          body += decoder.decode(); return parseCommerceEnvelope(JSON.parse(body), asin);
        };
        const payload = await Promise.race([receive(), stopped]);
        if (!payload) throw Error('Unavailable');
        if (!price.accept(pending.token, { asin: payload.asin, price: payload.price }, payload.priceLeaseMs)) { availability.fail(stock.token); return false; }
        if (payload.availability && payload.availabilityLeaseMs) availability.accept(stock.token, payload.availability, payload.availabilityLeaseMs);
        else availability.fail(stock.token);
        return true;
      } catch { price.fail(pending.token); availability.fail(stock.token); return false; }
      finally { clearTimeout(timer); pending.signal.removeEventListener('abort', abort); void reader?.cancel().catch(() => {}); }
    },
  };
}
