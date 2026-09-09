import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseLighthouseRoutes, isCompleteLighthouseReport } from './lighthouse-mobile.mjs';

/** Coverage validation, not release authority or a replacement for scoring. */
export async function verifyFullLighthouseEvidence(directory) {
  const summary = JSON.parse(await readFile(join(directory, 'summary.json'), 'utf8'));
  const routes = parseLighthouseRoutes();
  assert.equal(summary.scope, 'full');
  assert.equal(summary.formFactor, 'mobile');
  assert.equal(summary.sampleCount, 3);
  assert.deepEqual(summary.failures, []);
  assert.deepEqual(summary.requestedRoutes, routes);
  assert.deepEqual(summary.routes.map(item => item.route), routes);
  const base = new URL(summary.baseUrl);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname));
  for (const route of summary.routes) {
    assert.equal(route.sampleCount, 3);
    assert.deepEqual(route.failures, []);
    assert.deepEqual(route.samples.map(sample => sample.sampleIndex), [1, 2, 3]);
    const name = route.route === '/' ? 'home' : route.route.split('/').filter(Boolean).join('-');
    for (const index of [1, 2, 3]) {
      // Fixed local names: never read paths supplied by an imported summary.
      const report = JSON.parse(await readFile(join(directory, `${name}-sample-${index}.json`), 'utf8'));
      assert.ok(isCompleteLighthouseReport(report, new URL(route.route, base).href));
    }
  }
  return { routes: routes.length, samples: routes.length * 3 };
}
