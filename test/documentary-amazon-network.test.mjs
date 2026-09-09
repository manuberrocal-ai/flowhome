import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const slugs = ['echo-dot-5th-gen', 'echo-show-8-3rd-gen', 'amazon-smart-thermostat'];
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T01:00:00Z', visibleLocation: `product:${slug}:compatibility` });

test('Amazon network claims preserve band, setup and security limits on all four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of slugs) for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    assert.equal(flags.wifi.verified, true);
    const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
    assert.equal(product.compatibilityConditions.wifi, flags.wifi.reason);
    if (slug === slugs[0]) {
      assert.match(flags.wifi.reason, /2.4 and 5 GHz/);
      assert.equal(flags.bluetooth.verified, true);
      assert.equal(product.compatibilityConditions.bluetooth, flags.bluetooth.reason);
      assert.match(flags.bluetooth.reason, /codecs/);
      assert.equal(flags.thread.verified, false);
    } else if (slug === slugs[1]) assert.match(flags.wifi.reason, /does not establish radio bands or Wi-Fi 6/);
    else {
      assert.match(flags.wifi.reason, /not 5 GHz/);
      assert.match(flags.wifi.reason, /WPA3/);
      assert.match(flags.wifi.reason, /does not verify HVAC wiring/);
      assert.equal(flags.bluetooth.verified, false);
    }
  }
});

test('new network review does not backdate evidence, certify units or propagate disputed claims', () => {
  for (const slug of slugs) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:wifi');
    assert.equal(edge.scope.hardwareId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:50:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-device:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).wifi.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).wifi.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).wifi.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).wifi.verified, true);
  }
  for (const slug of ['echo-dot-kids-5th-gen', 'echo-dot-max', 'echo-show-8-2025']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).wifi.verified, false);
});
