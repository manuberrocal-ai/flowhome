import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const slugs = ['roborock-q5-plus', 'irobot-roomba-j7-plus'];
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:30:00Z', visibleLocation: `product:${slug}:compatibility` });

test('original robot vacuums preserve qualified voice and network claims on four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of slugs) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
      const flags = getVerifiedFlags(graph, slug, env);
      for (const key of ['wifi', 'alexa', 'google']) assert.equal(flags[key].verified, true);
      for (const key of ['apple', 'matter', 'thread', 'zigbee', 'bluetooth', 'smartthings']) assert.equal(flags[key].verified, false);
      const projected = applyVerifiedCompatibility({}, slug, { ...env, graph });
      assert.equal(projected.compatibilityConditions.wifi, flags.wifi.reason);
      if (slug === slugs[0]) {
        assert.match(flags.wifi.reason, /2.4 GHz/);
        assert.match(flags.google.reason, /Siri Shortcuts.*does not establish Apple Home/);
      } else {
        assert.match(flags.wifi.reason, /does not establish a network band/);
        assert.match(flags.alexa.reason, /does not turn the vacuum into a Roomba Combo or add mopping/);
      }
    }
  }
});

test('robot candidate rejects future, expired, wrong-region, wrong-model and disputed evidence', () => {
  for (const slug of slugs) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
    for (const change of [{ now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { enabled: false }, { market: 'EU' }, { visibleLocation: 'product:another-robot:compatibility' }]) {
      assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).alexa.verified, false);
    }
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).alexa.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, true);
  }
  for (const slug of ['roborock-q5-pro', 'roborock-q5-duoroller-plus', 'irobot-roomba-combo-j7-plus']) {
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, false);
  }
});
