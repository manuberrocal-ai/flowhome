import assert from 'node:assert/strict';
import test from 'node:test';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../src/lib/blocks/block9/resolver.ts';
const slug = 'blink-outdoor-4';
const options = { enabled: true, market: 'US', now: '2026-09-07T00:30:00Z', visibleLocation: `product:${slug}:compatibility` };

test('Blink requires its module and linked accounts on every documentary surface', () => {
  const graph = documentaryCandidateProvider.getGraph();
  for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
    const flags = getVerifiedFlags(graph, slug, { ...options, visibleLocation: `${surface}:${slug}:compatibility` });
    for (const field of ['wifi', 'alexa']) {
      assert.equal(flags[field].verified, true);
      assert.match(flags[field].reason, /Sync Module/);
    }
    assert.match(flags.alexa.reason, /linking Blink and Alexa accounts/);
    assert.match(flags.alexa.reason, /separate plan or trial/);
    for (const field of ['google', 'apple', 'matter', 'zigbee', 'thread', 'bluetooth', 'smartthings']) assert.equal(flags[field].verified, false);
  }
});

test('Blink evidence rejects invalid scope and disputes without leaking to another generation', () => {
  const graph = documentaryCandidateProvider.getGraph();
  const edge = graph.edges.find(row => row.from === `p:${slug}` && row.to === 'e:alexa');
  for (const change of [{ enabled: false }, { market: 'EU' }, { now: '2026-09-07T00:00:00Z' }, { now: edge.expiry }, { visibleLocation: 'product:blink-outdoor-3:compatibility' }]) {
    assert.equal(getVerifiedFlags(graph, slug, { ...options, ...change }).alexa.verified, false);
  }
  graph.ledger.find(row => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation).status = 'disputed';
  assert.equal(getVerifiedFlags(graph, slug, options).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, slug, { ...options, visibleLocation: `quiz:${slug}:compatibility` }).alexa.verified, true);
  assert.equal(getVerifiedFlags(documentaryCandidateProvider.getGraph(), slug, options).alexa.verified, true);
  assert.equal(getVerifiedFlags(graph, 'blink-outdoor-3', options).alexa.verified, false);
});
