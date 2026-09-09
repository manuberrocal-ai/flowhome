import { parseCompatibilityEnvelope, type CompatibilityEnvelope } from './delivery-envelope.ts';
import { createTransientLease, type LeaseClock } from './transient-lease.ts';
import type { CompatibilityRequestContext } from './request-delivery.ts';

const MAX_BYTES = 65_536;
/** Not imported by public pages. Endpoint must be explicitly supplied by a trusted integration. */
export function createCompatibilityClient(options: {
  endpoint: string;
  pageUrl: string;
  fetch?: typeof fetch;
  clock?: LeaseClock;
  changed?: () => void;
}) {
  const page = new URL(options.pageUrl);
  const endpoint = new URL(options.endpoint, page);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(page.hostname);
  if (endpoint.origin !== page.origin || (page.protocol !== 'https:' && !(page.protocol === 'http:' && loopback))
    || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('Invalid compatibility endpoint');
  const fetcher = options.fetch ?? fetch;
  const lease = createTransientLease<CompatibilityEnvelope>({ clock: options.clock, changed: options.changed });

  return {
    read: lease.read,
    setPermitted: lease.setPermitted,
    invalidate: lease.invalidate,
    dispose: lease.dispose,
    async refresh(context: CompatibilityRequestContext): Promise<boolean> {
      const pending = lease.begin();
      if (!pending) return false;
      const expected = { ...context };
      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let abort: () => void = () => {};
      try {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(expected.slug) || expected.slug.length > 120
          || expected.market !== 'US' || !['product', 'quiz', 'comparison', 'alternatives'].includes(expected.surface)) throw Error('Invalid context');
        const url = new URL(endpoint);
        url.search = new URLSearchParams({ slug: expected.slug, surface: expected.surface, market: expected.market }).toString();
        const stopped = new Promise<never>((_, reject) => {
          abort = () => { void reader?.cancel().catch(() => {}); reject(Error('Unavailable')); };
          pending.signal.addEventListener('abort', abort, { once: true });
          timer = setTimeout(() => lease.fail(pending.token), 5000);
        });
        const receive = async () => {
          const response = await fetcher(url, { method: 'GET', cache: 'no-store', credentials: 'omit', mode: 'same-origin', redirect: 'error', signal: pending.signal, headers: { Accept: 'application/json' } });
          if (pending.signal.aborted) { void response.body?.cancel().catch(() => {}); throw Error('Unavailable'); }
          if (response.status !== 200 || response.redirected || !/^application\/json(?:\s*;|\s*$)/i.test(response.headers.get('content-type') ?? '')
            || !response.headers.get('cache-control')?.toLowerCase().split(',').some(part => part.trim() === 'no-store') || !response.body) {
            void response.body?.cancel().catch(() => {}); throw Error('Unavailable');
          }
          reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8', { fatal: true });
          let bytes = 0; let body = '';
          while (true) {
            const chunk = await reader.read();
            if (pending.signal.aborted) throw Error('Unavailable');
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > MAX_BYTES) throw Error('Unavailable');
            body += decoder.decode(chunk.value, { stream: true });
          }
          body += decoder.decode();
          return parseCompatibilityEnvelope(JSON.parse(body), expected);
        };
        const payload = await Promise.race([receive(), stopped]);
        if (!payload) throw Error('Unavailable');
        return lease.accept(pending.token, payload, payload.leaseMs);
      } catch {
        lease.fail(pending.token);
        return false;
      } finally {
        clearTimeout(timer);
        pending.signal.removeEventListener('abort', abort);
        void reader?.cancel().catch(() => {});
      }
    },
  };
}

export { bindTransientLifecycle as bindCompatibilityLifecycle } from '../../transient-lifecycle.ts';
