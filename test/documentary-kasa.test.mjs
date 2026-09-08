import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const models = [['tp-link-kasa-smart-plug-mini', 'EP10'], ['tp-link-kasa-smart-dimmer-hs220', 'HS220'], ['tp-link-kasa-smart-light-switch-hs200', 'HS200']];
const options = (slug, surface = 'product') => ({ enabled: true, market: 'US', now: '2026-09-07T00:00:00Z', visibleLocation: `${surface}:${slug}:compatibility` });

test('three Kasa models carry only their documented voice and network signals on four surfaces', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const [slug, model] of models) {
    assert.equal(graph.edges.filter(edge => edge.from === `p:${slug}`).length, 3);
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const env = options(slug, surface);
      const flags = getVerifiedFlags(graph, slug, env);
      const product = applyVerifiedCompatibility({}, slug, { ...env, graph });
      for (const [flag, field] of [['wifi', 'wifi'], ['alexa', 'alexaCompatible'], ['google', 'googleHomeCompatible']]) {
        assert.equal(flags[flag].verified, true);
        assert.ok(flags[flag].reason.includes(model));
        assert.equal(product.compatibilityConditions[field], flags[flag].reason);
      }
      for (const key of ['matter', 'thread', 'zigbee', 'apple', 'smartthings', 'bluetooth']) assert.equal(flags[key].verified, false);
    }
  }
});

test('Kasa roles, source identity and seller reservations are not generalized across models', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const [plug, dimmer, lightSwitch] = models.map(([slug]) => getVerifiedFlags(graph, slug, options(slug)));
  assert.match(plug.alexa.reason, /not an inspected EP10P2 seller package/);
  assert.match(dimmer.alexa.reason, /dimming compatible lighting/);
  assert.match(lightSwitch.alexa.reason, /not the HS220 dimmer/);
  for (const [slug, model] of models) {
    const edges = graph.edges.filter(edge => edge.from === `p:${slug}`);
    for (const edge of edges) {
      assert.ok(edge.source.url.endsWith(model.toLowerCase()));
      assert.equal(edge.scope.hardwareId, null);
      assert.equal(edge.scope.firmwareId, null);
    }
  }
});

test('Kasa expiry, market, exact location and disputed evidence fail closed', () => {
  for (const [slug] of models) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
    for (const change of [{ now: edge.expiry }, { market: 'EU' }, { enabled: false }, { visibleLocation: 'product:hs103:compatibility' }]) {
      assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...change }).alexa.verified, false);
    }
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).alexa.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, options(slug, 'quiz')).alexa.verified, true);
    assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options(slug)).alexa.verified, true);
  }
});
