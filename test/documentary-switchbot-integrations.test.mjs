import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const slugs = ['switchbot-hub-2', 'switchbot-blind-tilt'];
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T01:10:00Z', visibleLocation: `product:${slug}:compatibility` });

test('SwitchBot assistant and Bluetooth claims keep distinct paths on four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of slugs) for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
    for (const [field, mapped] of [['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible'], ['bluetooth', 'bluetooth']]) {
      assert.equal(flags[field].verified, true);
      assert.equal(product.compatibilityConditions[mapped], flags[field].reason);
    }
    assert.equal(flags.thread.verified, false);
    if (slug === slugs[0]) {
      assert.match(flags.alexa.reason, /not Alexa Built-in/);
      assert.match(flags.bluetooth.reason, /not a universal Bluetooth accessory controller/);
    } else {
      assert.equal(flags.wifi.verified, false);
      assert.match(flags.alexa.reason, /app version 9/);
      assert.match(flags.google.reason, /older Cloud Services UI/);
      assert.match(flags.bluetooth.reason, /do not infer generic Bluetooth Mesh interoperability/);
    }
  }
});

test('new SwitchBot integrations enforce dates and scope without changing historical evidence', () => {
  for (const slug of slugs) for (const field of ['alexa', 'google', 'bluetooth']) {
    const target = field === 'google' ? 'google-home' : field;
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === `e:${target}`);
    assert.equal(edge.scope.hardwareId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T01:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-switchbot:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change })[field].verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug))[field].verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` })[field].verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug))[field].verified, true);
  }
  for (const slug of ['switchbot-hub-mini', 'switchbot-hub-3', 'switchbot-curtain-3']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).bluetooth.verified, false);
});
