/** Isolated loopback fixture. Never mount in production or treat synthetic authorization as approval. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { serveCompatibilityRequest } from '../../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../../src/lib/blocks/block9/documentary-provider.ts';

const modules = new Map();
for (const name of ['delivery-client', 'delivery-envelope', 'transient-lease', 'delivery-presentation', 'product-presentation', 'delivery-collection', 'comparison-presentation', 'relations-presentation']) {
  const source = await readFile(new URL(`../../src/lib/blocks/block9/${name}.ts`, import.meta.url), 'utf8');
  modules.set(`/${name}.js`, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll('.ts\'', '.js\'').replaceAll("'../block8/delivery-collection.js'", "'/commerce-delivery-collection.js'"));
}
modules.set('/product-feature-evidence.js', ts.transpileModule(await readFile(new URL('../../src/lib/product-feature-evidence.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText);
for (const name of ['comparison-insights', 'commerce-data', 'commercial-policy', 'transient-lifecycle']) {
  modules.set(`/${name}.js`, ts.transpileModule(await readFile(new URL(`../../src/lib/${name}.ts`, import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replaceAll('.ts\'', '.js\''));
}
for (const name of ['delivery-client', 'delivery-envelope', 'delivery-presentation', 'product-presentation', 'delivery-collection', 'catalog-presentation', 'domain']) {
  const source = await readFile(new URL(`../../src/lib/blocks/block8/${name}.ts`, import.meta.url), 'utf8');
  modules.set(`/commerce-${name}.js`, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
    .replaceAll('.ts\'', '.js\'').replaceAll("'./delivery-", "'./commerce-delivery-")
    .replaceAll("'./domain.js'", "'./commerce-domain.js'")
    .replaceAll("'../block9/transient-lease.js'", "'/transient-lease.js'"));
}
const commerceHtml = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>FlowHome commerce local test</title>
<h1>Synthetic commerce test — not a product offer</h1>
<label>Response mode <select id="mode"><option>live</option><option>short</option><option>denied</option></select></label>
<button id="refresh" type="button">Refresh price</button><p id="status" role="status"></p>
<p id="price"></p><p id="source"></p><p id="stock"></p><p id="duplicate"></p><p id="duplicate-source"></p><p id="duplicate-stock"></p>
<a href="/away/">Leave test page</a>
<script type="module">
import { mountCommercePresentation } from '/commerce-delivery-presentation.js';
function connect() {
  window.cleanup?.();
  const get = id => document.getElementById(id);
  const mounted = mountCommercePresentation({ slots: [
    { price: get('price'), source: get('source'), availability: get('stock') },
    { price: get('duplicate'), source: get('duplicate-source'), availability: get('duplicate-stock') }
  ], status: get('status'), refresh: get('refresh') }, 'B0FIXTUR01', {
    enabled: true, endpoint: '/commerce/' + get('mode').value, pageUrl: location.href
  });
  window.cleanup = mounted.dispose;
}
document.getElementById('mode').addEventListener('change', connect);
connect();
</script></html>`;
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>FlowHome compatibility local test</title>
<h1>Isolated compatibility test — not approved for publication</h1>
<label>Response mode <select id="mode"><option>live</option><option>short</option><option>denied</option><option>revoke</option><option>notice</option></select></label>
<button id="refresh">Refresh evidence</button><p id="status" role="status">Unknown</p><p id="claim"></p><p id="source"></p><p id="duplicate"></p><p id="duplicate-source"></p><ul id="notices" hidden></ul>
<script type="module">
import { mountCompatibilityPresentation } from '/delivery-presentation.js';
function connect() {
  window.cleanup?.();
  const mounted = mountCompatibilityPresentation({
    fields: [{ field: 'alexaCompatible', value: document.querySelector('#claim'), source: document.querySelector('#source') }, { field: 'alexaCompatible', value: document.querySelector('#duplicate'), source: document.querySelector('#duplicate-source') }],
    status: document.querySelector('#status'), notices: document.querySelector('#notices'), refresh: document.querySelector('#refresh')
  }, { slug: 'tapo-c120-security-camera', surface: 'product', market: 'US' }, {
    enabled: true, endpoint: '/compatibility/' + document.querySelector('#mode').value, pageUrl: location.href
  });
  window.cleanup = mounted.dispose;
}
document.querySelector('#mode').addEventListener('change', connect);
connect();
</script></html>`;
const graph = documentaryCandidateProvider.getGraph();
const dist = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../../dist/', import.meta.url));
let revocationReads = 0;
const server = createServer(async (incoming, outgoing) => {
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const url = new URL(incoming.url, origin);
    outgoing.setHeader('Cache-Control', 'no-store');
    if (url.pathname === '/commerce-test/') { outgoing.setHeader('Content-Type', 'text/html; charset=utf-8'); outgoing.end(commerceHtml); return; }
    if (url.pathname === '/away/') { outgoing.setHeader('Content-Type', 'text/html'); outgoing.end('<!doctype html><title>Away</title><p>Navigation test destination</p>'); return; }
    if (['/commerce/live', '/commerce/short', '/commerce/denied', '/commerce/partial', '/commerce/comparison'].includes(url.pathname)) {
      outgoing.setHeader('Content-Type', 'application/json');
      if (url.pathname.endsWith('denied') || (url.pathname.endsWith('partial') && url.searchParams.get('asin') === 'B09B8V1LZ3')) { outgoing.writeHead(503); outgoing.end('{}'); return; }
      const now = Date.now();
      const until = new Date(now + (url.pathname.endsWith('short') ? 2000 : 60_000)).toISOString();
      outgoing.end(JSON.stringify({ status: 'available', asin: url.searchParams.get('asin'), market: 'US', currency: 'USD', serverTime: new Date(now).toISOString(), validUntil: until,
        price: { value: url.pathname === '/commerce/comparison' && url.searchParams.get('asin') !== 'B09B8V1LZ3' ? 234.56 : 123.45, capturedAt: new Date(now - 1000).toISOString(), expiresAt: until },
        availability: { value: 'https://schema.org/InStock', expiresAt: new Date(now + 1000).toISOString() } })); return;
    }
    if (url.pathname === '/') { revocationReads = 0; outgoing.setHeader('Content-Type', 'text/html; charset=utf-8'); outgoing.end(html); return; }
    if (url.pathname === '/favicon.ico') { outgoing.writeHead(204); outgoing.end(); return; }
    if (url.pathname === '/real-product/') {
      outgoing.setHeader('Content-Type', 'text/html; charset=utf-8');
      outgoing.end(await readFile(resolve(dist, 'product/echo-dot-5th-gen/index.html'))); return;
    }
    if (url.pathname === '/real-catalog/') {
      outgoing.setHeader('Content-Type', 'text/html; charset=utf-8');
      outgoing.end(await readFile(resolve(dist, 'products/index.html'))); return;
    }
    if (url.pathname === '/real-comparison/') {
      outgoing.setHeader('Content-Type', 'text/html; charset=utf-8');
      outgoing.end(await readFile(resolve(dist, 'compare/echo-dot-5th-gen-vs-echo-show-8-3rd-gen/index.html'))); return;
    }
    if (url.pathname === '/real-quiz/') {
      outgoing.setHeader('Content-Type', 'text/html; charset=utf-8');
      outgoing.end(await readFile(resolve(dist, 'quiz/index.html'))); return;
    }
    if (url.pathname.startsWith('/_astro/') || url.pathname.startsWith('/images/') || url.pathname === '/favicon.svg') {
      const path = resolve(dist, '.' + decodeURIComponent(url.pathname));
      if (!path.startsWith(dist.endsWith(sep) ? dist : dist + sep)) { outgoing.writeHead(404); outgoing.end(); return; }
      const mime = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }[extname(path)];
      if (!mime) { outgoing.writeHead(404); outgoing.end(); return; }
      outgoing.setHeader('Content-Type', mime); outgoing.end(await readFile(path)); return;
    }
    if (modules.has(url.pathname)) { outgoing.setHeader('Content-Type', 'text/javascript; charset=utf-8'); outgoing.end(modules.get(url.pathname)); return; }
    if (['/compatibility/live', '/compatibility/short', '/compatibility/denied', '/compatibility/revoke', '/compatibility/notice', '/compatibility/relations', '/compatibility/relations-short'].includes(url.pathname)) {
      const fixedNow = Date.parse('2026-09-07T01:40:00Z');
      const response = await serveCompatibilityRequest(new Request(url, { method: incoming.method }), {
        enabled: url.pathname !== '/compatibility/denied' && (url.pathname !== '/compatibility/revoke' || ++revocationReads === 1), clock: () => new Date(fixedNow),
        readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: new Date(fixedNow + (url.pathname.endsWith('short') ? 1500 : 60_000)).toISOString() }),
      });
      const payload = await response.json();
      if (url.pathname.startsWith('/compatibility/relations') && response.status === 200 && url.searchParams.get('surface') === 'alternatives') {
        // Synthetic DOM probes only: these are NOT documentary product claims.
        payload.relations = [
          { relation: 'substitutes', targetSlug: 'echo-show-8-3rd-gen', targetType: 'product', condition: 'TEST ONLY — synthetic substitute condition <img src=x onerror=alert(1)>', sourceLabel: 'Synthetic rendering fixture', evidence: 'data-evaluated', evidenceLabel: 'Data evaluated', confidence: 'low' },
          { relation: 'complements', targetSlug: 'synthetic-hardware', targetType: 'hardware', condition: 'TEST ONLY — synthetic hardware condition', sourceLabel: 'Synthetic rendering fixture', evidence: 'data-evaluated', evidenceLabel: 'Data evaluated', confidence: 'low' },
          { relation: 'complements', targetSlug: 'synthetic-missing-product', targetType: 'product', condition: 'TEST ONLY — unavailable catalog target', sourceLabel: 'Synthetic rendering fixture', evidence: 'data-evaluated', evidenceLabel: 'Data evaluated', confidence: 'low' },
        ];
        payload.substitutes = ['echo-show-8-3rd-gen']; payload.complements = ['synthetic-hardware', 'synthetic-missing-product'];
      }
      if (url.pathname === '/compatibility/notice' && response.status === 200) {
        // Explicit synthetic rendering probe, not a documentary claim or server authorization.
        payload.notices = [{ relation: 'requires-hub', message: 'TEST ONLY <img src=x onerror=alert(1)>', evidence: 'data-evaluated', evidenceLabel: 'Data evaluated', confidence: 'low', sourceLabel: 'Synthetic rendering fixture' }];
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(JSON.stringify(payload)); return;
    }
    outgoing.writeHead(404); outgoing.end();
  } catch { outgoing.writeHead(500); outgoing.end('Unavailable'); }
});
server.listen(0, '127.0.0.1', () => console.log(`FLOWHOME_BROWSER_HARNESS=http://127.0.0.1:${server.address().port}/`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.closeAllConnections(); server.close(() => process.exit(0)); });
