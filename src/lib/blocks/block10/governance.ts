/** Bounded automation policy: deterministic rules and humans always precede models. */
import type { HumanApproval } from './domain.ts';
import { isCurrentApproval } from './operations.ts';
export interface VersionedArtifact { id: string; version: string; kind: 'rule' | 'model' | 'prompt'; immutable: boolean; explanation: string; reviewed: boolean; }
export interface FlagSet { globalEnabled: boolean; domainEnabled: boolean; globalKill: boolean; domainKill: boolean; }
export type RiskyAction = 'publish' | 'spend' | 'destructive' | 'legal_privacy';
export type AutomationAction = 'publish_content' | 'spend_campaign' | 'destructive_change' | 'legal_privacy_change' | 'recommend';
export interface AutomationRequest { action: string; domain: string; ruleVersion: VersionedArtifact | null; modelVersion: VersionedArtifact | null; promptVersion: VersionedArtifact | null; modelEvidence: { sampleSize: number; minimumSampleSize: number; drifted: boolean } | null; requestedSpendMinor: number; currentSpendMinor: number; spendLimitMinor: number; publicationCount: number; publicationLimit: number; approval: HumanApproval | null; now: string; }

export function isFlagEnabled(flags: FlagSet): boolean { return flags.globalEnabled && flags.domainEnabled && !flags.globalKill && !flags.domainKill; }

const ACTION_RISK: Readonly<Record<AutomationAction, RiskyAction | null>> = {
  publish_content: 'publish', spend_campaign: 'spend', destructive_change: 'destructive', legal_privacy_change: 'legal_privacy', recommend: null,
};
const ID = /^[A-Za-z0-9:_-]{1,160}$/;

export function isValidVersionedArtifact(value: VersionedArtifact | null, kind: VersionedArtifact['kind']): boolean {
  return Boolean(value && value.kind === kind && value.immutable === true && value.reviewed === true && ID.test(value.id) && /^[A-Za-z0-9._-]{1,80}$/.test(value.version) && value.explanation.trim().length > 0 && value.explanation.length <= 2_000);
}

export function evaluateModelAssistance(model: VersionedArtifact | null, prompt: VersionedArtifact | null, evidence: AutomationRequest['modelEvidence']): { eligible: boolean; reason: string } {
  if (!isValidVersionedArtifact(model, 'model') || !isValidVersionedArtifact(prompt, 'prompt')) return { eligible: false, reason: 'reviewed_model_and_prompt_required' };
  if (!evidence || !Number.isInteger(evidence.sampleSize) || evidence.sampleSize < evidence.minimumSampleSize || evidence.minimumSampleSize < 1) return { eligible: false, reason: 'insufficient_model_evidence' };
  if (evidence.drifted) return { eligible: false, reason: 'drift_detected' };
  return { eligible: true, reason: 'eligible_assist_only' };
}

export function evaluateAutomation(request: AutomationRequest, flags: FlagSet): { allowed: boolean; reason: string; explanation: string | null } {
  if (!isFlagEnabled(flags)) return { allowed: false, reason: 'flag_or_kill_switch_off', explanation: null };
  if (!(request.action in ACTION_RISK)) return { allowed: false, reason: 'unknown_action_fail_closed', explanation: null };
  const rule = request.ruleVersion;
  if (!rule || !isValidVersionedArtifact(rule, 'rule')) return { allowed: false, reason: 'deterministic_explainable_rule_required', explanation: null };
  const risk = ACTION_RISK[request.action as AutomationAction];
  if (!Number.isInteger(request.publicationCount) || !Number.isInteger(request.publicationLimit) || request.publicationCount < 0 || request.publicationLimit < 0 || request.publicationCount > request.publicationLimit) return { allowed: false, reason: 'hard_publication_limit', explanation: rule.explanation };
  if (!Number.isInteger(request.requestedSpendMinor) || !Number.isInteger(request.currentSpendMinor) || !Number.isInteger(request.spendLimitMinor) || request.requestedSpendMinor < 0 || request.currentSpendMinor < 0 || request.spendLimitMinor < 0 || request.currentSpendMinor + request.requestedSpendMinor > request.spendLimitMinor) return { allowed: false, reason: 'hard_spend_limit', explanation: rule.explanation };
  if ((risk || request.requestedSpendMinor > 0) && !isCurrentApproval(request.approval, risk ?? 'spend', request.now)) return { allowed: false, reason: `human_approval_required:${risk ?? 'spend'}`, explanation: rule.explanation };
  if (request.action === 'publish_content' && request.publicationCount >= request.publicationLimit) return { allowed: false, reason: 'hard_publication_limit', explanation: rule.explanation };
  if (request.modelVersion || request.promptVersion || request.modelEvidence) {
    const model = evaluateModelAssistance(request.modelVersion, request.promptVersion, request.modelEvidence);
    if (!model.eligible) return { allowed: false, reason: model.reason, explanation: rule.explanation };
    return { allowed: true, reason: 'rules_first_model_assist_only', explanation: rule.explanation };
  }
  return { allowed: true, reason: 'rules_only', explanation: rule.explanation };
}

export function decideRollback(current: VersionedArtifact | null, target: VersionedArtifact | null, approval: HumanApproval | null, now: string): { allowed: boolean; reason: string; currentVersion: string | null; targetVersion: string | null } {
  if (!current || !target || current.kind !== target.kind || !isValidVersionedArtifact(current, current.kind) || !isValidVersionedArtifact(target, target.kind)) return { allowed: false, reason: 'reviewed_matching_artifacts_required', currentVersion: current?.version ?? null, targetVersion: target?.version ?? null };
  if (!isCurrentApproval(approval, 'rollback', now)) return { allowed: false, reason: 'rollback_approval_required', currentVersion: current.version, targetVersion: target.version };
  if (current.id !== target.id || current.version === target.version) return { allowed: false, reason: 'prior_reviewed_version_required', currentVersion: current.version, targetVersion: target.version };
  return { allowed: true, reason: 'rollback_to_reviewed_version', currentVersion: current.version, targetVersion: target.version };
}

export function detectDrift(baseline: readonly number[], observed: readonly number[], maxRelativeShift: number): { drifted: boolean; reason: string } {
  if (!baseline.length || !observed.length || maxRelativeShift < 0) return { drifted: true, reason: 'insufficient_or_invalid_evidence' };
  const mean = (values: readonly number[]) => values.reduce((total, value) => total + value, 0) / values.length;
  const baselineMean = mean(baseline); const observedMean = mean(observed);
  if (!Number.isFinite(baselineMean) || !Number.isFinite(observedMean) || baselineMean === 0) return { drifted: true, reason: 'invalid_baseline' };
  return Math.abs(observedMean - baselineMean) / Math.abs(baselineMean) > maxRelativeShift ? { drifted: true, reason: 'relative_shift_exceeded' } : { drifted: false, reason: 'within_bound' };
}
