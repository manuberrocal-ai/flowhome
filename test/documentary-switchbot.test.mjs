import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider, DOCUMENTARY_CANDIDATE_STATUS } from '../src/lib/blocks/block9/documentary-provider.ts';
import { loadSwitchBotDocumentaryCandidate } from '../src/lib/blocks/block9/documentary-switchbot.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const now = '2026-09-07T00:00:00Z';
const options = (slug, surface = 'product') => ({ enabled: true, market: 'US', now, visibleLocation: `${surface}:${slug}:compatibility` });

test('documented models have distinct identities and exact per-edge ledger coverage', () => {
  const graph = documentaryCandidateProvider.getGraph();
  assert.equal(DOCUMENTARY_CANDIDATE_STATUS.coveredModels, 28);
  assert.equal(graph.nodes.filter(node => node.type === 'product').length, 28);
  for (const key of ['nodes', 'edges', 'ledger']) assert.equal(new Set(graph[key].map(row => row.id)).size, graph[key].length);
  for (const edge of graph.edges) {
    assert.equal(graph.nodes.find(node => node.id === edge.from).marketplaceId, null);
    const ledger = graph.ledger.filter(row => row.edgeId === edge.id);
    assert.equal(ledger.length, 4);
    for (const row of ledger) {
      assert.equal(row.claim, edge.claim);
      assert.deepEqual(row.source, edge.source);
      assert.equal(row.owner, 'unassigned');
      assert.equal(row.history[0].verdict, 'pending');
    }
  }
});

test('Hub 2 bridge, Wi-Fi and Apple claims retain role and setup limits on every surface', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const slug = 'switchbot-hub-2';
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, options(slug, surface));
    for (const field of ['wifi', 'matter', 'apple']) assert.equal(flags[field].verified, true);
    for (const field of ['thread', 'zigbee', 'alexa', 'google', 'smartthings', 'bluetooth']) assert.equal(flags[field].verified, false);
    assert.match(flags.matter.reason, /not evidence.*universal Matter controller or Thread border router/);
    assert.match(flags.apple.reason, /compatible HomePod or Apple TV/);
    assert.match(flags.wifi.reason, /2.4 GHz/);
  }
});

test('Blind Tilt requires a bridged path, never inherits Hub 2 Wi-Fi or unrelated protocols', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const slug = 'switchbot-blind-tilt';
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, options(slug, surface));
    assert.equal(flags.matter.verified, true);
    assert.equal(flags.apple.verified, true);
    assert.match(flags.matter.reason, /needs a compatible SwitchBot Matter bridge/);
    assert.match(flags.apple.reason, /Closing direction depends on firmware/);
    for (const field of ['wifi', 'thread', 'zigbee', 'alexa', 'google', 'smartthings']) assert.equal(flags[field].verified, false);
    assert.deepEqual(flags.substitutes, []);
    const product = applyVerifiedCompatibility({ wifi: true }, slug, { ...options(slug, surface), graph });
    assert.equal(product.wifi, undefined);
    assert.equal(product.compatibilityConditions.matter, flags.matter.reason);
  }
});

test('wrong scope, expired or disputed SwitchBot claims remain unknown without affecting other models', () => {
  for (const slug of ['switchbot-hub-2', 'switchbot-blind-tilt']) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:matter');
    for (const override of [{ market: 'CA' }, { now: edge.expiry }, { visibleLocation: 'product:other:compatibility' }, { enabled: false }]) {
      assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...override }).matter.verified, false);
    }
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).matter.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, options(slug, 'quiz')).matter.verified, true);
    assert.equal(getVerifiedFlags(graph, 'tapo-c120-security-camera', options('tapo-c120-security-camera')).wifi.verified, true);
  }
});

test('SwitchBot candidate reads do not share mutable source or review records', () => {
  const graph = loadSwitchBotDocumentaryCandidate();
  graph.edges[0].source.label = 'Mutated';
  graph.ledger[0].history[0].verdict = 'rejected';
  const next = loadSwitchBotDocumentaryCandidate();
  assert.notEqual(next.edges[0].source.label, 'Mutated');
  assert.equal(next.ledger[0].history[0].verdict, 'pending');
});
