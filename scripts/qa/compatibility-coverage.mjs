import { readFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { documentaryCandidateProvider, DOCUMENTARY_CANDIDATE_STATUS } from '../../src/lib/blocks/block9/documentary-provider.ts';
import { getVerifiedFlags } from '../../src/lib/blocks/block9/resolver.ts';

const fields = ['alexa', 'google', 'apple', 'smartthings', 'matter', 'thread', 'zigbee', 'wifi', 'bluetooth'];
const surfaces = ['product', 'quiz', 'comparison', 'alternatives'];
const catalogFieldNames = {
  alexa: 'alexaCompatible', google: 'googleHomeCompatible', apple: 'appleHomeKit',
  smartthings: 'smartthingsIntegration', matter: 'matter', thread: 'thread',
  zigbee: 'zigbee', wifi: 'wifi', bluetooth: 'bluetooth',
};

/** Read-only accounting, not source truth, activation or hardware certification. */
export function compatibilityCoverage(catalog, graph, now = new Date(), declared = {}) {
  const asOf = new Date(now).toISOString();
  const errors = [];
  const catalogSlugs = catalog.map(product => product.slug);
  if (new Set(catalogSlugs).size !== catalogSlugs.length) errors.push('duplicate-catalog-slug');
  for (const collection of ['nodes', 'edges', 'ledger']) {
    if (new Set(graph[collection].map(row => row.id)).size !== graph[collection].length) errors.push(`duplicate-${collection}-id`);
  }
  const products = [...catalog].sort((a, b) => a.slug.localeCompare(b.slug)).map(product => {
    const edges = graph.edges.filter(edge => edge.from === `p:${product.slug}`);
    const bySurface = Object.fromEntries(surfaces.map(surface => {
      const flags = getVerifiedFlags(graph, product.slug, { enabled: true, market: 'US', now: asOf, visibleLocation: `${surface}:${product.slug}:compatibility` });
      const resolved = fields.filter(field => flags[field].verified);
      return [surface, { resolved, unknown: fields.filter(field => !flags[field].verified) }];
    }));
    const allSurfaces = fields.filter(field => surfaces.every(surface => bySurface[surface].resolved.includes(field)));
    // Raw booleans only prioritize research. They never participate in resolution.
    const rawCatalogAffirmations = fields.filter(field => product.catalogSignals?.[field] === true);
    const unresolvedCatalogAffirmations = rawCatalogAffirmations.filter(field => !allSurfaces.includes(field)).map(field => ({
      field, catalogField: catalogFieldNames[field],
      missingSurfaces: surfaces.filter(surface => !bySurface[surface].resolved.includes(field)),
    }));
    const rawNegationsWithCandidateSignals = fields.filter(field => product.catalogSignals?.[field] === false
      && surfaces.some(surface => bySurface[surface].resolved.includes(field)));
    return {
      slug: product.slug, category: product.category, model: product.model ?? null,
      candidateRelations: edges.length, allSurfaces, bySurface,
      rawCatalogAffirmations, unresolvedCatalogAffirmations, rawNegationsWithCandidateSignals,
      sources: [...new Set(edges.map(edge => edge.source.url))].sort(),
      earliestReviewDue: edges.map(edge => edge.expiry).filter(Boolean).sort()[0] ?? null,
    };
  });
  const orphanModels = graph.nodes.filter(node => node.type === 'product' && !catalogSlugs.includes(node.slug)).map(node => node.slug);
  if (orphanModels.length) errors.push('candidate-model-outside-catalog');
  const incompleteLocations = graph.edges.flatMap(edge => surfaces
    .filter(surface => !graph.ledger.some(row => row.edgeId === edge.id && row.visibleLocation === `${surface}:${edge.from.slice(2)}:compatibility`))
    .map(surface => ({ edgeId: edge.id, surface })));
  if (incompleteLocations.length) errors.push('missing-ledger-location');
  const candidateModels = products.filter(product => product.candidateRelations > 0).length;
  if (declared.coveredModels !== undefined && declared.coveredModels !== candidateModels) errors.push('declared-model-count-mismatch');
  if (declared.catalogModels !== undefined && declared.catalogModels !== catalog.length) errors.push('declared-catalog-count-mismatch');
  const researchQueue = products.filter(product => product.unresolvedCatalogAffirmations.length > 0
    || product.rawNegationsWithCandidateSignals.length > 0).map(product => ({
    slug: product.slug,
    unresolvedAffirmations: product.unresolvedCatalogAffirmations,
    negationsWithCandidateSignals: product.rawNegationsWithCandidateSignals,
  }));
  return {
    asOf, scope: 'Documentary candidate only; unknown is not incompatible. Resolved evidence is not publication approval, seller-variant matching or a physical test.',
    publicActivation: declared.publicActivation ?? 'not_assessed',
    researchQueueScope: 'Raw catalog booleans are unverified research leads, not public-render records. Missing or false is not proof of incompatibility; qualified candidate signals may differ in scope. This queue does not audit prose, certify variants or rank commercial value.',
    summary: { catalogModels: catalog.length, candidateModels, uncoveredModels: catalog.length - candidateModels,
      modelsWithCurrentSignalsOnAllSurfaces: products.filter(product => product.allSurfaces.length > 0).length,
      relations: graph.edges.length, proposedLocations: graph.ledger.length,
      rawCatalogAffirmations: products.reduce((sum, product) => sum + product.rawCatalogAffirmations.length, 0),
      unresolvedCatalogAffirmations: products.reduce((sum, product) => sum + product.unresolvedCatalogAffirmations.length, 0),
      rawNegationsWithCandidateSignals: products.reduce((sum, product) => sum + product.rawNegationsWithCandidateSignals.length, 0),
      resolvedFieldLocations: products.reduce((sum, product) => sum + surfaces.reduce((count, surface) => count + product.bySurface[surface].resolved.length, 0), 0) },
    uncovered: products.filter(product => product.candidateRelations === 0).map(product => product.slug),
    categoriesWithoutCandidate: [...new Set(products.map(product => product.category))].filter(category => !products.some(product => product.category === category && product.candidateRelations > 0)).sort(),
    errors, orphanModels, incompleteLocations, researchQueue, products,
  };
}

export function readCoverageCatalog() {
  const directory = new URL('../../src/content/products/', import.meta.url);
  return readdirSync(directory).filter(file => file.endsWith('.yaml')).map(file => {
    const data = parse(readFileSync(new URL(file, directory), 'utf8'));
    const { slug, category, model } = data;
    const catalogSignals = Object.fromEntries(Object.entries(catalogFieldNames)
      .filter(([, field]) => typeof data[field] === 'boolean')
      .map(([field, catalogField]) => [field, data[catalogField]]));
    return { slug, category, model, catalogSignals };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = compatibilityCoverage(readCoverageCatalog(), documentaryCandidateProvider.getGraph(), new Date(), DOCUMENTARY_CANDIDATE_STATUS);
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
