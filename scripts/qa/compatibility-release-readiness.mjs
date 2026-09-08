import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { documentaryCandidateProvider, DOCUMENTARY_CANDIDATE_STATUS } from '../../src/lib/blocks/block9/documentary-provider.ts';
import { activeEdgesFrom } from '../../src/lib/blocks/block9/resolver.ts';
import { compatibilityCoverage, readCoverageCatalog } from './compatibility-coverage.mjs';

const surfaces = ['product', 'quiz', 'comparison', 'alternatives'];
const assigned = value => typeof value === 'string' && value.trim().length > 0 && value.trim() !== 'unassigned';

function hasRecordedApproval(history, now, evidenceDate) {
  if (!Array.isArray(history) || history.length === 0) return false;
  // History order is append-only. A later rejection/pending entry supersedes approval.
  const latest = history.at(-1);
  const reviewedAt = Date.parse(latest?.reviewedAt);
  return latest?.verdict === 'approved' && assigned(latest.reviewerId)
    && Number.isFinite(reviewedAt) && reviewedAt >= Date.parse(evidenceDate) && reviewedAt <= now;
}

/** Read-only review packet. A reviewer name is not authenticated authorization. */
export function compatibilityReleaseReadiness(catalog, graph, now = new Date(), declared = DOCUMENTARY_CANDIDATE_STATUS) {
  const date = new Date(now);
  const coverage = compatibilityCoverage(catalog, graph, date, declared);
  // Order-sensitive snapshot identity, not a commit SHA or a signature of approval.
  const candidateSha256 = createHash('sha256').update(JSON.stringify(graph)).digest('hex');
  const unresolvedIdentity = graph.nodes.filter(node => node.type === 'product'
    && (!node.marketplaceId || node.marketplaceIdType === 'unknown' || !node.version)).map(node => node.id);
  const unreviewedEdges = graph.edges.filter(edge => !hasRecordedApproval(edge.reviewHistory, date.getTime(), edge.verifiedAt)).map(edge => edge.id);
  const unreviewedLocations = graph.ledger.filter(row => !hasRecordedApproval(row.history, date.getTime(), row.reviewDate)).map(row => row.id);
  const unassignedLocations = graph.ledger.filter(row => !assigned(row.owner)).map(row => row.id);
  const unavailableLocations = graph.edges.flatMap(edge => surfaces.filter(surface => !activeEdgesFrom(
    graph, edge.from, date, edge.market, `${surface}:${edge.from.slice(2)}:compatibility`,
  ).some(active => active.id === edge.id)).map(surface => ({ edgeId: edge.id, surface })));
  return {
    schemaVersion: 1, asOf: date.toISOString(), candidateSha256,
    scope: 'Internal snapshot review packet only. Recorded reviews are untrusted assertions until authenticated externally; no account, provider, runtime or deployment is changed.',
    publicationAuthorized: false, canInstallProvider: false,
    counts: { models: coverage.summary.candidateModels, relations: graph.edges.length, locations: graph.ledger.length,
      unresolvedIdentity: unresolvedIdentity.length, unreviewedEdges: unreviewedEdges.length,
      unreviewedLocations: unreviewedLocations.length, unassignedLocations: unassignedLocations.length,
      unavailableLocations: unavailableLocations.length },
    structuralErrors: coverage.errors,
    unresolvedIdentity, unreviewedEdges, unreviewedLocations, unassignedLocations, unavailableLocations,
    researchQueue: coverage.researchQueue,
    requiredExternalGates: [
      'Authenticate the owner/reviewer and approve this exact candidate snapshot and its per-surface qualified wording.',
      'Resolve seller identity, hardware/firmware and setup scope, or explicitly approve a restricted model-only presentation.',
      'Approve a server integration and verify rendered Astro pages without shipping the review graph to clients.',
      'Bind the approved candidate to the exact source/build artifact, destination and rollback; authorize publication separately.',
    ],
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = compatibilityReleaseReadiness(readCoverageCatalog(), documentaryCandidateProvider.getGraph());
  console.log(JSON.stringify(report, null, 2));
  // This command cannot act as a passing deployment gate: authentication is external.
  process.exitCode = 2;
}
