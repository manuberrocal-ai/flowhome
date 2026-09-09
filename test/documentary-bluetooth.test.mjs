import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const cases = {
  'google-nest-hub-2nd-gen': /does not certify particular profiles/,
  'ecobee-smart-thermostat-premium': /does not certify Bluetooth HVAC control/,
  'yale-assure-lock-2-wifi': /Bluetooth alone does not supply the Wi-Fi module/,
  'august-wifi-smart-lock': /Remote access separately requires Wi-Fi/,
};
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T01:05:00Z', visibleLocation: `product:${slug}:compatibility` });

test('Bluetooth model-specific limitations survive adaptation on every surface', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const [slug, expected] of Object.entries(cases)) for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    assert.equal(flags.bluetooth.verified, true);
    assert.match(flags.bluetooth.reason, expected);
    assert.equal(applyVerifiedCompatibility({}, slug, { ...env, graph }).compatibilityConditions.bluetooth, flags.bluetooth.reason);
  }
});

test('Bluetooth evidence respects its own review date, scope and independent disputes', () => {
  for (const slug of Object.keys(cases)) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:bluetooth');
    assert.equal(edge.scope.hardwareId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:55:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-generation:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).bluetooth.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).bluetooth.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).bluetooth.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).bluetooth.verified, true);
  }
  for (const slug of ['google-nest-hub-max', 'ecobee-smart-thermostat-enhanced', 'yale-assure-lock-2-plus', 'august-smart-lock-pro']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).bluetooth.verified, false);
});
