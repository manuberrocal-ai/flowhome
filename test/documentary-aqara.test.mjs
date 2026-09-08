import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { loadAqaraDocumentaryCandidate } from '../src/lib/blocks/block9/documentary-aqara.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
import { applyVerifiedCompatibility } from '../src/lib/blocks/block9/compatibility-adapter.ts';

const now = '2026-09-07T00:00:00Z';
const options = (slug, surface = 'product') => ({ enabled: true, market: 'US', now, visibleLocation: `${surface}:${slug}:compatibility` });

test('Aqara M2 retains Zigbee capacity, Apple IR exclusion and historical Matter conditions', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const slug = 'aqara-hub-m2';
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, options(slug, surface));
    for (const field of ['wifi', 'zigbee', 'matter', 'apple']) assert.equal(flags[field].verified, true);
    assert.match(flags.zigbee.reason, /128 needs suitable repeaters/);
    assert.match(flags.apple.reason, /IR controller is not exposed to Apple Home/);
    assert.match(flags.matter.reason, /firmware 4.0.0 Beta announcement/);
    assert.match(flags.matter.reason, /does not certify the installed version/);
    for (const field of ['thread', 'bluetooth', 'alexa', 'google', 'smartthings']) assert.equal(flags[field].verified, false);
  }
});

test('P1 bridged Matter does not turn the sensor into P2, a Wi-Fi device or a universal accessory', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const slug = 'aqara-motion-sensor-p1';
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, options(slug, surface));
    assert.equal(flags.zigbee.verified, true);
    assert.equal(flags.matter.verified, true);
    assert.match(flags.matter.reason, /not native Matter or Thread/);
    assert.match(flags.zigbee.reason, /does not establish pairing with other-brand hubs/);
    for (const field of ['thread', 'wifi', 'bluetooth', 'apple', 'alexa', 'google']) assert.equal(flags[field].verified, false);
    const prepared = applyVerifiedCompatibility({ matter: false, wifi: true }, slug, { ...options(slug, surface), graph });
    assert.equal(prepared.matter, true);
    assert.equal(prepared.wifi, undefined);
    assert.equal(prepared.compatibilityConditions.matter, flags.matter.reason);
  }
  assert.equal(getVerifiedFlags(graph, 'aqara-motion-sensor-p2', options('aqara-motion-sensor-p2')).matter.verified, false);
});

test('Aqara evidence fails closed by market, time, exact surface and dispute', () => {
  for (const slug of ['aqara-hub-m2', 'aqara-motion-sensor-p1']) {
    const graph = documentaryCandidateProvider.getGraph();
    const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:matter');
    for (const override of [{ enabled: false }, { market: 'CA' }, { now: edge.expiry }, { visibleLocation: `quiz:${slug}:other` }]) {
      assert.equal(getVerifiedFlags(graph, slug, { ...options(slug), ...override }).matter.verified, false);
    }
    graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options(slug).visibleLocation).status = 'disputed';
    assert.equal(getVerifiedFlags(graph, slug, options(slug)).matter.verified, false);
    assert.equal(getVerifiedFlags(graph, slug, options(slug, 'quiz')).matter.verified, true);
    assert.equal(getVerifiedFlags(graph, 'switchbot-hub-2', options('switchbot-hub-2')).matter.verified, true);
  }
});

test('shared builder preserves independent metadata and never assigns a seller identity or owner approval', () => {
  const graph = loadAqaraDocumentaryCandidate();
  const first = graph.edges[0];
  graph.ledger[0].source.label = 'Changed ledger';
  graph.ledger[0].history[0].verdict = 'rejected';
  assert.notEqual(first.source.label, 'Changed ledger');
  assert.equal(first.reviewHistory[0].verdict, 'pending');
  for (const node of graph.nodes) assert.equal(node.marketplaceId, null);
  assert.ok(graph.ledger.every(row => row.owner === 'unassigned'));
  assert.equal(loadAqaraDocumentaryCandidate().ledger[0].history[0].verdict, 'pending');
  assert.equal(Date.parse(first.expiry) - Date.parse(first.verifiedAt), 30 * 86_400_000);
});
