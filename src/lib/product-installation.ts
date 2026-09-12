/** Editorial setup assessment, separate from manufacturer requirements and commerce. */
export type InstallationLevel = 'plug-and-play' | 'light-setup' | 'advanced';

export interface InstallationEvidence {
  model: string;
  market: 'US';
  assessment: InstallationLevel;
  summary?: string;
  requirements: string[];
  sources: Array<{ label: string; url: string; accessedAt: string }>;
}

export const INSTALLATION_LABELS: Record<InstallationLevel, string> = {
  'plug-and-play': 'Power and app setup',
  'light-setup': 'Mounting or guided setup',
  advanced: 'Wiring or detailed installation checks',
};

const levels: Record<InstallationLevel, number> = { 'plug-and-play': 0, 'light-setup': 1, advanced: 2 };
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** Missing or mismatched model evidence stays unknown, never a category-based estimate. */
export function getInstallationEvidence(product: { model?: unknown; installation?: unknown }, now = new Date()): InstallationEvidence | null {
  const input = product.installation;
  if (!input || typeof input !== 'object' || !text(product.model) || !Number.isFinite(now.getTime())) return null;
  const data = input as Partial<InstallationEvidence>;
  if (data.model !== product.model || data.market !== 'US' || !Object.hasOwn(levels, data.assessment ?? '')) return null;
  if (!Array.isArray(data.requirements) || data.requirements.length === 0 || !data.requirements.every(text)) return null;
  if (!Array.isArray(data.sources) || data.sources.length === 0) return null;
  for (const source of data.sources) {
    if (!source || !text(source.label) || !text(source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt ?? '')) return null;
    const date = new Date(`${source.accessedAt}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== source.accessedAt || date > now) return null;
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    } catch { return null; }
  }
  return data as InstallationEvidence;
}

/** An editorial summary never bypasses the model/source gate; legacy records keep the complete first check. */
export function getInstallationSummary(evidence: InstallationEvidence | null): string | null {
  if (!evidence) return null;
  return text(evidence.summary) ? evidence.summary : evidence.requirements[0];
}

/** A preference is the maximum accepted effort; unknown is not evidence of a fit. */
export function matchesInstallationPreference(product: { model?: unknown; installation?: unknown }, preference: InstallationLevel, now = new Date()): boolean {
  const evidence = getInstallationEvidence(product, now);
  return evidence !== null && Object.hasOwn(levels, preference) && levels[evidence.assessment] <= levels[preference];
}
