/**
 * Block 9 â€” Compatibility resolver.
 *
 * @packageDocumentation
 *
 * Reads the compatibility graph + claim ledger and produces *verified* flags
 * for the surface pages (quiz, comparisons, alternatives, product pages).
 *
 * Design invariants (stronger than Block 8):
 *
 * - **No name-based inference.** A flag is verified only when a matching
 *   `(nodeId, ecosystem/relation, market)` claim exists in the ledger or graph.
 *   Two products with similar names never inherit each other's compatibility.
 * - **Unknown stays Unknown / not-verified.** When no claim exists, the flag
 *   returns `{ verified: false, level: null }`. Surfacing "compatible" without
 *   a verified claim is forbidden.
 * - **Expired or disputed claims degrade or disappear.** An expired or
 *   disputed claim is removed from the verified set; a stale claim keeps
 *   surfacing but with confidence `low`.
 * - **Feature flag boundary.** The resolver returns verified flags only when
 *   `enabled=true` is passed (caller reads `PUBLIC_COMPATIBILITY_V1`).
 *   When `enabled=false` the resolver returns all-`null` flags (visible
 *   catalog booleans stay as the existing "not-verified" fallback).
 */
import type {
  ClaimLedgerEntry,
  ClaimStatus,
  CompatibilityEdge,
  CompatibilityNode,
  ConfidenceLevel,
  EvidenceLevel,
  EdgeRelation,
  NodeType,
} from './domain.ts';
import {
  EVIDENCE_LEVEL_LABELS,
  EVIDENCE_RANK,
  isConstraintRelation,
  isDocumentedHandsOnTest,
  hasRelationCompatibleDestination,
  isPositiveRelation,
  isValidCompatibilityScope,
  isVisitorVisibleNoticeRelation,
} from './domain.ts';
import {
  describeConstraint,
  effectiveClaimStatus,
} from './freshness.ts';

// ---------------------------------------------------------------------------
// Ecosystem vocabulary aligned with the quiz (`QuizEcosystem`)
// ---------------------------------------------------------------------------

export type EcosystemFlag = 'alexa' | 'google' | 'apple' | 'smartthings' | 'matter' | 'thread' | 'zigbee' | 'wifi' | 'bluetooth';


/** Closed canonical identities for ecosystem/protocol flags; labels are display-only. */
const ECOSYSTEM_TARGET: Record<EcosystemFlag, { id: string; type: NodeType }> = {
  alexa: { id: 'e:alexa', type: 'ecosystem' },
  google: { id: 'e:google-home', type: 'ecosystem' },
  apple: { id: 'e:apple-home', type: 'ecosystem' },
  smartthings: { id: 'e:smartthings', type: 'ecosystem' },
  matter: { id: 'e:matter', type: 'protocol' },
  thread: { id: 'e:thread', type: 'protocol' },
  zigbee: { id: 'e:zigbee', type: 'protocol' },
  wifi: { id: 'e:wifi', type: 'protocol' },
  bluetooth: { id: 'e:bluetooth', type: 'protocol' },
};

// ---------------------------------------------------------------------------
// Verified flag shape consumed by quiz / comparison / product pages
// ---------------------------------------------------------------------------

export interface VerifiedFlag {
  /** True only when an active verified edge and exact active ledger row back the flag. */
  verified: boolean;
  /** Evidence level when verified; null otherwise (Unknown). */
  level: EvidenceLevel | null;
  /** Effective confidence after freshness evaluation; stale surfaced claims are low. */
  confidence: ConfidenceLevel | null;
  /** Stable reason surfaced to the visitor (no PII, no claim fabrication). */
  reason: string | null;
  /** Constraint notices (requires-hub, requires-bridge, etc.) when present. */
  constraints: string[];
  /** Source provenance, surfaced as a citation tooltip (no URL in copy). */
  sourceLabel: string | null;
}

const UNVERIFIED: VerifiedFlag = { verified: false, level: null, confidence: null, reason: null, constraints: [], sourceLabel: null };

// ---------------------------------------------------------------------------
// Graph lookup helpers
// ---------------------------------------------------------------------------

export interface CompatibilityGraph {
  nodes: ReadonlyArray<CompatibilityNode>;
  edges: ReadonlyArray<CompatibilityEdge>;
  ledger: ReadonlyArray<ClaimLedgerEntry>;
}

/** Index nodes by catalog slug for matching against product entries. */
export function nodeBySlug(graph: CompatibilityGraph, slug: string, market = 'US'): CompatibilityNode | null {
  return graph.nodes.find((node) => node.slug === slug && (node.market === market || node.market === 'unknown')) ?? null;
}

interface SurfaceableEdge {
  edge: CompatibilityEdge;
  confidence: ConfidenceLevel;
}

export interface VerifiedNotice {
  edgeId: string;
  relation: EdgeRelation;
  message: string;
  confidence: ConfidenceLevel;
  evidence: EvidenceLevel;
  evidenceLabel: string;
  sourceLabel: string;
}

/**
 * Fail-closed edge/ledger gate. Matching is exclusively by edgeId and exact
 * identity/provenance fields; labels and product names are never lookup keys.
 */
function surfaceableEdge(graph: CompatibilityGraph, edge: CompatibilityEdge, now: Date, visibleLocation?: string): SurfaceableEdge | null {
  const sourceNode = graph.nodes.find((node) => node.id === edge.from);
  if (!sourceNode) return null;
  if (!hasRelationCompatibleDestination(edge, graph.nodes)) return null;
  if (!isValidCompatibilityScope(edge.scope, edge, graph.nodes)) return null;

  // One edge may have a ledger row for each public surface. The requested
  // surface must have exactly one row; another surface's row never authorizes it.
  const rows = graph.ledger.filter((row) => row.edgeId === edge.id && row.visibleLocation === visibleLocation);
  if (rows.length !== 1) return null;
  const row = rows[0];
  const exactMatch = row.entityId === edge.from
    && row.entityVersion === sourceNode.version
    && row.market === edge.market
    && row.claim === edge.claim
    && row.evidence === edge.evidence
    && row.confidence === edge.confidence
    && row.validationMethod === edge.validationMethod
    && row.source.label === edge.source.label
    && row.source.url === edge.source.url
    && row.source.supplier === edge.source.supplier
    && row.source.accessedAt === edge.source.accessedAt;
  if (!exactMatch) return null;
  if (edge.confidence === 'unknown' || row.confidence === 'unknown') return null;

  if ((edge.evidence === 'hands-on-tested' && !isDocumentedHandsOnTest(edge.validationMethod))
    || (row.evidence === 'hands-on-tested' && !isDocumentedHandsOnTest(row.validationMethod))) return null;

  const edgeStatus = effectiveClaimStatus(edge, now);
  const ledgerStatus = effectiveClaimStatus({ verifiedAt: row.reviewDate, expiry: null, status: row.status }, now);
  if (!edgeStatus.surfaced || !ledgerStatus.surfaced) return null;

  return {
    edge,
    confidence: edgeStatus.confidence === 'low' || ledgerStatus.confidence === 'low'
      ? 'low'
      : edge.confidence,
  };
}

/** Active, exactly-ledger-backed edges originating from a node. */
export function activeEdgesFrom(graph: CompatibilityGraph, nodeId: string, now: Date, market?: string, visibleLocation?: string): CompatibilityEdge[] {
  return surfaceableResultsFrom(graph, nodeId, now, market, visibleLocation).map((result) => result.edge);
}

/**
 * Active, exactly-ledger-backed edge results retaining effective freshness
 * confidence for visitor-visible claims.
 */
function surfaceableResultsFrom(graph: CompatibilityGraph, nodeId: string, now: Date, market?: string, visibleLocation?: string): SurfaceableEdge[] {
  return graph.edges
    .filter((edge) => edge.from === nodeId && (market === undefined || edge.market === market))
    .map((edge) => surfaceableEdge(graph, edge, now, visibleLocation))
    .filter((result): result is SurfaceableEdge => result !== null);
}

/** Highest-evidence active edge for a given ecosystem relation from a node. */
function bestEdgeFor(graph: CompatibilityGraph, nodeId: string, targetIdentity: { id: string; type: NodeType }, now: Date, market: string, visibleLocation?: string): SurfaceableEdge | null {
  const matching = surfaceableResultsFrom(graph, nodeId, now, market, visibleLocation)
    .filter(({ edge }) => {
      const target = graph.nodes.find((node) => node.id === edge.to);
      return edge.to === targetIdentity.id
        && target?.id === targetIdentity.id
        && target.type === targetIdentity.type
        && isPositiveRelation(edge.relation);
  });
  if (!matching.length) return null;
  return matching.reduce((best, result) => (EVIDENCE_RANK[result.edge.evidence] > EVIDENCE_RANK[best.edge.evidence] ? result : best));
}

/** Active constraint edges originating from a node (requires-hub, etc.). */
function constraintEdgesFrom(graph: CompatibilityGraph, nodeId: string, now: Date, market: string, visibleLocation?: string): CompatibilityEdge[] {
  return activeEdgesFrom(graph, nodeId, now, market, visibleLocation).filter((edge) => isConstraintRelation(edge.relation));
}

// ---------------------------------------------------------------------------
// Public API: getVerifiedFlags
// ---------------------------------------------------------------------------

export interface VerifiedFlags {
  alexa: VerifiedFlag;
  google: VerifiedFlag;
  apple: VerifiedFlag;
  smartthings: VerifiedFlag;
  matter: VerifiedFlag;
  thread: VerifiedFlag;
  zigbee: VerifiedFlag;
  wifi: VerifiedFlag;
  bluetooth: VerifiedFlag;
  /** Compatible substitutes slugs (curated from `substitutes` edges). */
  substitutes: ReadonlyArray<string>;
  /** Complements (curated from `complements` edges). */
  complements: ReadonlyArray<string>;
  /** Known conflicts surfaced as visitor-visible notices. */
  conflicts: string[];
}

function allUnverified(): VerifiedFlags {
  return {
    alexa: UNVERIFIED, google: UNVERIFIED, apple: UNVERIFIED, smartthings: UNVERIFIED,
    matter: UNVERIFIED, thread: UNVERIFIED, zigbee: UNVERIFIED, wifi: UNVERIFIED, bluetooth: UNVERIFIED,
    substitutes: [], complements: [], conflicts: [],
  };
}

function flagFromEdge(result: SurfaceableEdge | null): VerifiedFlag {
  if (!result) return UNVERIFIED;
  return {
    verified: true,
    level: result.edge.evidence,
    confidence: result.confidence,
    reason: result.edge.claim,
    constraints: [],
    sourceLabel: result.edge.source.label,
  };
}

/**
 * Returns the verified flags for a product slug. When `enabled=false` (the
 * feature flag is off) every flag is `Unknown` and the resolver is inert.
 *
 * Mismatches between the visible catalog boolean and the verified flag are
 * intended: the quiz/comparison read the *verified* flag when available and
 * fall back to the catalog boolean only as "not-verified" context.
 */
export function getVerifiedFlags(
  graph: CompatibilityGraph,
  slug: string,
  options: { enabled: boolean; market?: string; now?: Date | string; visibleLocation?: string } = { enabled: false },
): VerifiedFlags {
  if (!options.enabled) return allUnverified();
  const market = options.market ?? 'US';
  const now = options.now instanceof Date ? options.now : options.now ? new Date(options.now) : new Date();
  const node = nodeBySlug(graph, slug, market);
  if (!node) return allUnverified();

  const flags: VerifiedFlags = {
    ...allUnverified(),
  };

  for (const eco of Object.keys(ECOSYSTEM_TARGET) as EcosystemFlag[]) {
    const edge = bestEdgeFor(graph, node.id, ECOSYSTEM_TARGET[eco], now, market, options.visibleLocation);
    flags[eco] = flagFromEdge(edge);
  }

  // Constraints: enrich the matching ecosystem flag with noted constraints.
  const constraints = constraintEdgesFrom(graph, node.id, now, market, options.visibleLocation);
  for (const edge of constraints) {
    const target = graph.nodes.find((node) => node.id === edge.to);
    const label = target?.label ?? edge.to;
    const notice = describeConstraint(edge.relation, label);
    if (!notice) continue;
    // Attach to ecosystem flag when it matches, else push to conflicts.
    const ecoMatch = (Object.keys(ECOSYSTEM_TARGET) as EcosystemFlag[]).find((eco) => {
      const identity = ECOSYSTEM_TARGET[eco];
      return edge.to === identity.id && target?.id === identity.id && target.type === identity.type;
    });
    if (ecoMatch && flags[ecoMatch].verified) {
      flags[ecoMatch] = { ...flags[ecoMatch], constraints: [...flags[ecoMatch].constraints, notice] };
    } else if (edge.relation === 'conflicts') {
      flags.conflicts = [...flags.conflicts, notice];
    }
  }

  // Substitutes and complements from explicit edges (name-based inference forbidden).
  const substitutes = new Set<string>();
  const complements = new Set<string>();
  for (const edge of activeEdgesFrom(graph, node.id, now, market, options.visibleLocation)) {
    if (edge.relation !== 'substitutes' && edge.relation !== 'complements') continue;
    const target = graph.nodes.find((target) => target.id === edge.to);
    if (target?.slug) {
      if (edge.relation === 'substitutes') substitutes.add(target.slug);
      if (edge.relation === 'complements') complements.add(target.slug);
    }
  }
  flags.substitutes = [...substitutes];
  flags.complements = [...complements];

  return flags;
}

/**
 * Returns visible constraints and informational notices for a product, plus
 * known conflicts. Used by comparison/product pages to disclose tradeoffs with
 * verified provenance.
 */
export function getVerifiedConstraints(
  graph: CompatibilityGraph,
  slug: string,
  options: { enabled: boolean; market?: string; now?: Date | string; visibleLocation?: string } = { enabled: false },
): { constraints: string[]; conflicts: string[]; notices: VerifiedNotice[]; hasCloudPath: boolean; requiresSubscription: boolean } {
  if (!options.enabled) return { constraints: [], conflicts: [], notices: [], hasCloudPath: false, requiresSubscription: false };
  const market = options.market ?? 'US';
  const now = options.now instanceof Date ? options.now : options.now ? new Date(options.now) : new Date();
  const node = nodeBySlug(graph, slug, market);
  if (!node) return { constraints: [], conflicts: [], notices: [], hasCloudPath: false, requiresSubscription: false };
  const active = surfaceableResultsFrom(graph, node.id, now, market, options.visibleLocation);
  const constraints: string[] = [];
  const conflicts: string[] = [];
  const notices: VerifiedNotice[] = [];
  let hasCloudPath = false;
  let requiresSubscription = false;
  for (const { edge, confidence } of active) {
    const target = graph.nodes.find((node) => node.id === edge.to);
    const label = target?.label ?? edge.to;
    const notice = describeConstraint(edge.relation, label);
    if (notice && isVisitorVisibleNoticeRelation(edge.relation)) {
      if (edge.relation === 'conflicts') conflicts.push(notice);
      else constraints.push(notice);
      notices.push({
        edgeId: edge.id,
        relation: edge.relation,
        message: notice,
        confidence,
        evidence: edge.evidence,
        evidenceLabel: EVIDENCE_LEVEL_LABELS[edge.evidence],
        sourceLabel: edge.source.label,
      });
    }
    if (edge.relation === 'cloud-only') hasCloudPath = true;
    if (edge.relation === 'requires-subscription') requiresSubscription = true;
  }
  return {
    constraints: [...new Set(constraints)],
    conflicts: [...new Set(conflicts)],
    notices: [...new Map(notices
      .sort((a, b) => a.edgeId.localeCompare(b.edgeId) || a.message.localeCompare(b.message))
      .map((notice) => [`${notice.edgeId}\u0000${notice.message}`, notice]))
      .values()],
    hasCloudPath,
    requiresSubscription,
  };
}

/**
 * Visible claim status for admin/audit display. Surfaces the resolved status
 * after freshness + explicit status are merged.
 */
export function resolveClaimStatus(
  graph: CompatibilityGraph,
  slug: string,
  options: { enabled: boolean; market?: string; now?: Date | string; visibleLocation?: string } = { enabled: false },
): ClaimStatus {
  if (!options.enabled) return 'unknown';
  const market = options.market ?? 'US';
  const now = options.now instanceof Date ? options.now : options.now ? new Date(options.now) : new Date();
  const node = nodeBySlug(graph, slug, market);
  if (!node) return 'unknown';
  const statuses: ClaimStatus[] = [];
  for (const edge of graph.edges.filter((candidate) => candidate.from === node.id && candidate.market === market)) {
    if (!hasRelationCompatibleDestination(edge, graph.nodes)) continue;
    if (!isValidCompatibilityScope(edge.scope, edge, graph.nodes)) continue;
    const rows = graph.ledger.filter((row) => row.edgeId === edge.id && row.visibleLocation === options.visibleLocation);
    if (rows.length !== 1) continue;
    const row = rows[0];
    const exactMatch = row.entityId === edge.from
      && row.entityVersion === node.version
      && row.market === edge.market
      && row.claim === edge.claim
      && row.evidence === edge.evidence
      && row.confidence === edge.confidence
      && row.validationMethod === edge.validationMethod
      && row.source.label === edge.source.label
      && row.source.url === edge.source.url
      && row.source.supplier === edge.source.supplier
      && row.source.accessedAt === edge.source.accessedAt;
    if (!exactMatch) continue;
    if (edge.confidence === 'unknown' || row.confidence === 'unknown') continue;
    const edgeStatus = effectiveClaimStatus(edge, now).status;
    const ledgerStatus = effectiveClaimStatus({ verifiedAt: row.reviewDate, expiry: null, status: row.status }, now).status;
    statuses.push(edgeStatus === 'active' ? ledgerStatus : edgeStatus);
  }
  if (statuses.includes('active')) return 'active';
  for (const status of ['disputed', 'suppressed', 'expired', 'unknown'] as const) {
    if (statuses.includes(status)) return status;
  }
  return 'unknown';
}

