/**
 * Block 9 — Fixture loader for tests. Reads the synthetic compatibility
 * graph + ledger from `data/blocks/block9/fixtures.json`. Production data
 * activation is blocked; no production data is loaded here.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as resolvePath } from 'node:path';
import type { CompatibilityGraph } from './resolver.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesPath = resolvePath(here, '..', '..', '..', '..', 'data', 'blocks', 'block9', 'fixtures.json');

/** Loads the synthetic Block 9 fixtures as a typed graph (tests only). */
export function loadBlock9Fixtures(): CompatibilityGraph {
  const raw = JSON.parse(readFileSync(fixturesPath, 'utf8')) as { nodes: unknown[]; edges: unknown[]; ledger: unknown[] };
  return {
    nodes: raw.nodes as never,
    edges: raw.edges as never,
    ledger: raw.ledger as never,
  };
}
