import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifyFullLighthouseEvidence } from '../scripts/qa/lighthouse-evidence.mjs';
import { parseLighthouseRoutes } from '../scripts/qa/lighthouse-mobile.mjs';

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'flowhome-lh-evidence-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const routes = parseLighthouseRoutes();
  const summary = { baseUrl: 'http://127.0.0.1:4321', scope: 'full', formFactor: 'mobile', sampleCount: 3, failures: [], requestedRoutes: routes,
    routes: routes.map(route => ({ route, sampleCount: 3, failures: [], samples: [1, 2, 3].map(sampleIndex => ({ sampleIndex })) })) };
  for (const route of routes) for (const index of [1, 2, 3]) {
    const name = route === '/' ? 'home' : route.split('/').filter(Boolean).join('-');
    const report = { finalUrl: new URL(route, summary.baseUrl).href,
      categories: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map(key => [key, { score: 1 }])),
      audits: Object.fromEntries(['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'].map(key => [key, { numericValue: 0 }])) };
    await writeFile(join(directory, `${name}-sample-${index}.json`), JSON.stringify(report));
  }
  const save = () => writeFile(join(directory, 'summary.json'), JSON.stringify(summary));
  await save();
  return { directory, summary, save };
}

test('complete fixed matrix is accepted and each missing sample is rejected', async t => {
  const { directory } = await fixture(t);
  assert.deepEqual(await verifyFullLighthouseEvidence(directory), { routes: 4, samples: 12 });
  await rm(join(directory, 'home-sample-3.json'));
  await assert.rejects(verifyFullLighthouseEvidence(directory));
});

test('partial, duplicated or failed coverage cannot masquerade as a full pass', async t => {
  for (const mutate of [s => { s.scope = 'targeted'; }, s => { s.sampleCount = 1; }, s => { s.routes.pop(); },
    s => { s.routes[1] = s.routes[0]; }, s => { s.routes[0].samples[2].sampleIndex = 2; },
    s => { s.failures.push('failed'); }, s => { s.routes[0].failures.push('failed'); }]) {
    const { directory, summary, save } = await fixture(t);
    mutate(summary); await save();
    await assert.rejects(verifyFullLighthouseEvidence(directory));
  }
});

test('present but incomplete report cannot satisfy evidence coverage', async t => {
  const { directory } = await fixture(t);
  await writeFile(join(directory, 'home-sample-1.json'), JSON.stringify({ finalUrl: 'http://127.0.0.1:4321/' }));
  await assert.rejects(verifyFullLighthouseEvidence(directory));
});
