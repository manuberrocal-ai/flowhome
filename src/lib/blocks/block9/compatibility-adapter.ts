/**
 * Block 9 ? Compatibility adapter for the surface pages.
 *
 * @packageDocumentation
 *
 * Bridges the verified compatibility graph (Block 9) with the existing quiz,
 * comparison, and product surfaces that today read catalog booleans
 * (`alexaCompatible`, `matter`, ...). The adapter is strictly optional and
 * flag-gated by `PUBLIC_COMPATIBILITY_V1`:
 *
 * - When the flag is off (or no graph is provided), the adapter is inert and
 *   returns the product booleans unchanged. Existing tests and behavior are
 *   preserved exactly.
 * - When the flag is on AND a verified claim exists, the adapter overrides the
 *   catalog boolean with the verified flag and attaches provenance metadata.
 * - When the flag is on AND no verified claim exists, the adapter degrades the
 *   boolean to `undefined` (i.e. "not verified / Unknown"). The surface must
 *   not present an unverified claim as fact.
 *
 * This module never infers compatibility from product names; it reads exactly
 * the graph it is given.
 */
import type { CompatibilityGraph } from './resolver.ts';
import { getVerifiedConstraints, getVerifiedFlags, type VerifiedFlag, type VerifiedNotice } from './resolver.ts';

export interface CompatibilityEnvironment {
  /** Verified graph (Block 9). Null when no graph is available (inert path). */
  graph: CompatibilityGraph | null;
  /** True only when PUBLIC_COMPATIBILITY_V1 is on. */
  enabled: boolean;
  /** Market scope; defaults to 'US'. */
  market?: string;
  /** Optional deterministic time for tests. */
  now?: Date | string;
  /** Exact Claim Ledger location for the rendered surface. */
  visibleLocation?: string;
}

/** Catalog product shape the surface pages read today. */
export interface CatalogCompatibilityFields {
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
  matter?: boolean;
  zigbee?: boolean;
  wifi?: boolean;
  bluetooth?: boolean;
  [key: string]: unknown;
}

/** Verified-overridden product returned by the adapter. */
export type VerifiedProduct<T extends CatalogCompatibilityFields = CatalogCompatibilityFields> = T & {
  /** True when a verified graph is actively governing compatibility display. */
  compatibilityVerificationEnabled: boolean;
  /** True when at least one claim overrode a catalog boolean (provenance attached). */
  compatibilityVerified: boolean;
  /** Per-field provenance labels (source citations); null when Unknown. */
  compatibilityProvenance: Record<string, string | null>;
};

const FIELD_TO_FLAG = {
  alexaCompatible: 'alexa',
  googleHomeCompatible: 'google',
  appleHomeKit: 'apple',
  matter: 'matter',
  zigbee: 'zigbee',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
} as const;

type CatalogField = keyof typeof FIELD_TO_FLAG;
type FlagKey = typeof FIELD_TO_FLAG[CatalogField];

function toBoolean(flag: VerifiedFlag): boolean | undefined {
  if (!flag.verified) return undefined;
  return true;
}

/**
 * Returns a product with catalog booleans overridden by verified flags when
 * the flag is on. When the flag is off (or no graph), returns the product
 * unchanged with `compatibilityVerified=false`.
 *
 * Invariants:
 * - Verified claim => catalog boolean forced to true with provenance.
 * - No verified claim (flag on) => catalog boolean forced to `undefined`
 *   (Unknown), so the surface must NOT present it as fact.
 * - Flag off / no graph => catalog booleans unchanged (legacy behavior).
 */
export function applyVerifiedCompatibility<T extends CatalogCompatibilityFields>(
  product: T,
  slug: string,
  env: CompatibilityEnvironment,
): VerifiedProduct<T> {
  if (!env.enabled || !env.graph) {
    return { ...product, compatibilityVerificationEnabled: false, compatibilityVerified: false, compatibilityProvenance: {} };
  }
  const flags = getVerifiedFlags(env.graph, slug, {
    enabled: true,
    market: env.market ?? 'US',
    now: env.now,
    visibleLocation: env.visibleLocation,
  });
  const overridden: Partial<Record<CatalogField, boolean | undefined>> = {};
  const provenance: Record<string, string | null> = {};
  let anyVerified = false;
  for (const [field, flagKey] of Object.entries(FIELD_TO_FLAG) as Array<[CatalogField, FlagKey]>) {
    const flag = flags[flagKey] as VerifiedFlag;
    const value = toBoolean(flag);
    overridden[field] = value;
    provenance[field] = flag.verified ? flag.sourceLabel : null;
    if (flag.verified) anyVerified = true;
  }
  return {
    ...product,
    ...overridden,
    compatibilityVerificationEnabled: true,
    compatibilityVerified: anyVerified,
    compatibilityProvenance: provenance,
  };
}

/**
 * Returns the verified substitutes for a product slug, or an empty array when
 * the flag is off / no graph. The substitutes come only from explicit
 * `substitutes` edges (never name-based inference).
 */
export function verifiedSubstitutes(env: CompatibilityEnvironment, slug: string): ReadonlyArray<string> {
  if (!env.enabled || !env.graph) return [];
  const flags = getVerifiedFlags(env.graph, slug, {
    enabled: true,
    market: env.market ?? 'US',
    now: env.now,
    visibleLocation: env.visibleLocation,
  });
  return flags.substitutes;
}

/**
 * Returns the verified complements for a product slug, or an empty array when
 * the flag is off / no graph. The complements come only from explicit
 * `complements` edges (never name-based inference).
 */
export function verifiedComplements(env: CompatibilityEnvironment, slug: string): ReadonlyArray<string> {
  if (!env.enabled || !env.graph) return [];
  const flags = getVerifiedFlags(env.graph, slug, {
    enabled: true,
    market: env.market ?? 'US',
    now: env.now,
    visibleLocation: env.visibleLocation,
  });
  return flags.complements;
}

/** Product-page surface state with exact-location claims and structured provenance. */
export function prepareVerifiedProductCompatibility<T extends CatalogCompatibilityFields>(
  product: T,
  slug: string,
  env: CompatibilityEnvironment,
): {
  product: VerifiedProduct<T>;
  constraints: string[];
  conflicts: string[];
  notices: VerifiedNotice[];
  hasCloudPath: boolean;
  requiresSubscription: boolean;
} {
  const verifiedProduct = applyVerifiedCompatibility(product, slug, env);
  if (!env.enabled || !env.graph) {
    return {
      product: verifiedProduct,
      constraints: [],
      conflicts: [],
      notices: [],
      hasCloudPath: false,
      requiresSubscription: false,
    };
  }
  return { product: verifiedProduct, ...getVerifiedConstraints(env.graph, slug, env) };
}
