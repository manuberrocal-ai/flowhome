import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectPageMetadata } from './seo-audit.mjs';
import { scanSourceCtas, validateCtaContract } from '../maintenance/link-check.mjs';

const ROUTES = ['/', '/product/amazon-smart-thermostat/', '/cart/'];
const MAX_BYTES = 512_000;
const TIMEOUT_MS = 5_000;

function allowedOrigin(value) {
  const url = new URL(value);
  const local = url.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/'
    || (!local && url.origin !== 'https://flowhome.dev')) throw new Error('unsupported_monitor_origin');
  return url.origin;
}

export function inspectHealthHtml(html, route) {
  const metadata = inspectPageMetadata(html, route);
  const codes = [];
  if (!metadata.title?.includes('FlowHome') || metadata.counts.h1s !== 1) codes.push('page_identity_missing');
  if (metadata.canonical !== `https://flowhome.dev${route}`) codes.push('canonical_mismatch');
  if (route === '/cart/' ? !metadata.noindex : metadata.noindex) codes.push('indexing_policy_mismatch');
  let ctaCount = 0;
  if (route.startsWith('/product/')) {
    // This is an HTML sentinel, not a browser visibility/interaction assertion.
    const markup = html.replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
    const ctas = scanSourceCtas(markup, route).filter((cta) => {
      if (cta.amazonCta) return true;
      try {
        const url = new URL(cta.href);
        return ['amazon.com', 'www.amazon.com'].includes(url.hostname)
          && /^\/(?:dp\/|gp\/aws\/cart\/)/.test(url.pathname);
      } catch { return false; }
    });
    ctaCount = ctas.length;
    if (!ctas.length) codes.push('retailer_cta_missing');
    if (ctas.some((cta) => cta.hrefKind !== 'literal' || validateCtaContract(cta).length
      || !/^https:\/\/(?:www\.)?amazon\.com\/dp\/B08J4C8871\?tag=flowhome-20$/.test(cta.href))) codes.push('retailer_cta_invalid');
  }
  return { codes, ctaCount };
}

export async function checkSiteHealth({ origin, fetcher = fetch } = {}) {
  origin = allowedOrigin(origin);
  const checks = [];
  for (const route of ROUTES) {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const result = { path: route, httpStatus: null, codes: [], ctaCount: null };
    let response;
    try {
      response = await fetcher(`${origin}${route}`, {
        method: 'GET', redirect: 'manual', credentials: 'omit',
        signal: controller.signal, headers: { accept: 'text/html' },
      });
      result.httpStatus = response.status;
      if (response.status !== 200) result.codes.push('http_status_unexpected');
      else if (!/^text\/html(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) result.codes.push('content_type_unexpected');
      else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('empty_body');
        const chunks = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_BYTES) { result.codes.push('response_too_large'); await reader.cancel(); break; }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
        if (!result.codes.length) Object.assign(result, inspectHealthHtml(Buffer.concat(chunks).toString('utf8'), route));
      }
    } catch { result.codes.push(controller.signal.aborted ? 'request_timeout' : 'request_failed'); }
    finally {
      clearTimeout(timer);
      if (response?.body && !response.body.locked) await response.body.cancel().catch(() => {});
    }
    checks.push({ ...result, status: result.codes.length ? 'needs_attention' : 'passed', durationMs: Math.round(performance.now() - start) });
  }
  return {
    schemaVersion: 1, origin, observedAt: new Date().toISOString(),
    status: checks.every((check) => check.status === 'passed') ? 'passed' : 'needs_attention',
    scope: 'HTTP HTML sentinels only; no browser interaction, retailer requests, alert delivery or uptime SLO', checks,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('origin_required');
    const result = await checkSiteHealth({ origin: process.argv[2] });
    console.log(JSON.stringify(result, null, 2));
    if (result.status !== 'passed') process.exitCode = 1;
  } catch {
    console.error('Site health requires exactly one explicit FlowHome HTTPS or numeric loopback HTTP origin.');
    process.exitCode = 1;
  }
}
