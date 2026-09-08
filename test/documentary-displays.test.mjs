import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const models = {
  'echo-dot-5th-gen': ['matter', 'alexa'],
  'echo-show-8-3rd-gen': ['matter', 'thread', 'zigbee', 'bluetooth', 'alexa'],
  'google-nest-hub-2nd-gen': ['wifi', 'matter', 'thread', 'google'],
};
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:50:00Z', visibleLocation: `product:${slug}:compatibility` });

test('display controller and border-router roles remain separate on all four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const [slug, fields] of Object.entries(models)) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
      const flags = getVerifiedFlags(graph, slug, env);
      for (const field of ['wifi', 'bluetooth', 'zigbee', 'matter', 'thread', 'alexa', 'google', 'apple', 'smartthings']) assert.equal(flags[field].verified, fields.includes(field), `${slug}:${surface}:${field}`);
      assert.match(flags.matter.reason, /controller/);
      const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
      assert.equal(product.compatibilityConditions.matter, flags.matter.reason);
      if (fields.includes('thread')) {
        assert.match(flags.thread.reason, /border router/);
        assert.equal(product.compatibilityConditions.thread, flags.thread.reason);
      }
    }
  }
  assert.match(getVerifiedFlags(graph, 'echo-dot-5th-gen', options('echo-dot-5th-gen')).matter.reason, /separate compatible border router/);
  assert.match(getVerifiedFlags(graph, 'google-nest-hub-2nd-gen', options('google-nest-hub-2nd-gen')).matter.reason, /IPv6/);
});

test('display claims reject wrong scope and dates, isolate disputes and do not certify seller identities', () => {
  for (const slug of Object.keys(models)) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:matter');
    assert.equal(edge.scope.hardwareId, null);
    assert.equal(graph.nodes.find(row => row.id === `p:${slug}`).marketplaceId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-generation:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).matter.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).matter.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).matter.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).matter.verified, true);
  }
  for (const slug of ['echo-dot-max', 'echo-show-8-2025', 'google-nest-hub-1st-gen', 'google-nest-hub-max']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).thread.verified, false);
});
