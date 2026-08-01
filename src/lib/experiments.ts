import { hasAnalyticsConsent } from './consent';
import { getAnalyticsClientId, queueEvent } from './analytics';

export type ExperimentState = 'draft' | 'active' | 'paused' | 'killed';
export type EvaluationStatus = 'unknown_insufficient_evidence' | 'stopped_guardrail' | 'ready_for_human_review';
export type Variant = { id: string; copy?: string };
export type ExperimentDefinition = {
  id: string;
  version: string;
  state: ExperimentState;
  mutualExclusionGroup: string;
  segment: { market: string; pageType: string; consent: 'accepted' };
  minDays: number;
  minConversionsPerArm: number;
  variants: readonly Variant[];
  selector: string;
};

export const HOME_PRIMARY_CTA_EXPERIMENT: ExperimentDefinition = {
  id: 'home_primary_cta_v1', version: 'v1', state: 'draft', mutualExclusionGroup: 'home-primary-cta',
  segment: { market: 'US', pageType: 'home', consent: 'accepted' }, minDays: 14, minConversionsPerArm: 30,
  variants: [{ id: 'control', copy: 'Find my setup' }, { id: 'treatment', copy: 'Get a shortlist for my home' }], selector: '[data-fh-home-primary-cta]',
};
export const EXPERIMENT_REGISTRY = Object.freeze([HOME_PRIMARY_CTA_EXPERIMENT]);
export const EXPERIMENT_STORAGE_KEY = 'flowhome-experiment-exposures-v1';
export const EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY = 'flowhome-experiment-runtime-v1';

type Exposure = {
  experiment_id: string;
  assignment_version: string;
  variant_id: string;
  mutual_exclusion_group: string;
  assignment_bucket: number;
};
type QueuedExposure = Exposure & { dispatch_state: 'queued' };

export function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
export function assignmentBucket(input: string) { return stableHash(input) % 10000; }

function getStorage() { try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; } }
function getRuntimeStorage() { try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; } }
function exposureShape(entry: unknown): entry is QueuedExposure {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
  const value = entry as Record<string, unknown>;
  const assignmentBucket = value.assignment_bucket;
  return Object.keys(value).sort().join(',') === 'assignment_bucket,assignment_version,dispatch_state,experiment_id,mutual_exclusion_group,variant_id' &&
    typeof value.experiment_id === 'string' && typeof value.assignment_version === 'string' && typeof value.variant_id === 'string' && typeof value.mutual_exclusion_group === 'string' && value.dispatch_state === 'queued' && typeof assignmentBucket === 'number' && Number.isInteger(assignmentBucket) && assignmentBucket >= 0 && assignmentBucket <= 9999;
}
function readExposures(storage: Storage | null = getStorage()): QueuedExposure[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(EXPERIMENT_STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed) || parsed.some((entry) => !exposureShape(entry))) throw new Error('invalid exposure store');
    return parsed;
  } catch { try { storage.removeItem(EXPERIMENT_STORAGE_KEY); } catch { /* Optional storage is untrusted. */ } return []; }
}
function hasExactQueuedExposure(expected: Exposure, storage = getStorage()) {
  return readExposures(storage).some((entry) => entry.experiment_id === expected.experiment_id && entry.assignment_version === expected.assignment_version && entry.variant_id === expected.variant_id && entry.mutual_exclusion_group === expected.mutual_exclusion_group && entry.assignment_bucket === expected.assignment_bucket);
}
function discardMismatchedExposure(expected: Exposure, storage = getStorage()) {
  if (!storage) return;
  const values = readExposures(storage);
  const remaining = values.filter((entry) => entry.experiment_id !== expected.experiment_id || entry.assignment_version !== expected.assignment_version || (entry.variant_id === expected.variant_id && entry.mutual_exclusion_group === expected.mutual_exclusion_group && entry.assignment_bucket === expected.assignment_bucket));
  if (remaining.length !== values.length) { try { storage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(remaining)); } catch { /* Optional storage. */ } }
}
function writeQueuedExposure(exposure: Exposure, storage = getStorage()) {
  if (!storage) return false;
  const values = readExposures(storage);
  try { storage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify([...values, { ...exposure, dispatch_state: 'queued' }].slice(-50))); return true; } catch { return false; }
}
export function clearExperimentExposures(storage = getStorage()) { try { storage?.removeItem(EXPERIMENT_STORAGE_KEY); } catch { /* Optional storage. */ } }

/** Local-only, fail-closed runtime kill switch. Missing or malformed config is off. */
export function isExperimentRuntimeEnabled(storage = getRuntimeStorage()) {
  if (!storage) return false;
  try {
    const config = JSON.parse(storage.getItem(EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY) || 'null');
    return Boolean(config && typeof config === 'object' && !Array.isArray(config) && Object.keys(config).length === 1 && config.enabled === true);
  } catch { return false; }
}
export function setExperimentRuntimeEnabled(enabled: boolean, storage = getRuntimeStorage()) {
  if (!storage) return false;
  try { storage.setItem(EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify({ enabled: Boolean(enabled) })); return true; } catch { return false; }
}

/** A queued exposure is local queue evidence, never a provider-delivery claim. */
export function getQueuedExperimentExposureScope(storage = getStorage()) {
  const exposure = readExposures(storage).sort((a, b) => a.experiment_id.localeCompare(b.experiment_id))[0];
  return exposure ? `${exposure.experiment_id}-${exposure.assignment_version}-${exposure.variant_id}-${exposure.assignment_bucket}` : 'no-exposure';
}

export function resolveAssignments(experiments: readonly ExperimentDefinition[], clientId: string, context: { market: string; pageType: string; consent: boolean }) {
  if (!clientId || !context.consent) return [];
  const groups = new Set<string>();
  return [...experiments].sort((a, b) => a.id.localeCompare(b.id)).flatMap((experiment) => {
    if (experiment.state !== 'active' || experiment.segment.market.toLowerCase() !== context.market.toLowerCase() || experiment.segment.pageType !== context.pageType || groups.has(experiment.mutualExclusionGroup)) return [];
    groups.add(experiment.mutualExclusionGroup);
    const bucket = assignmentBucket(`${experiment.id}:${experiment.version}:${clientId}`);
    return [{ experiment, variant: experiment.variants[Math.min(experiment.variants.length - 1, Math.floor(bucket / 10000 * experiment.variants.length))], bucket }];
  });
}

export function evaluateExperiment(experiment: Pick<ExperimentDefinition, 'minDays' | 'minConversionsPerArm'>, evidence: { days?: number; controlQuizComplete?: number; treatmentQuizComplete?: number; controlExposures?: number; treatmentExposures?: number; protectionMetricsConfirmed?: boolean; guardrailBreached?: boolean }) {
  if (evidence.guardrailBreached) return { status: 'stopped_guardrail' as EvaluationStatus };
  const control = evidence.controlExposures || 0;
  const treatment = evidence.treatmentExposures || 0;
  const balanced = control + treatment > 0 && control / (control + treatment) >= 0.45 && control / (control + treatment) <= 0.55;
  if ((evidence.days || 0) < experiment.minDays || (evidence.controlQuizComplete || 0) < experiment.minConversionsPerArm || (evidence.treatmentQuizComplete || 0) < experiment.minConversionsPerArm || !balanced || !evidence.protectionMetricsConfirmed) return { status: 'unknown_insufficient_evidence' as EvaluationStatus };
  return { status: 'ready_for_human_review' as EvaluationStatus };
}

type SetupOptions = { registry?: readonly ExperimentDefinition[]; queue?: typeof queueEvent };
type Runtime = Window & { __flowhomeExperimentsRuntime?: { rollback: () => void; refresh: () => void; setEnabled: (enabled: boolean) => boolean } };

function applyVariant(experiment: ExperimentDefinition, variant: Variant) {
  const elements = [...document.querySelectorAll<HTMLElement>(experiment.selector)];
  const previous = elements.map((element) => ({ element, text: element.textContent, id: element.getAttribute('data-experiment-id'), variant: element.getAttribute('data-experiment-variant'), version: element.getAttribute('data-assignment-version'), assignment: element.getAttribute('data-experiment-assignment-state'), queue: element.getAttribute('data-experiment-queue-state') }));
  elements.forEach((element) => { if (variant.copy !== undefined) element.textContent = variant.copy; element.setAttribute('data-experiment-id', experiment.id); element.setAttribute('data-experiment-variant', variant.id); element.setAttribute('data-assignment-version', experiment.version); element.setAttribute('data-experiment-assignment-state', 'eligible'); });
  return { elements, undo: () => previous.forEach(({ element, text, id, variant: oldVariant, version, assignment, queue }) => { element.textContent = text; for (const [key, value] of [['data-experiment-id', id], ['data-experiment-variant', oldVariant], ['data-assignment-version', version], ['data-experiment-assignment-state', assignment], ['data-experiment-queue-state', queue]] as const) { if (value === null) element.removeAttribute(key); else element.setAttribute(key, value); } }) };
}

export function setupExperiments({ registry = EXPERIMENT_REGISTRY, queue = queueEvent }: SetupOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
  const runtime = window as Runtime;
  if (runtime.__flowhomeExperimentsRuntime) return runtime.__flowhomeExperimentsRuntime.rollback;
  const undoAll: Array<() => void> = [];
  const rollback = () => { undoAll.splice(0).forEach((undo) => undo()); };
  const run = () => {
    rollback();
    const body = document.body;
    if (!isExperimentRuntimeEnabled() || body.dataset.funnelExperimentV1 !== 'on' || body.dataset.homePrimaryCtaV1 !== 'on' || !hasAnalyticsConsent()) return;
    const assignments = resolveAssignments(registry, getAnalyticsClientId() || '', { market: document.documentElement.dataset.market || body.dataset.market || '', pageType: body.dataset.pageType || '', consent: true });
    for (const { experiment, variant, bucket } of assignments) {
      const expected: Exposure = { experiment_id: experiment.id, assignment_version: experiment.version, variant_id: variant.id, mutual_exclusion_group: experiment.mutualExclusionGroup, assignment_bucket: bucket };
      discardMismatchedExposure(expected);
      const alreadyQueued = hasExactQueuedExposure(expected);
      const applied = applyVariant(experiment, variant);
      if (alreadyQueued) { applied.elements.forEach((element) => element.setAttribute('data-experiment-queue-state', 'queued')); undoAll.push(applied.undo); continue; }
      let queued = false;
      try { queued = queue('experiment_exposure', { page_type: experiment.segment.pageType, ...expected, dedupe_key: `exposure-${experiment.id}-${experiment.version}-${variant.id}` }).status === 'queued'; } catch { queued = false; }
      if (!queued || !writeQueuedExposure(expected)) { applied.undo(); continue; }
      applied.elements.forEach((element) => element.setAttribute('data-experiment-queue-state', 'queued'));
      undoAll.push(applied.undo);
    }
  };
  runtime.__flowhomeExperimentsRuntime = { rollback, refresh: run, setEnabled: (enabled) => { const saved = setExperimentRuntimeEnabled(enabled); run(); return saved; } };
  run();
  window.addEventListener('flowhome:consent-change', () => { if (hasAnalyticsConsent()) run(); else { rollback(); clearExperimentExposures(); } });
  window.addEventListener('storage', (event) => { if (event.key === EXPERIMENT_RUNTIME_CONFIG_STORAGE_KEY) run(); });
  return rollback;
}
