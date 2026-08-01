import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EVIDENCE_LEVEL_LABELS,
  EVIDENCE_RANK,
  EDGE_RELATIONS,
  NODE_TYPES,
  isDocumentedHandsOnTest,
  isPositiveRelation,
  isConstraintRelation,
  isValidCompatibilityScope,
} from '../src/lib/blocks/block9/domain.ts';
import { toStrictUtc } from '../src/lib/blocks/block8/domain.ts';
import { loadBlock9Fixtures } from '../src/lib/blocks/block9/fixtures.ts';

test('evidence levels are exactly the closed set with stable labels', () => {
  assert.deepEqual([...Object.keys(EVIDENCE_LEVEL_LABELS)].sort(), ['data-evaluated', 'hands-on-tested', 'research-verified']);
  assert.equal(EVIDENCE_LEVEL_LABELS['hands-on-tested'], 'Hands-on tested');
  assert.equal(EVIDENCE_LEVEL_LABELS['research-verified'], 'Research verified');
  assert.equal(EVIDENCE_LEVEL_LABELS['data-evaluated'], 'Data evaluated');
});

test('evidence rank is monotonic with privileged evidence', () => {
  assert.ok(EVIDENCE_RANK['hands-on-tested'] > EVIDENCE_RANK['research-verified']);
  assert.ok(EVIDENCE_RANK['research-verified'] > EVIDENCE_RANK['data-evaluated']);
});

test('isDocumentedHandsOnTest forbids bare "tested" without a physical method and date', () => {
  assert.equal(isDocumentedHandsOnTest('tested on device'), false);
  assert.equal(isDocumentedHandsOnTest('physical in-home trial run 2026-06-15'), true);
  assert.equal(isDocumentedHandsOnTest('tested'), false);
  assert.equal(isDocumentedHandsOnTest('checked the listing 2026-07-01'), false);
  assert.equal(isDocumentedHandsOnTest(null), false);
});

test('edge relation vocabulary is closed and partitioned', () => {
  assert.deepEqual([...EDGE_RELATIONS].sort(), [
    'available-in', 'cloud-only', 'complements', 'conflicts', 'local-only',
    'requires-bridge', 'requires-electrical', 'requires-housing', 'requires-hub',
    'requires-installation', 'requires-subscription', 'substitutes',
    'warranty-covered-in', 'works-with',
  ]);
  assert.equal(isPositiveRelation('works-with'), true);
  assert.equal(isPositiveRelation('local-only'), true);
  assert.equal(isPositiveRelation('complements'), true);
  assert.equal(isPositiveRelation('requires-hub'), false);
  assert.equal(isConstraintRelation('requires-hub'), true);
  assert.equal(isConstraintRelation('requires-installation'), true);
  assert.equal(isConstraintRelation('requires-electrical'), true);
  assert.equal(isConstraintRelation('requires-housing'), true);
  assert.equal(isPositiveRelation('available-in'), true);
  assert.equal(isPositiveRelation('warranty-covered-in'), true);
  assert.equal(isConstraintRelation('conflicts'), true);
  assert.equal(isConstraintRelation('works-with'), false);
});

test('node type vocabulary is closed', () => {
  assert.deepEqual([...NODE_TYPES].sort(), [
    'ecosystem', 'electrical', 'firmware', 'generation', 'hardware', 'housing',
    'installation', 'market', 'product', 'protocol', 'variant', 'warranty',
  ]);
});

test('toStrictUtc rejects date-only and offset forms', () => {
  assert.ok(toStrictUtc('2026-07-30T12:00:00Z')?.startsWith('2026-07-30T12:00:00'));
  assert.equal(toStrictUtc('2026-07-30'), null);
  assert.equal(toStrictUtc('2026-07-30T12:00:00+00:00'), null);
  assert.equal(toStrictUtc(null), null);
});


test('every fixture edge has valid explicit scope and complete provenance per ledger location', () => {
  const graph = loadBlock9Fixtures();
  for (const edge of graph.edges) {
    const sourceNode = graph.nodes.find((node) => node.id === edge.from);
    assert.ok(sourceNode, `missing source node for ${edge.id}`);
    assert.equal(isValidCompatibilityScope(edge.scope, edge, graph.nodes), true, `${edge.id} must have valid scope`);
    const rows = graph.ledger.filter((row) => row.edgeId === edge.id);
    assert.ok(rows.length >= 1, `${edge.id} must have a ledger row`);
    assert.equal(new Set(rows.map((row) => row.visibleLocation)).size, rows.length, `${edge.id} must have at most one row per location`);
    for (const row of rows) {
      assert.equal(row.entityId, edge.from);
      assert.equal(row.entityVersion, sourceNode.version);
      assert.equal(row.market, edge.market);
      assert.equal(row.claim, edge.claim);
      assert.equal(row.evidence, edge.evidence);
      assert.equal(row.validationMethod, edge.validationMethod);
      assert.deepEqual(row.source, edge.source);
    }
    assert.ok(edge.source.label);
    assert.match(edge.source.url, /^https:\/\//);
    assert.ok(edge.source.supplier);
    assert.ok(toStrictUtc(edge.source.accessedAt));
    assert.ok(toStrictUtc(edge.verifiedAt));
    assert.ok(['high', 'medium', 'low', 'unknown'].includes(edge.confidence));
    assert.ok(['active', 'suppressed', 'disputed', 'expired', 'unknown'].includes(edge.status));
    assert.ok(Array.isArray(edge.reviewHistory));
  }
});
