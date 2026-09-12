import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import config from '../../astro.config.mjs';
import { documentaryCandidateProvider } from '../../src/lib/blocks/block9/documentary-provider.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const mode = process.argv[2] || 'candidate';
assert.ok(['candidate', 'expired', 'disputed', 'static-guard'].includes(mode), 'Unknown review scenario');

if (process.argv[3] !== '--isolated-child') {
  // The build does not inherit application keys, PUBLIC_* settings or account sessions.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|SYSTEMROOT|WINDIR|TEMP|TMP|COMSPEC|PATHEXT)$/i.test(key)));
  const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), mode, '--isolated-child'], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} else {
  const work = mkdtempSync(join(tmpdir(), 'flowhome-compatibility-review-'));
  const outDir = join(work, 'output');
  const runtimePath = resolve(root, 'src/lib/blocks/block9/runtime.ts').replaceAll('\\', '/');
  const originalRuntime = readFileSync(runtimePath, 'utf8');
  const now = mode === 'expired' ? '2026-11-01T00:00:00Z' : '2026-09-07T01:20:00Z';
  let injected = 0;
  let blocked = false;
  try { await build({
    ...config, root, configFile: false, outDir, cacheDir: join(work, 'cache'),
    vite: { ...config.vite, envDir: work,
      define: { ...config.vite?.define, 'import.meta.env.PUBLIC_COMPATIBILITY_V1': JSON.stringify('true') },
      plugins: [...(config.vite?.plugins ?? []), {
        name: 'flowhome-isolated-documentary-render-review', enforce: 'pre',
        transform(code, id, options) {
          if (id.split('?')[0].replaceAll('\\', '/') !== runtimePath || !options?.ssr) return;
          assert.equal(code, originalRuntime, 'Runtime changed before isolated injection');
          assert.equal(code.split("market: 'US',").length, 2, 'Runtime clock anchor changed');
          const deliveryAnchor = "const staticDelivery = typeof __FLOWHOME_STATIC_COMPATIBILITY__ !== 'undefined' && __FLOWHOME_STATIC_COMPATIBILITY__;";
          assert.equal(code.split(deliveryAnchor).length, 2, 'Static delivery guard anchor changed');
          // Only the isolated review transform can bypass the normal static guard.
          // static-guard deliberately retains it to prove the real build aborts.
          if (mode !== 'static-guard') code = code.replace(deliveryAnchor, 'const staticDelivery = false;');
          injected++;
          return {
            code: code.replace("market: 'US',", `market: 'US', now: ${JSON.stringify(now)},`) + `
              import { documentaryCandidateProvider as reviewSource } from './documentary-provider.ts';
              setApprovedCompatibilityGraphProvider({ getGraph() {
                const graph = reviewSource.getGraph();
                ${mode === 'disputed' ? `graph.ledger.find(row => row.visibleLocation === 'product:tapo-c120-security-camera:compatibility' && row.edgeId.includes(':alexa:')).status = 'disputed';` : ''}
                return graph;
              } });`, map: null,
          };
        },
      }],
    },
  }); } catch (error) {
    if (mode !== 'static-guard' || !String(error?.message).includes('STATIC_COMPATIBILITY_DELIVERY_BLOCKED')) throw error;
    blocked = true;
  }
  assert.ok(injected > 0, 'The real server runtime was not exercised');
  assert.equal(readFileSync(runtimePath, 'utf8'), originalRuntime, 'Public runtime source changed');
  if (mode === 'static-guard') {
    assert.equal(blocked, true, 'Static build unexpectedly accepted an active graph');
    console.log('FLOWHOME_RENDER_REVIEW=' + JSON.stringify({ mode, outDir, expectedBuildBlocked: true, runtimeSourceUnchanged: true, publicationAuthorized: false }));
  } else {
  const graph = documentaryCandidateProvider.getGraph();
  const escaped = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const html = slug => readFileSync(join(outDir, 'product', slug, 'index.html'), 'utf8');
  const quizHtml = readFileSync(join(outDir, 'quiz/index.html'), 'utf8');
  const quizMatch = quizHtml.match(/<script\b[^>]*id="quiz-catalog"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(quizMatch, 'Real quiz catalog script was not rendered');
  const quiz = JSON.parse(quizMatch[1]);
  const fields = { 'google-home': 'googleHomeCompatible', 'apple-home': 'appleHomeKit', alexa: 'alexaCompatible', smartthings: 'smartthingsIntegration', matter: 'matter', thread: 'thread', zigbee: 'zigbee', wifi: 'wifi', bluetooth: 'bluetooth' };
  let checkedClaims = 0;
  for (const edge of graph.edges) {
    const slug = edge.from.slice(2);
    const field = fields[edge.to.slice(2)];
    const productHtml = html(slug);
    const row = quiz.find(product => product.slug === slug);
    assert.ok(row, `Missing quiz product: ${slug}`);
    const disputed = mode === 'disputed' && slug === 'tapo-c120-security-camera' && field === 'alexaCompatible';
    if (mode === 'expired' || disputed) assert.ok(!productHtml.includes(escaped(edge.claim)), `Unavailable claim rendered: ${edge.id}`);
    else assert.ok(productHtml.includes(escaped(edge.claim)), `Condition absent from product HTML: ${edge.id}`);
    assert.equal(row.compatibilityConditions[field], mode === 'expired' ? null : edge.claim, `Quiz condition: ${edge.id}`);
    checkedClaims++;
  }
  const comparisonRoot = join(outDir, 'compare');
  // These six fields are actually displayed by CompareTable; Wi-Fi/BLE/Zigbee
  // are not table rows. Their presence in a graph is not a rendered claim.
  const comparisonTargets = new Set(['matter', 'alexa', 'google-home', 'apple-home', 'thread', 'smartthings']);
  let comparisons = 0;
  for (const entry of readdirSync(comparisonRoot, { withFileTypes: true }).filter(entry => entry.isDirectory())) {
    const comparisonHtml = readFileSync(join(comparisonRoot, entry.name, 'index.html'), 'utf8');
    for (const edge of graph.edges.filter(edge => entry.name.split('-vs-').includes(edge.from.slice(2)) && comparisonTargets.has(edge.to.slice(2)))) {
      if (mode === 'expired') assert.ok(!comparisonHtml.includes(escaped(edge.claim)), `Expired comparison claim: ${edge.id}`);
      else assert.ok(comparisonHtml.includes(escaped(edge.claim)), `Comparison condition missing: ${edge.id}`);
      comparisons++;
    }
  }
  assert.ok(comparisons > 0, 'No real comparison claims exercised');
  let alternativeSections = 0;
  const knownSlugs = new Set(graph.nodes.filter(node => node.type === 'product').map(node => node.slug));
  for (const slug of knownSlugs) {
    const section = html(slug).match(/<section\b[^>]*\bdata-related-products\b[^>]*>([\s\S]*?)<\/section>/)?.[1];
    if (!section) continue;
    const links = [...section.matchAll(/href="\/product\/([^/]+)\/"/g)].map(match => match[1]);
    assert.ok(links.length > 0, `Empty alternative section: ${slug}`);
    for (const target of links) assert.ok(target !== slug && knownSlugs.has(target), `Invalid alternative link: ${slug}`);
    assert.ok(!section.includes('Evidence-backed signal'), 'Alternative cards unexpectedly assert compatibility');
    alternativeSections++;
  }
  assert.ok(alternativeSections > 0, 'No alternative sections exercised');
  const clientFiles = readdirSync(join(outDir, '_astro')).filter(name => name.endsWith('.js'));
  assert.ok(clientFiles.length > 0);
  for (const file of clientFiles) {
    const code = readFileSync(join(outDir, '_astro', file), 'utf8');
    for (const marker of ['documentaryCandidateProvider', 'codex-documentary-review', 'doc:aqara-hub-m2', 'no physical test or seller-variant verification']) assert.ok(!code.includes(marker), `Review graph leaked to client bundle: ${file}`);
  }
  console.log('FLOWHOME_RENDER_REVIEW=' + JSON.stringify({ mode, outDir, checkedClaims, comparisonClaims: comparisons, alternativeSections, quizProducts: quiz.length, clientBundlesChecked: clientFiles.length, runtimeSourceUnchanged: true, publicProviderInstalled: false, publicationAuthorized: false }));
  }
}
