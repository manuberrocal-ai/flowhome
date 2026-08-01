/**
 * Block 9 — Claim freshness, expiry, and contradiction detection.
 *
 * @packageDocumentation
 *
 * A verified claim degrades as it ages and disappears when it expires or is
 * disputed. Two ledger rows (or edges) are a contradiction when they assert
 * incompatible verdicts about the same (entity, relation, market) tuple with
 * overlapping scope. Name-based similarity is never used to infer a
 * contradiction; only explicit same-target tuples are compared.
 */
import type {
  ClaimLedgerEntry,
  ClaimStatus,
  CompatibilityEdge,
  ConfidenceLevel,
  EdgeRelation,
  EvidenceLevel,
} from './domain.ts';
import {
  CLAIM_FRESHNESS_WINDOWS_MS,
  isPositiveRelation,
  isVisitorVisibleNoticeRelation,
  toStrictUtc,
} from './domain.ts';

export interface ClaimFreshnessResult {
  fresh: boolean;
  expired: boolean;
  ageMs: number;
  reference: string;
  reason: 'fresh' | 'stale' | 'expired' | 'unknown_verified_at';
}

/** Evaluates claim freshness against the claim window and an optional expiry. */
export function evaluateClaimFreshness(
  claim: { verifiedAt: string; expiry: string | null },
  now: Date | string = new Date(),
): ClaimFreshnessResult {
  const ref = now instanceof Date ? now : new Date(now);
  const reference = ref.toISOString();
  const verifiedIso = toStrictUtc(claim.verifiedAt);
  if (!verifiedIso) {
    return { fresh: false, expired: false, ageMs: NaN, reference, reason: 'unknown_verified_at' };
  }
  const ageMs = ref.getTime() - new Date(verifiedIso).getTime();
  if (ageMs < 0) {
    return { fresh: false, expired: false, ageMs, reference, reason: 'unknown_verified_at' };
  }
  const expiresIso = toStrictUtc(claim.expiry ?? null);
  const expired = expiresIso != null && ref.getTime() >= new Date(expiresIso).getTime();
  if (expired) return { fresh: false, expired: true, ageMs, reference, reason: 'expired' };
  const fresh = ageMs >= 0 && ageMs <= CLAIM_FRESHNESS_WINDOWS_MS.claim;
  return { fresh, expired: false, ageMs, reference, reason: fresh ? 'fresh' : 'stale' };
}

/**
 * Effective status of a claim after applying freshness + explicit status.
 * A stale claim stays active (degraded confidence) unless it is expired or
 * disputed; an expired or disputed claim becomes `expired`/`disputed` and
 * never surfaces as fact.
 */
export function effectiveClaimStatus(
  claim: { verifiedAt: string; expiry: string | null; status: ClaimStatus },
  now: Date | string = new Date(),
): { status: ClaimStatus; surfaced: boolean; confidence: ConfidenceLevel; reason: string } {
  if (claim.status === 'suppressed' || claim.status === 'disputed' || claim.status === 'expired' || claim.status === 'unknown') {
    return { status: claim.status, surfaced: false, confidence: 'unknown', reason: `status:${claim.status}` };
  }
  const f = evaluateClaimFreshness(claim, now);
  if (f.reason === 'unknown_verified_at') {
    return { status: 'unknown', surfaced: false, confidence: 'unknown', reason: 'unknown_verified_at' };
  }
  if (f.reason === 'expired') {
    return { status: 'expired', surfaced: false, confidence: 'unknown', reason: 'expired' };
  }
  if (f.reason === 'stale') {
    // Stale but not expired: stays active but degrades confidence to low.
    return { status: 'active', surfaced: true, confidence: 'low', reason: 'stale' };
  }
  return { status: 'active', surfaced: true, confidence: 'medium', reason: 'fresh' };
}

// ---------------------------------------------------------------------------
// Contradiction detection — same (from, to, relation, market), opposite verdicts
// ---------------------------------------------------------------------------

export interface ContradictionFinding {
  /** A pair of edge ids that contradict. */
  a: string;
  b: string;
  /** The tuple key where the contradiction occurs. */
  key: string;
  /** Why the pair is treated as contradictory. */
  reason: string;
}

/**
 * Builds a tuple key for an edge or ledger row so two claims can be compared
 * without string-fuzzy matching on labels.
 */
export function edgeTupleKey(edge: { from: string; to: string; relation: EdgeRelation; market: string }): string {
  return `${edge.from}|${edge.to}|${edge.market}`;
}

/**
 * Detects contradictions in a set of edges. A contradiction exists when two
 * active edges share the same (from, to, market) tuple but one is `conflicts`
 * and the other is a positive relation, or when two edges assert opposite
 * verdicts on the same tuple through their `status`/`evidence`.
 *
 * Only explicit same-tuple pairs are compared; name-based inference is never
 * used.
 */
export function detectEdgeContradictions(
  edges: ReadonlyArray<CompatibilityEdge>,
  now: Date | string = new Date(),
): ContradictionFinding[] {
  const findings: ContradictionFinding[] = [];
  const ref = now instanceof Date ? now : new Date(now);
  const activeEdges = edges.filter((edge) => {
    const eff = effectiveClaimStatus(edge, ref);
    return eff.status !== 'expired' && eff.status !== 'suppressed';
  });
  const byKey = new Map<string, CompatibilityEdge[]>();
  for (const edge of activeEdges) {
    const key = edgeTupleKey(edge);
    const list = byKey.get(key) ?? [];
    list.push(edge);
    byKey.set(key, list);
  }
  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const positiveVsConflict =
          (isPositiveRelation(a.relation) && b.relation === 'conflicts')
          || (isPositiveRelation(b.relation) && a.relation === 'conflicts')
          || (a.relation === 'local-only' && b.relation === 'cloud-only')
          || (a.relation === 'cloud-only' && b.relation === 'local-only');
        if (positiveVsConflict) {
          findings.push({ a: a.id, b: b.id, key, reason: 'opposite_verdict_on_same_tuple' });
        }
        if (a.status === 'disputed' || b.status === 'disputed') {
          findings.push({ a: a.id, b: b.id, key, reason: 'disputed_status_present' });
        }
      }
    }
  }
  return findings;
}

/**
 * Detects contradictions in a Claim Ledger. Two ledger rows contradict when
 * they target the same (entityId, visibleLocation, market) tuple but assert
 * materially different claims (positive vs negative verdict on the same
 * assertion). Only explicit same-tuple pairs are compared.
 */
export function detectLedgerContradictions(
  ledger: ReadonlyArray<ClaimLedgerEntry>,
  now: Date | string = new Date(),
): ContradictionFinding[] {
  const findings: ContradictionFinding[] = [];
  const ref = now instanceof Date ? now : new Date(now);
  const active = ledger.filter((row) => {
    const eff = effectiveClaimStatus({ verifiedAt: row.reviewDate, expiry: null, status: row.status }, ref);
    return eff.status === 'active';
  });
  const byKey = new Map<string, ClaimLedgerEntry[]>();
  for (const row of active) {
    const key = `${row.entityId}|${row.visibleLocation}|${row.market}`;
    const list = byKey.get(key) ?? [];
    list.push(row);
    byKey.set(key, list);
  }
  for (const [key, list] of byKey) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const aNeg = /\b(not|never|incompatible|conflicts?)\b/i.test(a.claim);
        const bNeg = /\b(not|never|incompatible|conflicts?)\b/i.test(b.claim);
        const aPos = /\b(works|compatible|supports?)\b/i.test(a.claim);
        const bPos = /\b(works|compatible|supports?)\b/i.test(b.claim);
        if ((aNeg && bPos) || (aPos && bNeg)) {
          findings.push({ a: a.id, b: b.id, key, reason: 'opposite_verdict_on_same_location' });
        }
        if (a.status === 'disputed' || b.status === 'disputed') {
          findings.push({ a: a.id, b: b.id, key, reason: 'disputed_status_present' });
        }
      }
    }
  }
  return findings;
}

/** A verified compatibility notice for constraint and informational relations. */
export function describeConstraint(rel: EdgeRelation, targetLabel: string): string | null {
  if (!isVisitorVisibleNoticeRelation(rel)) return null;
  switch (rel) {
    case 'requires-hub':
      return `Requires hub ${targetLabel}.`;
    case 'requires-bridge':
      return `Requires bridge ${targetLabel}.`;
    case 'requires-subscription':
      return `Requires subscription ${targetLabel}.`;
    case 'cloud-only':
      return `Cloud-only path via ${targetLabel}.`;
    case 'conflicts':
      return `Known conflict with ${targetLabel}.`;
    case 'requires-installation':
      return `Installation requirement: ${targetLabel}.`;
    case 'requires-electrical':
      return `Electrical requirement: ${targetLabel}.`;
    case 'requires-housing':
      return `Housing requirement: ${targetLabel}.`;
    case 'available-in':
      return `Available in ${targetLabel}.`;
    case 'warranty-covered-in':
      return `Warranty coverage: ${targetLabel}.`;
    default:
      return null;
  }
}

/** Confidence degrades gracefully with claim freshness. */
export function confidenceFromClaimFreshness(
  result: ClaimFreshnessResult,
  evidence: EvidenceLevel,
): ConfidenceLevel {
  if (result.reason === 'unknown_verified_at') return 'unknown';
  if (result.reason === 'expired') return 'unknown';
  if (result.reason === 'stale') {
    return 'low';
  }
  return evidence === 'hands-on-tested' ? 'high' : evidence === 'research-verified' ? 'medium' : 'low';
}
