/**
 * Block 9 runtime boundary for public compatibility surfaces.
 *
 * The default provider deliberately returns no graph. It never imports test
 * fixtures or connects to a source. A separately approved provider can be
 * supplied here later without changing any quiz, comparison, alternatives, or
 * product surface call path.
 */
import type { CompatibilityEnvironment } from './compatibility-adapter.ts';
import type { CompatibilityGraph } from './resolver.ts';

export type CompatibilitySurface = 'quiz' | 'comparison' | 'alternatives' | 'product';

export interface CompatibilityGraphProvider {
  getGraph(): CompatibilityGraph | null;
}

export interface CompatibilityPublicEnvironment {
  readonly [key: string]: unknown;
  PUBLIC_COMPATIBILITY_V1?: unknown;
}

const noApprovedGraphProvider: CompatibilityGraphProvider = {
  getGraph: () => null,
};

let approvedGraphProvider: CompatibilityGraphProvider = noApprovedGraphProvider;

/**
 * Installs a separately approved graph provider at the central runtime
 * boundary. Public surface paths continue to call getCompatibilityEnvironment
 * unchanged; no fixture or connector is installed by default.
 */
export function setApprovedCompatibilityGraphProvider(provider: CompatibilityGraphProvider): void {
  approvedGraphProvider = provider;
}

/** Astro exposes PUBLIC_* values as strings, so only the canonical `true` enables the feature. */
export function isCompatibilityEnabled(value: unknown): boolean {
  return value === 'true';
}

/**
 * Builds the single graph environment consumed by all public surfaces.
 * The graph remains null unless a separately approved provider is supplied.
 */
export function getCompatibilityEnvironment(
  environment: CompatibilityPublicEnvironment = import.meta.env,
  provider: CompatibilityGraphProvider = approvedGraphProvider,
): CompatibilityEnvironment {
  const enabled = isCompatibilityEnabled(environment.PUBLIC_COMPATIBILITY_V1);
  return {
    enabled,
    graph: enabled ? provider.getGraph() : null,
    market: 'US',
  };
}

/** Exact ledger location for a claim rendered by a public surface. */
export function compatibilityVisibleLocation(surface: CompatibilitySurface, slug: string): string {
  return `${surface}:${slug}:compatibility`;
}

/** Binds the shared runtime environment to one exact rendered surface location. */
export function forCompatibilitySurface(
  environment: CompatibilityEnvironment,
  surface: CompatibilitySurface,
  slug: string,
): CompatibilityEnvironment {
  return {
    ...environment,
    visibleLocation: compatibilityVisibleLocation(surface, slug),
  };
}
