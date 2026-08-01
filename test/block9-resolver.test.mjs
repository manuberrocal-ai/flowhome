import assert from 'node:assert/strict';
import test from 'node:test';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';
import { getVerifiedFlags, getVerifiedConstraints, resolveClaimStatus } from '../src/lib/blocks/block9/resolver.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const productLocation = 'product:alpha-hub:ecosystem-chip';

test('a graph edge cannot surface without the exact rendered ledger location', () => {
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW }).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation }).alexa.verified, true);
});

test('a ledger row belonging to another surface does not authorize this one', () => {
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'comparison:alpha-hub:compatibility' }).alexa.verified, false);
  assert.equal(getVerifiedFlags(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'quiz:alpha-hub:compatibility' }).alexa.verified, true);
});

test('duplicate rows for one exact surface location fail closed', () => {
  const row = graph.ledger.find((entry) => entry.id === 'claim:quiz-alpha-alexa');
  const duplicated = { ...graph, ledger: [...graph.ledger, { ...row, id: 'claim:quiz-alpha-alexa-duplicate' }] };
  assert.equal(getVerifiedFlags(duplicated, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'quiz:alpha-hub:compatibility' }).alexa.verified, false);
});

test('exact-location notices preserve structured provenance', () => {
  const result = getVerifiedConstraints(graph, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'comparison:alpha-hub:compatibility' });
  assert.equal(result.notices.length, 1);
  assert.deepEqual(result.notices[0], {
    edgeId: 'edge:alpha-hub-required', relation: 'requires-hub', message: 'Requires hub Hub Alpha.',
    confidence: 'medium', evidence: 'research-verified', evidenceLabel: 'Research verified', sourceLabel: 'Fixture docs',
  });
});

test('resolveClaimStatus uses matching edge and ledger freshness rather than node.version', () => {
  const altered = {
    ...graph,
    nodes: graph.nodes.map((node) => node.id === 'p:alpha-hub' ? { ...node, version: 'not-a-timestamp' } : node),
    ledger: graph.ledger.map((row) => row.id === 'claim:product-alpha-alexa' ? { ...row, entityVersion: 'not-a-timestamp' } : row),
  };
  assert.equal(resolveClaimStatus(altered, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:alpha-hub:compatibility' }), 'active');
});

test('resolveClaimStatus returns the matching expired or disputed edge/ledger status', () => {
  assert.equal(resolveClaimStatus(graph, 'expired-thermostat', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:expired-thermostat:ecosystem-chip' }), 'expired');
  assert.equal(resolveClaimStatus(graph, 'disputed-plug', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:disputed-plug:ecosystem-chip' }), 'disputed');
});
