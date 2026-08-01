import { strictUtc } from '../block10/domain.ts';
import { isCurrentApproval } from '../block10/operations.ts';
import { CHANNELS, type ChannelVariant, type ContentQueueApproval, type PublicationEvidence, validatePublicationEvidence, validateVariant } from './contracts.ts';

export const CONTENT_STATES = ['idea', 'verification', 'script_assets', 'human_review', 'approval', 'publication_ready', 'measurement', 'iteration', 'retirement'] as const;
export type ContentState = typeof CONTENT_STATES[number];
export type ContentQueue = Readonly<{
  id: string; campaignId: string; state: ContentState; variants: readonly ChannelVariant[]; publishApproval: ContentQueueApproval | null;
  publicationEvidence: PublicationEvidence | null; retirementReason: string | null; updatedAt: string;
}>;
export type TransitionResult = Readonly<{ queue: ContentQueue; allowed: boolean; reason: string }>;

const NEXT: Readonly<Partial<Record<ContentState, ContentState>>> = {
  idea: 'verification', verification: 'script_assets', script_assets: 'human_review', human_review: 'approval',
  approval: 'publication_ready', publication_ready: 'measurement', measurement: 'iteration', iteration: 'verification',
};
const SAFE_REASON = /^[a-z0-9][a-z0-9 .,;:_-]{2,300}$/i;

export function validateAllChannelVariants(variants: readonly ChannelVariant[], now: string): string | null {
  if (variants.length !== CHANNELS.length || new Set(variants.map((variant) => variant.channel)).size !== CHANNELS.length) return 'every_channel_variant_required';
  for (const channel of CHANNELS) {
    const variant = variants.find((item) => item.channel === channel);
    const result = variant ? validateVariant(variant, now, true) : 'every_channel_variant_required';
    if (result) return result;
  }
  return null;
}

/** Revalidates persisted gates so a forged state cannot bypass prior approval or evidence checks. */
export function validateQueueState(queue: ContentQueue, now: string): string | null {
  if (!strictUtc(queue.updatedAt)) return 'queue_updated_at_invalid';
  if (queue.state === 'publication_ready') {
    const variants = validateAllChannelVariants(queue.variants, now);
    return variants ?? (isCurrentApproval(queue.publishApproval, 'publish', now) ? null : 'current_human_publish_approval_required');
  }
  if (queue.state === 'measurement') return validatePublicationEvidence(queue.publicationEvidence, now);
  return null;
}

/** Transitions are immutable and only model preparation/evidence, never publication. */
export function transitionContent(queue: ContentQueue, target: ContentState, now: string, options: Readonly<{ retirementReason?: string; publicationEvidence?: PublicationEvidence }> = {}): TransitionResult {
  const current = strictUtc(now);
  if (!current || !CONTENT_STATES.includes(target)) return { queue, allowed: false, reason: 'invalid_time_or_state' };
  const invariant = validateQueueState(queue, current);
  if (invariant) return { queue, allowed: false, reason: invariant };
  if (target === 'retirement') {
    if (queue.state === 'retirement') return { queue, allowed: false, reason: 'retirement_terminal' };
    if (queue.state !== 'iteration') return { queue, allowed: false, reason: 'canonical_transition_required' };
    if (!options.retirementReason || !SAFE_REASON.test(options.retirementReason)) return { queue, allowed: false, reason: 'retirement_reason_required' };
    return { queue: { ...queue, state: target, retirementReason: options.retirementReason, updatedAt: current }, allowed: true, reason: 'retired_with_reason' };
  }
  if (NEXT[queue.state] !== target) return { queue, allowed: false, reason: 'canonical_transition_required' };
  if (target === 'publication_ready') {
    const variants = validateAllChannelVariants(queue.variants, current);
    if (variants) return { queue, allowed: false, reason: variants };
    if (!isCurrentApproval(queue.publishApproval, 'publish', current)) return { queue, allowed: false, reason: 'current_human_publish_approval_required' };
  }
  if (target === 'measurement') {
    const evidence = options.publicationEvidence ?? queue.publicationEvidence;
    const result = validatePublicationEvidence(evidence, current);
    if (result) return { queue, allowed: false, reason: result };
    return { queue: { ...queue, state: target, publicationEvidence: evidence, updatedAt: current }, allowed: true, reason: 'publication_evidence_recorded' };
  }
  return { queue: { ...queue, state: target, updatedAt: current }, allowed: true, reason: 'canonical_transition' };
}
