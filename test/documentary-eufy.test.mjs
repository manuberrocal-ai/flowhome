import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const slug = 'eufy-security-indoor-cam-c120';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:40:00Z', visibleLocation: `product:${slug}:compatibility` };

test('eufy family claims preserve the unresolved suffix and HomeKit limitations on all surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options, visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    for (const field of ['wifi', 'alexa', 'google', 'apple']) {
      assert.equal(flags[field].verified, true);
      assert.match(flags[field].reason, /T8400X\/T84001W1 hardware suffix remains unverified/);
    }
    for (const field of ['matter', 'zigbee', 'thread', 'bluetooth', 'smartthings']) assert.equal(flags[field].verified, false);
    assert.match(flags.apple.reason, /1080p/);
    assert.match(flags.apple.reason, /eufy app before enabling HomeKit/);
    assert.equal(applyVerifiedCompatibility({}, slug, { ...env, graph }).compatibilityConditions.appleHomeKit, flags.apple.reason);
  }
});

test('eufy rejects scope and date errors, isolates disputes and never certifies a hardware suffix', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:apple-home');
  assert.equal(edge.scope.hardwareId, null);
  for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:eufy-t8410:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).apple.verified, false);
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).apple.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).apple.verified, true);
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options).apple.verified, true);
  for (const other of ['eufy-t8410', 'eufy-t8401', 'eufy-t8400x']) assert.equal(getVerifiedFlags(graph, other, options).apple.verified, false);
});
