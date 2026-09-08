/** Server-only explicit transport for draft014. No default project or credentials. */
import type { CommerceReadGrant } from './gated-reader.ts';

type TransactionPolicy = 'commit' | 'commit-allow-override' | 'rollback-allow-override';
interface BudgetTransportOptions {
  enabled?: boolean;
  projectUrl: string;
  /** Operator-verified PostgREST configuration, never supplied by a browser. */
  transactionPolicy: TransactionPolicy;
  credentials: () => Promise<{ apiKey: string; accessToken: string } | null>;
  fetch?: typeof fetch;
}

/** An ambiguous/lost response may consume a DB attempt but never permits acquisition.
 * No automatic retries. The operator must verify db-tx-end before enabling this.
 */
export function createSupabaseAttemptReserver(options: BudgetTransportOptions) {
  if (options.enabled !== true) return async () => false;
  if (!['commit', 'commit-allow-override', 'rollback-allow-override'].includes(options.transactionPolicy)) throw Error('Unverified transaction policy');
  const project = new URL(options.projectUrl);
  const loopback = project.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(project.hostname);
  if ((!loopback && project.protocol !== 'https:') || project.username || project.password || project.search || project.hash || project.pathname !== '/') throw Error('Invalid budget project');
  const endpoint = new URL('/rest/v1/rpc/block10_reserve_commerce_attempt', project);
  const fetcher = options.fetch ?? fetch;
  return async (grant: CommerceReadGrant, signal: AbortSignal): Promise<boolean> => {
    const id = (value: unknown) => typeof value === 'string' && /^[a-z0-9:_-]{1,160}$/i.test(value);
    if (signal.aborted || !grant || !id(grant.accountRef) || !id(grant.revision)) return false;
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let abort = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const stopped = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); void reader?.cancel().catch(() => {}); reject(Error('Unavailable')); };
        signal.addEventListener('abort', abort, { once: true });
        timer = setTimeout(abort, 2000);
      });
      const receive = async () => {
        const credentials = await options.credentials();
        if (!credentials || controller.signal.aborted || [credentials.apiKey, credentials.accessToken].some(value => typeof value !== 'string' || !value || value.length > 8192 || /[\r\n]/.test(value))) return false;
        const response = await fetcher(endpoint, { method: 'POST', redirect: 'error', cache: 'no-store', credentials: 'omit', signal: controller.signal,
          headers: { apikey: credentials.apiKey, Authorization: `Bearer ${credentials.accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'tx=commit, handling=strict' },
          body: JSON.stringify({ p_account_ref: grant.accountRef, p_revision: grant.revision }) });
        if (controller.signal.aborted || response.status !== 200 || response.redirected || !/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body) {
          void response.body?.cancel().catch(() => {}); return false;
        }
        const transactions = (response.headers.get('preference-applied') ?? '').toLowerCase().split(',').map(value => value.trim()).filter(value => /^tx(?:\s*=|$)/.test(value));
        // Always-commit installations need not echo a disabled preference. Override
        // installations MUST confirm commit; rollback/conflicting/unknown values deny.
        if (transactions.some(value => value !== 'tx=commit') || transactions.length > 1
          || (options.transactionPolicy !== 'commit' && transactions.length !== 1)) {
          void response.body.cancel().catch(() => {}); return false;
        }
        reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        let bytes = 0; let body = '';
        while (true) {
          const chunk = await reader.read();
          if (controller.signal.aborted) return false;
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > 128) { void reader.cancel().catch(() => {}); return false; }
          body += decoder.decode(chunk.value, { stream: true });
        }
        body += decoder.decode();
        return body.trim() === 'true';
      };
      return await Promise.race([stopped, receive()]);
    } catch { return false; }
    finally { clearTimeout(timer); signal.removeEventListener('abort', abort); }
  };
}
