import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const wyze = 'wyze-bulb-color';
const govee = 'govee-rgbic-led-strip-lights';
const hue = 'philips-hue-white-color-starter-kit';
const fields = ['wifi', 'bluetooth', 'zigbee', 'matter', 'thread', 'alexa', 'google', 'apple', 'smartthings'];
const expected = { [wyze]: ['wifi', 'bluetooth', 'alexa', 'google'], [govee]: ['bluetooth'], [hue]: ['bluetooth', 'zigbee', 'matter', 'alexa', 'google', 'apple', 'smartthings'] };
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T00:30:00Z', visibleLocation: `product:${slug}:compatibility` });

test('lighting roles stay model-scoped across every surface without Bluetooth or hub inheritance', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const [slug, supported] of Object.entries(expected)) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
      const flags = getVerifiedFlags(graph, slug, env);
      for (const field of fields) assert.equal(flags[field].verified, supported.includes(field), `${slug} ${surface} ${field}`);
      const projected = applyVerifiedCompatibility({}, slug, { ...env, graph });
      assert.equal(projected.compatibilityConditions.bluetooth, flags.bluetooth.reason);
      if (slug === wyze) assert.match(flags.bluetooth.reason, /pairing role.*does not establish standalone/);
      if (slug === govee) assert.match(flags.bluetooth.reason, /H617C.*no Alexa or Matter.*H618C/);
      if (slug === hue) {
        assert.match(flags.matter.reason, /Bluetooth-only connections cannot/);
        assert.match(flags.alexa.reason, /Hue Bridge required/);
        assert.match(flags.smartthings.reason, /not a SmartThings hub/);
        assert.equal(projected.compatibilityConditions.smartthingsIntegration, flags.smartthings.reason);
      }
    }
  }
});

test('lighting rejects future, expired, wrong-market and wrong-model evidence and isolates disputes', () => {
  for (const slug of Object.keys(expected)) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:bluetooth');
    for (const change of [{ enabled: false }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { market: 'EU' }, { visibleLocation: 'product:another-light:compatibility' }]) {
      assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).bluetooth.verified, false);
    }
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).bluetooth.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` }).bluetooth.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).bluetooth.verified, true);
  }
  for (const slug of ['govee-h618c', 'philips-hue-bridge-pro', 'wyze-bulb-color-br30']) {
    const flags = getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug));
    assert.ok(fields.every(field => !flags[field].verified));
  }
});
