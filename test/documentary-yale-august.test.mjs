import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const slugs = ['yale-assure-lock-2-wifi', 'august-wifi-smart-lock'];
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:10:00Z', visibleLocation: `product:${slug}:compatibility` });

test('Yale and August retain four qualified signals without inferring Home Key or protocols', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of slugs) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
      const flags = getVerifiedFlags(graph, slug, env);
      const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
      for (const [key, field] of [['wifi', 'wifi'], ['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible'], ['apple', 'appleHomeKit']]) {
        assert.equal(flags[key].verified, true);
        assert.equal(product.compatibilityConditions[field], flags[key].reason);
      }
      for (const key of ['thread', 'matter', 'zigbee', 'bluetooth', 'smartthings']) assert.equal(flags[key].verified, false);
      assert.match(flags.apple.reason, /Home Key/);
      assert.match(flags.wifi.reason, /network band/);
    }
    assert.equal(graph.nodes.find(node => node.slug === slug).marketplaceId, null);
  }
});

test('lock candidate reviews remain independent across model, surface, market and expiry', () => {
  for (const slug of slugs) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:apple-home');
    for (const change of [{ market: 'EU' }, { now: edge.expiry }, { enabled: false }, { visibleLocation: 'product:other-lock:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).apple.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).apple.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).apple.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).apple.verified, true);
  }
  for (const slug of ['yale-assure-lock-2-plus', 'yale-assure-lock-2-touch', 'august-smart-lock']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).apple.verified, false);
});
