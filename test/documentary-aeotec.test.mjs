import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';

const slug = 'aeotec-smartthings-hub';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:50:00Z', visibleLocation: `product:${slug}:compatibility` };

test('Aeotec V3 US has five scoped documentary flags without inherited assistant or Apple claims', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, { ...options, visibleLocation: `${surface}:${slug}:compatibility` });
    for (const key of ['wifi', 'zigbee', 'matter', 'thread', 'smartthings']) {
      assert.equal(flags[key].verified, true);
      assert.equal(flags[key].level, 'research-verified');
      assert.match(flags[key].reason, /GP-AEOHUBV3/);
    }
    for (const key of ['apple', 'alexa', 'google', 'bluetooth']) assert.equal(flags[key].verified, false);
    assert.match(flags.wifi.reason, /Do not infer 5 GHz support/);
    assert.match(flags.thread.reason, /border router/);
    assert.match(flags.smartthings.reason, /not guaranteed compatibility for another product/);
    assert.deepEqual(flags.substitutes, []);
  }
});

test('Aeotec regional identity, expiry and exact locations are enforced independently', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:thread');
  for (const change of [{ market: 'EU' }, { now: edge.expiry }, { enabled: false }, { visibleLocation: 'product:aeotec-smart-home-hub-2:compatibility' }]) {
    assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).thread.verified, false);
  }
  assert.equal(getVerifiedFlags(graph, 'aeotec-smart-home-hub-2', options).thread.verified, false);
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).thread.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).thread.verified, true);
});

test('Thread and SmartThings roles never propagate from Aeotec to other graph products', () => {
  const graph = documentaryCandidateProvider.getGraph();
  // Independently documented display Thread roles and ecobee, Hue and Arlo integrations survive removal of Aeotec edges.
  graph.edges = graph.edges.filter(edge => edge.from !== `p:${slug}`);
  for (const product of graph.nodes.filter(node => node.type === 'product' && node.slug !== slug)) {
    const flags = getVerifiedFlags(graph, product.slug, { ...options, visibleLocation: `product:${product.slug}:compatibility` });
    assert.equal(flags.thread.verified, ['echo-show-8-3rd-gen', 'google-nest-hub-2nd-gen'].includes(product.slug));
    assert.equal(flags.smartthings.verified, ['ecobee-smart-thermostat-premium', 'philips-hue-white-color-starter-kit', 'arlo-essential-outdoor-camera'].includes(product.slug));
  }
  assert.ok(documentaryCandidateProvider.getGraph().edges.filter(edge => edge.from === `p:${slug}`).every(edge => edge.status === 'active'));
});
