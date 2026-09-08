import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const slug = 'arlo-essential-outdoor-camera';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:40:00Z', visibleLocation: `product:${slug}:compatibility` };

test('Arlo HD second-generation conditions survive all surfaces without generic hub inference', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options, visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    for (const field of ['wifi', 'alexa', 'google', 'apple', 'smartthings']) assert.equal(flags[field].verified, true);
    for (const field of ['matter', 'zigbee', 'thread', 'bluetooth']) assert.equal(flags[field].verified, false);
    assert.match(flags.wifi.reason, /VMC2050/);
    assert.match(flags.apple.reason, /VMB5000.*VMB4540.*VMB4500.*VMB4000/);
    assert.match(flags.apple.reason, /not directly to the router/);
    assert.match(flags.apple.reason, /Remote.*Apple Home Hub/);
    assert.match(flags.smartthings.reason, /not a SmartThings hub/);
    const projected = applyVerifiedCompatibility({}, slug, { ...env, graph });
    assert.equal(projected.compatibilityConditions.appleHomeKit, flags.apple.reason);
  }
});

test('Arlo rejects expired, future, wrong-market, other-generation and disputed evidence', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:apple-home');
  for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:arlo-essential-3:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).apple.verified, false);
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).apple.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).apple.verified, true);
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options).apple.verified, true);
  assert.equal(getVerifiedFlags(graph, 'arlo-essential-3', options).apple.verified, false);
});
