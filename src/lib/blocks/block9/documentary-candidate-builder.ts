/** Builds review-only US model records; it does not validate sources or approve publication. */
import type { ClaimLedgerEntry, CompatibilityEdge, CompatibilityNode } from './domain.ts';
import type { CompatibilityGraph } from './resolver.ts';

interface DocumentaryModel {
  slug: string;
  label: string;
  claims: Array<{ target: string; source: { label: string; url: string }; claim: string }>;
}

export function buildDocumentaryModelCandidates(
  models: DocumentaryModel[],
  targets: Array<Pick<CompatibilityNode, 'id' | 'type' | 'label'>>,
  review: { reviewedAt: string; supplier: string; validationMethod: string },
): CompatibilityGraph {
  const date = review.reviewedAt.slice(0, 10);
  const expiry = new Date(Date.parse(review.reviewedAt) + 30 * 86_400_000).toISOString();
  const nodes: CompatibilityNode[] = [
    ...models.map((model): CompatibilityNode => ({ id: `p:${model.slug}`, type: 'product', slug: model.slug, label: model.label, market: 'US', marketplaceId: null, marketplaceIdType: 'unknown', version: null })),
    ...targets.map((target): CompatibilityNode => ({ ...target, slug: null, market: 'US', marketplaceId: null, marketplaceIdType: 'unknown', version: null })),
  ];
  const edges: CompatibilityEdge[] = models.flatMap(model => model.claims.map(item => ({
    id: `doc:${model.slug}:${item.target.slice(2)}:${date}`, from: `p:${model.slug}`, to: item.target,
    relation: 'works-with', claim: item.claim, market: 'US',
    scope: { productId: `p:${model.slug}`, variantId: null, generationId: null, hardwareId: null, firmwareId: null, installation: null, electrical: null, housing: null },
    source: { ...item.source, supplier: review.supplier, accessedAt: review.reviewedAt },
    verifiedAt: review.reviewedAt, confidence: 'medium', evidence: 'research-verified', validationMethod: review.validationMethod,
    expiry, status: 'active',
    reviewHistory: [{ reviewedAt: review.reviewedAt, reviewerId: 'codex-documentary-review', verdict: 'pending', note: 'Documentary candidate; owner review and public activation pending.' }],
  })));
  const ledger: ClaimLedgerEntry[] = edges.flatMap(edge => ['product', 'quiz', 'comparison', 'alternatives'].map(surface => ({
    id: `${edge.id}:${surface}`, claim: edge.claim, visibleLocation: `${surface}:${edge.from.slice(2)}:compatibility`,
    entityId: edge.from, entityVersion: null, market: edge.market, source: { ...edge.source },
    validationMethod: review.validationMethod, evidence: edge.evidence, confidence: edge.confidence, reviewDate: review.reviewedAt,
    owner: 'unassigned', status: 'active', edgeId: edge.id, history: edge.reviewHistory.map(entry => ({ ...entry })),
  })));
  return { nodes, edges, ledger };
}
