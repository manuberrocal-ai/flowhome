import assert from 'node:assert/strict';
import test from 'node:test';
import { hasRelationCompatibleDestination, isValidCompatibilityScope } from '../src/lib/blocks/block9/domain.ts';
import { getVerifiedConstraints, getVerifiedFlags, resolveClaimStatus } from '../src/lib/blocks/block9/resolver.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

const graph = loadBlock9Fixtures();
const NOW = '2026-07-30T12:00:00Z';
const productLocation = 'product:alpha-hub:compatibility';
const alpha = graph.edges.find((edge) => edge.id === 'edge:alpha-alexa');
const installation = graph.edges.find((edge) => edge.id === 'edge:alpha-installation');
const electrical = graph.edges.find((edge) => edge.id === 'edge:alpha-electrical');
const housing = graph.edges.find((edge) => edge.id === 'edge:alpha-housing');

function flags(subject = graph) {
  return getVerifiedFlags(subject, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation });
}

test('S24 accepts a relation-compatible destination node', () => {
  assert.equal(hasRelationCompatibleDestination(alpha, graph.nodes), true);
});

test('S24 rejects a destination id that does not exist', () => {
  assert.equal(hasRelationCompatibleDestination({ ...alpha, to: 'e:missing' }, graph.nodes), false);
});

test('S24 rejects a product destination for works-with', () => {
  assert.equal(hasRelationCompatibleDestination({ ...alpha, to: 'p:beta-bulb' }, graph.nodes), false);
});

test('S24 requires a hardware destination for requires-hub', () => {
  const hub = graph.edges.find((edge) => edge.id === 'edge:alpha-hub-required');
  assert.equal(hasRelationCompatibleDestination({ ...hub, to: 'e:alexa' }, graph.nodes), false);
});

test('S24 requires an installation destination for requires-installation', () => {
  assert.equal(hasRelationCompatibleDestination({ ...installation, to: 'c:alpha-electrical' }, graph.nodes), false);
});

test('S24 requires an electrical destination for requires-electrical', () => {
  assert.equal(hasRelationCompatibleDestination({ ...electrical, to: 'c:alpha-housing' }, graph.nodes), false);
});

test('S24 requires a housing destination for requires-housing', () => {
  assert.equal(hasRelationCompatibleDestination({ ...housing, to: 'c:alpha-installation' }, graph.nodes), false);
});

test('S24 requires a market destination for available-in', () => {
  const edge = graph.edges.find((item) => item.id === 'edge:alpha-available-us');
  assert.equal(hasRelationCompatibleDestination({ ...edge, to: 'w:alpha-us' }, graph.nodes), false);
});

test('S24 requires a warranty destination for warranty-covered-in', () => {
  const edge = graph.edges.find((item) => item.id === 'edge:alpha-warranty-us');
  assert.equal(hasRelationCompatibleDestination({ ...edge, to: 'm:us' }, graph.nodes), false);
});

test('S24 rejects free-text installation scope', () => {
  assert.equal(isValidCompatibilityScope({ ...installation.scope, installation: 'Wall-mounted indoor installation' }, installation, graph.nodes), false);
});

test('S24 rejects free-text electrical scope', () => {
  assert.equal(isValidCompatibilityScope({ ...electrical.scope, electrical: '120 V AC power' }, electrical, graph.nodes), false);
});

test('S24 rejects free-text housing scope', () => {
  assert.equal(isValidCompatibilityScope({ ...housing.scope, housing: 'Standard single-gang wall box' }, housing, graph.nodes), false);
});

test('S24 rejects a setup scope node of the wrong type', () => {
  assert.equal(isValidCompatibilityScope({ ...installation.scope, installation: 'c:alpha-electrical' }, installation, graph.nodes), false);
});

test('S24 requires setup scope to identify the edge destination exactly', () => {
  assert.equal(isValidCompatibilityScope({ ...installation.scope, installation: 'c:alpha-housing' }, installation, graph.nodes), false);
});

test('S24 rejects setup scope on a non-setup relation', () => {
  assert.equal(isValidCompatibilityScope({ ...alpha.scope, installation: 'c:alpha-installation' }, alpha, graph.nodes), false);
});

test('S24 requires edge.from to be a typed scoped entity id', () => {
  assert.equal(isValidCompatibilityScope({ ...alpha.scope, productId: 'p:beta-bulb' }, alpha, graph.nodes), false);
});

test('S24 rejects unknown typed entity references', () => {
  assert.equal(isValidCompatibilityScope({ ...alpha.scope, productId: 'p:not-in-graph' }, alpha, graph.nodes), false);
});

test('S24 rejects scope objects with undeclared fields', () => {
  assert.equal(isValidCompatibilityScope({ ...alpha.scope, authorization: 'free text' }, alpha, graph.nodes), false);
});

test('canonical target ids, not an Alexa label, authorize an ecosystem flag', () => {
  const altered = { ...graph, edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, to: 'e:google-home' } : edge) };
  assert.equal(flags(altered).alexa.verified, false);
});

test('an absent S24 destination never reaches verified flags', () => {
  const altered = { ...graph, edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, to: 'e:missing' } : edge) };
  assert.equal(flags(altered).alexa.verified, false);
});

test('a relation-incompatible S24 destination never reaches verified flags', () => {
  const altered = { ...graph, edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, to: 'p:beta-bulb' } : edge) };
  assert.equal(flags(altered).alexa.verified, false);
});

test('S31 unknown edge confidence never surfaces a compatibility flag', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.edgeId === alpha.id && row.visibleLocation === productLocation ? { ...row, confidence: 'unknown' } : row),
  };
  assert.equal(flags(altered).alexa.verified, false);
});

test('S31 unknown ledger confidence never surfaces a compatibility flag', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.edgeId === alpha.id && row.visibleLocation === productLocation ? { ...row, confidence: 'unknown' } : row),
  };
  assert.equal(resolveClaimStatus(altered, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: productLocation }), 'unknown');
});

test('S31 unknown confidence never surfaces a verified notice', () => {
  const location = 'product:alpha-hub:compatibility-note';
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === installation.id ? { ...edge, confidence: 'unknown' } : edge),
    ledger: graph.ledger.map((row) => row.edgeId === installation.id ? { ...row, confidence: 'unknown' } : row),
  };
  assert.equal(getVerifiedConstraints(altered, 'alpha-hub', { enabled: true, market: 'US', now: NOW, visibleLocation: location }).notices.some((notice) => notice.edgeId === installation.id), false);
});

test('a stale edge remains surfaced at low confidence', () => {
  const altered = { ...graph, edges: graph.edges.map((edge) => edge.id === alpha.id ? { ...edge, verifiedAt: '2025-12-01T00:00:00Z' } : edge) };
  assert.equal(flags(altered).alexa.confidence, 'low');
});

test('a stale ledger row remains surfaced at low confidence', () => {
  const altered = { ...graph, ledger: graph.ledger.map((row) => row.edgeId === alpha.id && row.visibleLocation === productLocation ? { ...row, reviewDate: '2025-12-01T00:00:00Z' } : row) };
  assert.equal(flags(altered).alexa.confidence, 'low');
});

test('an expired edge never surfaces a compatibility flag', () => {
  assert.equal(getVerifiedFlags(graph, 'expired-thermostat', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:expired-thermostat:ecosystem-chip' }).alexa.verified, false);
});

test('a disputed ledger row never surfaces a compatibility flag', () => {
  assert.equal(getVerifiedFlags(graph, 'disputed-plug', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:disputed-plug:ecosystem-chip' }).alexa.verified, false);
});

test('invalid hands-on method never authorizes a hands-on flag', () => {
  const altered = {
    ...graph,
    edges: graph.edges.map((edge) => edge.id === 'edge:beta-matter' ? { ...edge, validationMethod: 'Tested 2026.' } : edge),
    ledger: graph.ledger.map((row) => row.edgeId === 'edge:beta-matter' ? { ...row, validationMethod: 'Tested 2026.' } : row),
  };
  assert.equal(getVerifiedFlags(altered, 'beta-bulb', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:beta-bulb:ecosystem-chip' }).matter.verified, false);
});

test('documented physical hands-on method authorizes the matching flag', () => {
  const flag = getVerifiedFlags(graph, 'beta-bulb', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:beta-bulb:ecosystem-chip' }).matter;
  assert.deepEqual({ verified: flag.verified, level: flag.level, confidence: flag.confidence }, { verified: true, level: 'hands-on-tested', confidence: 'high' });
});

test('market scope never inherits a Canada-only canonical edge into US', () => {
  assert.equal(getVerifiedFlags(graph, 'delta-cam', { enabled: true, market: 'US', now: NOW, visibleLocation: 'product:delta-cam:ecosystem-chip' }).alexa.verified, false);
});

test('market scope resolves the exact Canada-only canonical edge in Canada', () => {
  assert.equal(getVerifiedFlags(graph, 'delta-cam', { enabled: true, market: 'CA', now: NOW, visibleLocation: 'product:delta-cam:ecosystem-chip' }).alexa.verified, true);
});
