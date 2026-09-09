import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';
const slugs = ['aqara-hub-m2', 'aqara-motion-sensor-p1', 'aeotec-smartthings-hub'];
const options = slug => ({ enabled: true, market: 'US', now: '2026-09-07T01:15:00Z', visibleLocation: `product:${slug}:compatibility` });

test('hub-mediated assistants retain device, account and function limits on four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const slug of slugs) for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const env = { ...options(slug), visibleLocation: `${surface}:${slug}:compatibility` };
    const flags = getVerifiedFlags(graph, slug, env);
    const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
    for (const [field, mapped] of [['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible'], ...(slug === slugs[1] ? [['apple', 'appleHomeKit']] : [])]) {
      assert.equal(flags[field].verified, true);
      assert.equal(product.compatibilityConditions[mapped], flags[field].reason);
    }
    assert.equal(flags.bluetooth.verified, false, 'hardware radio mention must not create accessory compatibility');
    if (slug === slugs[0]) {
      assert.match(flags.alexa.reason, /IR support is limited/);
      assert.match(flags.google.reason, /do not establish offline/);
    } else if (slug === slugs[1]) {
      assert.match(flags.alexa.reason, /does not establish direct Echo pairing/);
      assert.match(flags.google.reason, /shorter platform list omits Google/);
      assert.match(flags.apple.reason, /do not assume illumination/);
      assert.equal(flags.wifi.verified, false);
      assert.equal(flags.thread.verified, false);
    } else {
      assert.match(flags.alexa.reason, /all-location authorization scope/);
      assert.match(flags.google.reason, /not a current app walkthrough/);
      assert.equal(flags.apple.verified, false);
    }
  }
});

test('new assistant evidence respects historical dates, expiry and exact-surface disputes', () => {
  for (const slug of slugs) for (const field of ['alexa', 'google', ...(slug === slugs[1] ? ['apple'] : [])]) {
    const target = { alexa: 'alexa', google: 'google-home', apple: 'apple-home' }[field];
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === `e:${target}`);
    assert.equal(edge.scope.hardwareId, null);
    for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T01:10:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:wrong-hub:compatibility' }]) assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change })[field].verified, false);
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug))[field].verified, false);
    assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), visibleLocation: `quiz:${slug}:compatibility` })[field].verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug))[field].verified, true);
  }
  for (const slug of ['aqara-hub-m3', 'aqara-motion-sensor-p2', 'aeotec-smart-home-hub-2']) assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, false);
});
