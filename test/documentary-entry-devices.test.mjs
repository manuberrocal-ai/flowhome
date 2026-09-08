import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const meross = 'meross-smart-garage-door-opener';
const ring = 'ring-video-doorbell-wired';
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:55:00Z', visibleLocation: `product:${slug}:compatibility` });

test('entry-device signals keep suffix, motor, power and service limitations on four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of [meross, ring]) for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const fields = slug === meross ? ['wifi', 'alexa', 'google', 'apple'] : ['wifi', 'alexa'];
    for (const field of ['wifi', 'alexa', 'google', 'apple', 'matter', 'thread', 'zigbee', 'bluetooth', 'smartthings']) assert.equal(flags[field].verified, fields.includes(field));
    assert.equal(applyVerifiedCompatibility({}, slug, { ...env, graph }).compatibilityConditions.wifi, flags.wifi.reason);
    if (slug === meross) {
      for (const field of fields) assert.match(flags[field].reason, /hardware suffix and motor compatibility remain unverified/);
      assert.match(flags.apple.reason, /HomeKit-enabled version/);
      assert.match(flags.alexa.reason, /safe unattended operation/);
    } else {
      assert.match(flags.wifi.reason, /does not transfer 5 GHz/);
      assert.match(flags.alexa.reason, /subscription requirements/);
    }
  }
});

test('entry-device scope gates and disputes do not verify hardware or leak across surfaces', () => {
  for (const slug of [meross, ring]) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
    assert.equal(edge.scope.hardwareId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-kit:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).alexa.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).alexa.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, true);
  }
  for (const slug of ['meross-msg200', 'meross-msg150', 'ring-wired-doorbell-2k', 'ring-wired-doorbell-pro']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, false);
});
