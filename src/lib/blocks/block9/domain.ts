/**
 * Block 9 — Compatibility graph & claim provenance domain contracts.
 *
 * @packageDocumentation
 *
 * Authorised compatibility model: a directed graph whose nodes are product
 * entities (product / variant / generation / hardware / firmware) and whose
 * edges are *verified* compatibility claims. Every edge carries provenance,
 * market scope, confidence, expiry, status, and a review-history trail.
 *
 * Alongside the graph sits a **Claim Ledger**: one row per public-facing claim
 * (e.g. "works with Alexa"), recording the exact claim, its visible location,
 * the entity + version it is about, the market, the source, the validation
 * method, the confidence, the review date, the owner, and a status/history.
 *
 * Evidence levels are limited to three values. `tested` is reserved for
 * documented physical hands-on testing only and must never appear without a
 * matching validation method recording that physical test.
 *
 * This module is data only — no network I/O, no scraping, no provider calls.
 * Production activation is externally blocked; the feature flag
 * `PUBLIC_COMPATIBILITY_V1` stays `off` until externally approved.
 */
import type { ConfidenceLevel, MarketCode } from '../block8/domain.ts';

// ---------------------------------------------------------------------------
// Evidence levels (closed set; "tested" requires documented physical testing)
// ---------------------------------------------------------------------------

/**
 * Closed set of evidence levels surfaced to visitors.
 *
 * - `hands-on-tested`: documented physical testing with a recorded method and
 *   date. Surfaced as "Hands-on tested".
 * - `research-verified`: corroborated against authoritative non-hands-on
 *   sources (manufacturer docs, public specs). Surfaced as "Research verified".
 * - `data-evaluated`: derived from structured data the site already holds
 *   (catalog fields, snapshots). Surfaced as "Data evaluated".
 *
 * `not-verified` is the absence of evidence and is never stored on an edge; it
 * is the default for any claim that has no ledger row.
 */
export type EvidenceLevel = 'hands-on-tested' | 'research-verified' | 'data-evaluated';

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  'hands-on-tested': 'Hands-on tested',
  'research-verified': 'Research verified',
  'data-evaluated': 'Data evaluated',
};

export const EVIDENCE_RANK: Record<EvidenceLevel, number> = {
  'hands-on-tested': 3,
  'research-verified': 2,
  'data-evaluated': 1,
};

/**
 * True only when a validation method string documents a physical test.
 * The phrase "tested" alone is explicitly NOT enough — the method must name a
 * physical/hands-on procedure and a date. This guard forbids surfacing
 * "tested" without documented physical testing.
 */
export function isDocumentedHandsOnTest(validationMethod: string | null | undefined): boolean {
  if (!validationMethod) return false;
  const v = validationMethod.toLowerCase();
  const namesPhysical = /\b(physical|hands-on|in-home|on-device|bench)\b/.test(v);
  const hasReference = /\b(test|trial|measurement|run)\b/.test(v);
  const hasDate = /\b20\d{2}\b/.test(v);
  return namesPhysical && hasReference && hasDate;
}

// ---------------------------------------------------------------------------
// Node identity
// ---------------------------------------------------------------------------

export type NodeType =
  | 'product'
  | 'variant'
  | 'generation'
  | 'hardware'
  | 'firmware'
  | 'ecosystem'
  | 'protocol'
  | 'installation'
  | 'electrical'
  | 'housing'
  | 'market'
  | 'warranty';

/** Closed vocabulary for graph node types. */
export const NODE_TYPES: ReadonlyArray<NodeType> = [
  'product', 'variant', 'generation', 'hardware', 'firmware', 'ecosystem',
  'protocol', 'installation', 'electrical', 'housing', 'market', 'warranty',
];

/** A graph node. `product` nodes align with existing catalog slugs. */
export interface CompatibilityNode {
  id: string;
  type: NodeType;
  /** Catalog slug when `type === 'product'`; otherwise a stable external id. */
  slug: string | null;
  /** Stable marketplace identifier (ASIN, SKU, GTIN) for variant nodes. */
  marketplaceId: string | null;
  marketplaceIdType: 'asin' | 'sku' | 'gtin' | 'unknown';
  /** Human-readable label for admin/audit display; not used for matching. */
  label: string;
  /** Explicit market scope, since the same product may differ across markets. */
  market: MarketCode;
  /** Free-form generation/hardware/firmware descriptor; null for ecosystems. */
  version: string | null;
}

// ---------------------------------------------------------------------------
// Edge relation vocabulary (closed set)
// ---------------------------------------------------------------------------

/**
 * Closed vocabulary of compatibility relations. Each relation carries a
 * precise meaning; no relation is inferred from product or brand names.
 *
 * - `works-with`: A (subject) works with B (object). Symmetric for surface use.
 * - `requires-hub`: A requires hub/bridge B to reach B's ecosystem.
 * - `requires-bridge`: A requires bridge B to translate between protocols.
 * - `requires-subscription`: A feature of A requires subscription/service B.
 * - `local-only`: A communicates only locally with B (no cloud dependency).
 * - `cloud-only`: A reaches B only through the vendor cloud.
 * - `complements`: A and B are commonly useful together (no guarantee).
 * - `substitutes`: A can substitute B for a use case (no guarantee unless noted).
 * - `conflicts`: A is known to conflict with B (incompatible setup/behaviour).
 */
export type EdgeRelation =
  | 'works-with'
  | 'requires-hub'
  | 'requires-bridge'
  | 'requires-subscription'
  | 'local-only'
  | 'cloud-only'
  | 'complements'
  | 'substitutes'
  | 'conflicts'
  | 'requires-installation'
  | 'requires-electrical'
  | 'requires-housing'
  | 'available-in'
  | 'warranty-covered-in';

export const EDGE_RELATIONS: ReadonlyArray<EdgeRelation> = [
  'works-with',
  'requires-hub',
  'requires-bridge',
  'requires-subscription',
  'local-only',
  'cloud-only',
  'complements',
  'substitutes',
  'conflicts',
  'requires-installation',
  'requires-electrical',
  'requires-housing',
  'available-in',
  'warranty-covered-in',
];

/** True when the relation asserts a positive compatibility band. */
export function isPositiveRelation(relation: EdgeRelation): boolean {
  return relation === 'works-with' || relation === 'local-only' || relation === 'complements'
    || relation === 'available-in' || relation === 'warranty-covered-in';
}

/** True when the relation asserts an explicit constraint or conflict. */
export function isConstraintRelation(relation: EdgeRelation): boolean {
  return relation === 'requires-hub' || relation === 'requires-bridge'
    || relation === 'requires-subscription' || relation === 'cloud-only'
    || relation === 'conflicts' || relation === 'requires-installation'
    || relation === 'requires-electrical' || relation === 'requires-housing';
}

/** True when a relation must surface as a visitor-visible compatibility notice. */
export function isVisitorVisibleNoticeRelation(relation: EdgeRelation): boolean {
  return isConstraintRelation(relation)
    || relation === 'available-in' || relation === 'warranty-covered-in';
}

// ---------------------------------------------------------------------------
// Review history entry (append-only per edge)
// ---------------------------------------------------------------------------

export type ClaimStatus = 'active' | 'suppressed' | 'disputed' | 'expired' | 'unknown';

export interface ClaimReviewEntry {
  /** UTC instant of the review action. */
  reviewedAt: string;
  /** Reviewer id; unresolved maps to the editorial-team fallback. */
  reviewerId: string;
  /** Verdict applied at review time. */
  verdict: 'approved' | 'rejected' | 'pending' | 'overridden';
  /** Short note (no PII); recorded verbatim on the audit trail. */
  note: string | null;
}

// ---------------------------------------------------------------------------
// Compatibility edge scope and verified graph edge
// ---------------------------------------------------------------------------

/**
 * Explicit entity and text constraints for an edge. Scope is distinct from the
 * edge market: it states precisely which product version and physical setup a
 * claim applies to. Labels are never used to construct or validate scope.
 */
export interface CompatibilityScope {
  productId: string | null;
  variantId: string | null;
  generationId: string | null;
  hardwareId: string | null;
  firmwareId: string | null;
  installation: string | null;
  electrical: string | null;
  housing: string | null;
}

const COMPATIBILITY_SCOPE_KEYS = [
  'productId', 'variantId', 'generationId', 'hardwareId', 'firmwareId',
  'installation', 'electrical', 'housing',
] as const;

const SCOPE_ENTITY_NODE_TYPES: Record<
  'productId' | 'variantId' | 'generationId' | 'hardwareId' | 'firmwareId',
  NodeType
> = {
  productId: 'product',
  variantId: 'variant',
  generationId: 'generation',
  hardwareId: 'hardware',
  firmwareId: 'firmware',
};

const SETUP_SCOPE_NODE_TYPES: Record<'installation' | 'electrical' | 'housing', NodeType> = {
  installation: 'installation',
  electrical: 'electrical',
  housing: 'housing',
};

const RELATION_TARGET_NODE_TYPES: Record<EdgeRelation, ReadonlyArray<NodeType>> = {
  'works-with': ['ecosystem', 'protocol'],
  'requires-hub': ['hardware'],
  'requires-bridge': ['hardware'],
  'requires-subscription': ['ecosystem'],
  'local-only': ['ecosystem', 'protocol'],
  'cloud-only': ['ecosystem', 'protocol'],
  'complements': ['product', 'hardware'],
  'substitutes': ['product'],
  'conflicts': ['product', 'hardware', 'ecosystem', 'protocol'],
  'requires-installation': ['installation'],
  'requires-electrical': ['electrical'],
  'requires-housing': ['housing'],
  'available-in': ['market'],
  'warranty-covered-in': ['warranty'],
};

/**
 * True only when an edge points at an existing node whose type is permitted by
 * its closed relation vocabulary. Display labels never authorize a target.
 */
export function hasRelationCompatibleDestination(
  edge: Pick<CompatibilityEdge, 'to' | 'relation'>,
  nodes: ReadonlyArray<CompatibilityNode>,
): boolean {
  const target = nodes.find((node) => node.id === edge.to);
  return target != null && RELATION_TARGET_NODE_TYPES[edge.relation].includes(target.type);
}

/**
 * Runtime guard for untrusted fixture/graph data. A valid scope has exactly
 * the required nullable fields, typed entity references, and explicitly binds
 * the edge subject to one scoped entity. It deliberately performs no matching
 * by label, slug, or other display text.
 */
export function isValidCompatibilityScope(
  scope: unknown,
  edge: Pick<CompatibilityEdge, 'from' | 'to' | 'relation'>,
  nodes: ReadonlyArray<CompatibilityNode>,
): scope is CompatibilityScope {
  if (!scope || typeof scope !== 'object' || Array.isArray(scope)) return false;
  const candidate = scope as Record<string, unknown>;
  const keys = Object.keys(candidate);
  if (keys.length !== COMPATIBILITY_SCOPE_KEYS.length
    || !COMPATIBILITY_SCOPE_KEYS.every((key) => Object.hasOwn(candidate, key))) return false;

  const scopedIds: string[] = [];
  for (const [key, nodeType] of Object.entries(SCOPE_ENTITY_NODE_TYPES) as Array<[keyof typeof SCOPE_ENTITY_NODE_TYPES, NodeType]>) {
    const value = candidate[key];
    if (value !== null && typeof value !== 'string') return false;
    if (typeof value === 'string') {
      const node = nodes.find((entry) => entry.id === value);
      if (!node || node.type !== nodeType) return false;
      scopedIds.push(value);
    }
  }
  for (const key of ['installation', 'electrical', 'housing'] as const) {
    const value = candidate[key];
    if (value !== null && typeof value !== 'string') return false;
    if (typeof value === 'string') {
      const target = nodes.find((node) => node.id === value);
      const requiredRelation = `requires-${key}` as EdgeRelation;
      if (!target || target.type !== SETUP_SCOPE_NODE_TYPES[key]
        || edge.to !== value || edge.relation !== requiredRelation) return false;
    }
  }
  return scopedIds.length > 0 && scopedIds.includes(edge.from);
}

/**
 * A verified compatibility edge. Every required provenance field is non-null
 * on a stored edge; the builder rejects edges missing any of them.
 */
export interface CompatibilityEdge {
  id: string;
  /** Subject node id. */
  from: string;
  /** Object node id. */
  to: string;
  relation: EdgeRelation;
  /** Exact claim text shown when the edge is surfaced. */
  claim: string;
  /** Market the edge applies to; `unknown` edges never surface as fact. */
  market: MarketCode;
  /** Explicit entity/version/setup scope, validated before an edge may surface. */
  scope: CompatibilityScope;
  /** Provenance: source label + URL + supplier name. */
  source: ClaimSource;
  /** UTC instant the edge was verified against the source. */
  verifiedAt: string;
  /** Confidence band; `unknown` edges never surface as fact. */
  confidence: ConfidenceLevel;
  /** Evidence level backing the claim. */
  evidence: EvidenceLevel;
  /** Free-form method describing how the claim was validated (audit only). */
  validationMethod: string;
  /** UTC instant at or after which the edge expires and cannot surface. */
  expiry: string | null;
  /** Lifecycle status of the claim. */
  status: ClaimStatus;
  /** Append-only review history for the edge. */
  reviewHistory: ClaimReviewEntry[];
}

export interface ClaimSource {
  /** Display label for the source (e.g. "Amazon product page"). */
  label: string;
  /** HTTPS URL of the authoritative page; never a retailer search URL. */
  url: string;
  /** Supplier/owner of the source data (manufacturer, vendor, editorial). */
  supplier: string;
  /** UTC instant the source was last fetched/confirmed. */
  accessedAt: string;
}

// ---------------------------------------------------------------------------
// Claim Ledger — every public-facing claim has one row
// ---------------------------------------------------------------------------

/**
 * One row in the Claim Ledger. The `claim` is the exact text a visitor can see
 * on a page; `visibleLocation` records where it appears. The ledger is the
 * single source of truth: visible content and schema must agree, and a claim
 * with no ledger row cannot surface.
 */
export interface ClaimLedgerEntry {
  id: string;
  /** Exact claim text as it appears to visitors. */
  claim: string;
  /** Where the claim is visible: a page area identifier (e.g. "product:ecobee:ecosystem-chip"). */
  visibleLocation: string;
  /** Node id the claim is about. */
  entityId: string;
  /** Node version label (firmware/hardware/generation) the claim is bound to. */
  entityVersion: string | null;
  market: MarketCode;
  source: ClaimSource;
  /** Method used to validate the claim (audit + admin review only). */
  validationMethod: string;
  /** Evidence level backing the claim. */
  evidence: EvidenceLevel;
  confidence: ConfidenceLevel;
  /** UTC instant the claim was last reviewed. */
  reviewDate: string;
  /** Owner id responsible for the claim; unresolved maps to editorial-team. */
  owner: string;
  status: ClaimStatus;
  /** Append-only history of status changes and admin actions. */
  history: ClaimReviewEntry[];
  /** Edge id backing this ledger row, when the claim is a graph edge. */
  edgeId: string | null;
}

// ---------------------------------------------------------------------------
// Admin review/override contract (mirrors Block 8 audit discipline)
// ---------------------------------------------------------------------------

export type ClaimAdminAction =
  | 'approve'
  | 'suppress'
  | 'dispute'
  | 'expire_now'
  | 'reinstate'
  | 'reset';

export interface ClaimAdminAuditEntry {
  id: string;
  /** Target ledger entry id or edge id. */
  targetId: string;
  targetType: 'claim' | 'edge';
  action: ClaimAdminAction;
  fields: string[];
  note: string | null;
  actorId: string;
  recordedAt: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Strict-UTC helpers (forwarded from Block 8 for single-source of truth)
// ---------------------------------------------------------------------------

export { toStrictUtc, nowUtc } from '../block8/domain.ts';
export type { ConfidenceLevel, MarketCode } from '../block8/domain.ts';

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/**
 * Freshness windows for compatibility claims. A claim is fresh within
 * `claim` and stale after; expired or disputed claims degrade or disappear.
 */
export const CLAIM_FRESHNESS_WINDOWS_MS = {
  /** Claim freshness: a verified claim stays fresh for 180 days. */
  claim: 180 * 24 * 60 * 60 * 1000,
  /** Field data stays fresh for 90 days (shorter than direct claims). */
  field: 90 * 24 * 60 * 60 * 1000,
} as const;

/** Markets supported by Block 9 (forwarded from Block 8 for clarity). */
export const SUPPORTED_MARKETS: ReadonlyArray<MarketCode> = ['US', 'CA', 'MX', 'GB', 'DE', 'ES'];

/** Default owner for claims with no explicit owner. */
export const DEFAULT_CLAIM_OWNER = 'flowhome-editorial-team';
