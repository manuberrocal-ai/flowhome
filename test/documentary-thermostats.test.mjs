import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const ecobee = 'ecobee-smart-thermostat-premium';
const amazon = 'amazon-smart-thermostat';
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:10:00Z', visibleLocation: `product:${slug}:compatibility` });

test('thermostats retain distinct Alexa roles and ecobee Siri and SmartThings conditions', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(ecobee), visibleLocation: `${surface}:${ecobee}:compatibility` };
    const flags = getVerifiedFlags(graph, ecobee, env);
    for (const key of ['wifi', 'alexa', 'google', 'apple', 'smartthings']) assert.equal(flags[key].verified, true);
    for (const key of ['thread', 'zigbee', 'matter', 'bluetooth']) assert.equal(flags[key].verified, false);
    assert.match(flags.apple.reason, /HomePod/);
    assert.match(flags.alexa.reason, /Alexa Built-in/);
    assert.match(flags.smartthings.reason, /does not make it a SmartThings hub/);
    const prepared = applyVerifiedCompatibility({}, ecobee, { ...env, graph });
    assert.equal(prepared.compatibilityConditions.smartthingsIntegration, flags.smartthings.reason);
    const amazonFlags = getVerifiedFlags(graph, amazon, { ...options(amazon), visibleLocation: `${surface}:${amazon}:compatibility` });
    assert.equal(amazonFlags.alexa.verified, true);
    assert.match(amazonFlags.alexa.reason, /no built-in microphone/);
    for (const key of ['wifi', 'google', 'apple', 'smartthings', 'thread', 'zigbee', 'matter', 'bluetooth']) assert.equal(amazonFlags[key].verified, false);
  }
});

test('thermostat evidence is gated by exact model, region, location, expiry and independent review', () => {
  for (const slug of [ecobee, amazon]) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
    for (const change of [{ market: 'EU' }, { now: edge.expiry }, { enabled: false }, { visibleLocation: 'product:another-thermostat:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).alexa.verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).alexa.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, true);
  }
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), 'ecobee-smart-thermostat-enhanced', options(ecobee)).alexa.verified, false);
});
