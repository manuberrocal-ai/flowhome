import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const slug = 'schlage-encode-smart-wifi-deadbolt';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:00:00Z', visibleLocation: `product:${slug}:compatibility` };

test('BE489 preserves network and voice prerequisites without inheriting Encode Plus capabilities', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options, visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
    for (const [key, field] of [['wifi', 'wifi'], ['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible']]) {
      assert.equal(flags[key].verified, true);
      assert.equal(product.compatibilityConditions[field], flags[key].reason);
      assert.match(flags[key].reason, /BE489/);
    }
    assert.match(flags.wifi.reason, /2.4 GHz/);
    assert.match(flags.alexa.reason, /does not certify voice unlocking/);
    assert.match(flags.google.reason, /Do not infer/);
    for (const key of ['apple', 'matter', 'thread', 'zigbee', 'smartthings', 'bluetooth']) assert.equal(flags[key].verified, false);
  }
  assert.equal(graph.nodes.find(node => node.slug === slug).marketplaceId, null);
});

test('BE489 evidence is isolated by model, market, expiry and surface review', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
  for (const change of [{ market: 'EU' }, { now: edge.expiry }, { enabled: false }, { visibleLocation: 'product:schlage-encode-plus:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).alexa.verified, false);
  for (const other of ['schlage-encode-plus', 'schlage-encode-lever', 'schlage-sense-pro']) assert.equal(getVerifiedFlags(graph, other, options).alexa.verified, false);
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options).alexa.verified, true);
});
