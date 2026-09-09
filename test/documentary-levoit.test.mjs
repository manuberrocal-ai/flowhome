import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const slug = 'levoit-core-300s-air-purifier';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:00:00Z', visibleLocation: `product:${slug}:compatibility` };

test('Core 300S preserves VeSync account requirements without inheriting protocols or revision claims', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options, visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
    for (const [key, field] of [['wifi', 'wifi'], ['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible']]) {
      assert.equal(flags[key].verified, true);
      assert.equal(product.compatibilityConditions[field], flags[key].reason);
    }
    assert.match(flags.alexa.reason, /own VeSync account/);
    assert.match(flags.google.reason, /own VeSync account/);
    assert.match(flags.wifi.reason, /does not verify network band/);
    for (const key of ['matter', 'thread', 'zigbee', 'apple', 'smartthings', 'bluetooth']) assert.equal(flags[key].verified, false);
  }
  assert.equal(graph.nodes.find(node => node.slug === slug).marketplaceId, null);
});

test('Core 300S evidence rejects wrong region, model, location, expiry and disputed ledger', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
  for (const change of [{ market: 'EU' }, { now: edge.expiry }, { enabled: false }, { visibleLocation: 'product:levoit-core-300:compatibility' }]) {
    assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).alexa.verified, false);
  }
  for (const other of ['levoit-core-300', 'levoit-core-300s-p', 'levoit-classic-300s']) assert.equal(getVerifiedFlags(graph, other, options).alexa.verified, false);
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options).alexa.verified, true);
});
