export interface FeatureEvidenceState {
  wifi?: boolean;
  bluetooth?: boolean;
  zigbee?: boolean;
  matter?: boolean;
  thread?: boolean;
  smartthingsIntegration?: boolean;
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
  energyMonitoring?: boolean;
  compatibilityVerificationEnabled?: boolean;
  compatibilityProvenance?: Record<string, string | null>;
  compatibilityConditions?: Record<string, string | null>;
}

const compatibilityFields = new Set(['wifi', 'bluetooth', 'zigbee', 'matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'thread', 'smartthingsIntegration']);

/** Checks prepared per-field metadata, not the underlying graph's validity. */
export function hasFeatureEvidence(product: FeatureEvidenceState, field: string): boolean {
  const source = product.compatibilityProvenance?.[field];
  const conditions = product.compatibilityConditions?.[field];
  return compatibilityFields.has(field) && product.compatibilityVerificationEnabled === true
    && (product as Record<string, unknown>)[field] === true
    && typeof source === 'string' && source.trim().length > 0
    && typeof conditions === 'string' && conditions.trim().length > 0;
}

/** Formats data already prepared by the surface adapter; does not validate a graph or its sources. */
export function getFeatureEvidenceLabel(product: FeatureEvidenceState, field: string): string {
  const value = (product as Record<string, unknown>)[field];
  if (compatibilityFields.has(field) && product.compatibilityVerificationEnabled === true) {
    const conditions = product.compatibilityConditions?.[field];
    return hasFeatureEvidence(product, field) ? `Evidence-backed signal: ${conditions}` : 'Not verified';
  }
  return typeof value === 'boolean' ? `Catalog: ${value ? 'Yes' : 'No'} (unverified)` : 'Not verified';
}
