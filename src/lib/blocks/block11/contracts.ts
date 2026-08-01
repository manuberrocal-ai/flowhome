/** Pure local contracts for Block 11 acquisition preparation; no adapter performs I/O. */
import { strictUtc, type HumanApproval } from '../block10/domain.ts';

export const CHANNELS = ['tiktok', 'reels', 'shorts', 'youtube', 'pinterest', 'email'] as const;
export type Channel = typeof CHANNELS[number];
export type VariantApprovalState = 'draft' | 'approved' | 'rejected' | 'revoked';
export type CommercialClassification = 'editorial' | 'sponsored';
export type UTM = Readonly<{ source: string; medium: string; campaign: string; content: string; term?: string }>;
export type Subtitles = Readonly<{ kind: 'provided'; text: string }> | Readonly<{ kind: 'not_applicable'; reason: string }>;
export type Rights = Readonly<{ verified: boolean; scope: string; channels: readonly Channel[]; territory: string; expiresAt: string; sourceEvidence: string }>;
export type MaterialConnection = 'none' | 'affiliate' | 'paid' | 'gifted';
export type Disclosure = Readonly<{
  materialConnection: MaterialConnection; text: string | null; placement: 'none' | 'in_asset' | 'adjacent_to_endorsement_or_cta';
  inAsset: boolean; format: 'none' | 'visual_spoken' | 'image_overlay' | 'adjacent_text'; hardToMiss: boolean;
}>;
export type CreatorBrief = Readonly<{
  objective: string; audience: string; permittedClaims: readonly string[]; prohibitedClaims: readonly string[];
  deliverables: readonly string[]; compensationStatus: 'none' | 'affiliate' | 'paid' | 'gifted'; rightsTerm: string;
  disclosureInstructions: string; approver: string;
}>;
export type ChannelVariant = Readonly<{
  id: string; channel: Channel; hook: string; script: string; subtitles: Subtitles; cover: string;
  cta: Readonly<{ label: string; canonicalUrl: string }>; utm: UTM; rights: Rights; disclosure: Disclosure;
  creatorBrief: CreatorBrief; approvalState: VariantApprovalState; classification: CommercialClassification;
}>;
export type PublicationEvidence = Readonly<{ source: 'manual_recorded' | 'official_api'; reference: string; observedAt: string }>;

const ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;
const UTM_VALUE = /^[a-z0-9][a-z0-9_-]{0,79}$/;
const PII_OR_SECRET = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:api[_-]?key|secret|password|access[_-]?token|bearer)\b)/i;
const URL_LIKE = /(?:https?:\/\/|www\.|[a-z0-9.-]+\.(?:com|net|org|io|co|app|dev)(?:\/|\b))/i;
export const CHANNEL_UTM: Readonly<Record<Channel, Readonly<{ source: string; medium: string }>>> = Object.freeze({
  tiktok: { source: 'tiktok', medium: 'social' }, reels: { source: 'instagram', medium: 'social' },
  shorts: { source: 'youtube_shorts', medium: 'social' }, youtube: { source: 'youtube', medium: 'social' },
  pinterest: { source: 'pinterest', medium: 'social' }, email: { source: 'email', medium: 'email' },
});

export function containsPiiOrSecret(value: string): boolean { return PII_OR_SECRET.test(value); }
function isSafeText(value: unknown, maximum = 2_000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum && !containsPiiOrSecret(value);
}
function isSafeId(value: unknown): value is string { return typeof value === 'string' && ID.test(value); }

/** Normalizes a closed UTM vocabulary; values cannot carry PII, secrets, or URLs. */
export function normalizeUtm(input: UTM | Readonly<Record<string, string>>): UTM {
  const allowed = new Set(['source', 'medium', 'campaign', 'content', 'term']);
  const candidate = input as Readonly<Record<string, unknown>>;
  const keys = Object.keys(candidate);
  if (!keys.every((key) => allowed.has(key)) || !['source', 'medium', 'campaign', 'content'].every((key) => key in candidate)) throw new Error('invalid_utm_keys');
  const normalized: Record<string, string> = {};
  for (const key of keys) {
    const raw = candidate[key];
    if (typeof raw !== 'string' || containsPiiOrSecret(raw) || URL_LIKE.test(raw)) throw new Error('unsafe_utm_value');
    const value = raw.trim().toLowerCase();
    if (!UTM_VALUE.test(value)) throw new Error('invalid_utm_value');
    normalized[key] = value;
  }
  return Object.freeze(normalized) as UTM;
}

export function isApprovedFlowHomeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'flowhome.com' || url.hostname === 'www.flowhome.com') && !url.search && !url.hash;
  } catch { return false; }
}

/** UTM parameters are only ever assembled onto a reviewed FlowHome canonical route. */
export function buildCanonicalUtmUrl(cta: ChannelVariant['cta'], utm: UTM | Readonly<Record<string, string>>): string {
  if (!isApprovedFlowHomeUrl(cta.canonicalUrl)) throw new Error('retailer_or_noncanonical_cta_forbidden');
  const normalized = normalizeUtm(utm);
  const url = new URL(cta.canonicalUrl);
  for (const [key, value] of Object.entries(normalized)) url.searchParams.set(`utm_${key}`, value);
  return url.toString();
}

export function validateRights(rights: Rights, channel: Channel, now: string): string | null {
  const current = strictUtc(now); const expiry = strictUtc(rights.expiresAt);
  if (!current || !rights.verified || !isSafeText(rights.scope) || !isSafeText(rights.territory) || !isSafeId(rights.sourceEvidence)) return 'rights_unverified_or_invalid';
  if (!rights.channels.length || !rights.channels.every((item) => CHANNELS.includes(item)) || !rights.channels.includes(channel)) return 'rights_channel_missing';
  if (!expiry || Date.parse(expiry) <= Date.parse(current)) return 'rights_expired';
  return null;
}

export function validateDisclosure(disclosure: Disclosure, channel: Channel): string | null {
  if (!['none', 'affiliate', 'paid', 'gifted'].includes(disclosure.materialConnection)) return 'unknown_material_connection';
  if (disclosure.materialConnection === 'none') return disclosure.text === null && disclosure.placement === 'none' && disclosure.inAsset === false && disclosure.format === 'none' && disclosure.hardToMiss === false ? null : 'disclosure_not_needed';
  if (!isSafeText(disclosure.text, 500)) return 'clear_disclosure_required';
  const text = disclosure.text.toLowerCase();
  if (disclosure.materialConnection === 'affiliate' && !/(affiliate|commission)/.test(text)) return 'channel_clear_affiliate_disclosure_required';
  if (disclosure.materialConnection === 'paid' && !/(paid|sponsored)/.test(text)) return 'channel_clear_paid_disclosure_required';
  if (disclosure.materialConnection === 'gifted' && !/(gift|provided)/.test(text)) return 'channel_clear_gifted_disclosure_required';
  if (!disclosure.hardToMiss) return 'hard_to_miss_disclosure_required';
  if (['tiktok', 'reels', 'shorts', 'youtube'].includes(channel)) return disclosure.inAsset && disclosure.placement === 'in_asset' && disclosure.format === 'visual_spoken' ? null : 'video_visual_spoken_in_asset_disclosure_required';
  if (channel === 'pinterest') return disclosure.inAsset && disclosure.placement === 'in_asset' && disclosure.format === 'image_overlay' ? null : 'pinterest_image_overlay_in_asset_disclosure_required';
  return channel === 'email' && !disclosure.inAsset && disclosure.placement === 'adjacent_to_endorsement_or_cta' && disclosure.format === 'adjacent_text' ? null : 'email_adjacent_disclosure_required';
}

export function validateCreatorBrief(brief: CreatorBrief): string | null {
  const scalar = [brief.objective, brief.audience, brief.rightsTerm, brief.disclosureInstructions, brief.approver];
  if (!scalar.every((value) => isSafeText(value)) || !['none', 'affiliate', 'paid', 'gifted'].includes(brief.compensationStatus)) return 'creator_brief_invalid_or_pii';
  const lists = [brief.permittedClaims, brief.prohibitedClaims, brief.deliverables];
  return lists.every((list) => Array.isArray(list) && list.length > 0 && list.every((value) => isSafeText(value))) ? null : 'creator_brief_incomplete_or_pii';
}

export function validateVariant(variant: ChannelVariant, now: string, requireApproved = false): string | null {
  if (!isSafeId(variant.id) || !CHANNELS.includes(variant.channel) || !isSafeText(variant.hook, 500) || !isSafeText(variant.script) || !isSafeText(variant.cover, 500) || !isSafeText(variant.cta.label, 200) || !isApprovedFlowHomeUrl(variant.cta.canonicalUrl)) return 'variant_required_fields_invalid';
  let normalized: UTM;
  try { normalized = normalizeUtm(variant.utm); } catch { return 'variant_utm_invalid'; }
  if (Object.keys(variant.utm).length !== Object.keys(normalized).length || Object.entries(normalized).some(([key, value]) => (variant.utm as Readonly<Record<string, string>>)[key] !== value)) return 'stored_utm_must_be_normalized';
  const expectedUtm = CHANNEL_UTM[variant.channel];
  if (variant.utm.source !== expectedUtm.source || variant.utm.medium !== expectedUtm.medium) return 'channel_utm_attribution_mismatch';
  if (variant.subtitles.kind === 'provided' ? !isSafeText(variant.subtitles.text) : !(['email', 'pinterest'].includes(variant.channel) && isSafeText(variant.subtitles.reason))) return 'subtitles_missing_or_not_applicable';
  const rights = validateRights(variant.rights, variant.channel, now); if (rights) return rights;
  const disclosure = validateDisclosure(variant.disclosure, variant.channel); if (disclosure) return disclosure;
  const brief = validateCreatorBrief(variant.creatorBrief); if (brief) return brief;
  if (!['editorial', 'sponsored'].includes(variant.classification)) return 'unknown_classification';
  const compensation = variant.creatorBrief.compensationStatus;
  if (variant.classification === 'sponsored' && (compensation === 'none' || variant.disclosure.materialConnection === 'none')) return 'sponsored_material_connection_and_compensation_required';
  if (compensation === 'none' && variant.disclosure.materialConnection !== 'none') return 'uncompensated_content_requires_no_material_connection';
  if (compensation !== 'none' && variant.disclosure.materialConnection !== compensation) return 'compensation_and_disclosure_must_match';
  if (requireApproved && variant.approvalState !== 'approved') return 'variant_not_approved';
  return null;
}

export function validatePublicationEvidence(evidence: PublicationEvidence | null, now: string): string | null {
  const current = strictUtc(now); const observedAt = evidence ? strictUtc(evidence.observedAt) : null;
  if (!current || !evidence || !['manual_recorded', 'official_api'].includes(evidence.source) || !isSafeId(evidence.reference) || !observedAt) return 'manual_or_official_publication_evidence_required';
  if (Date.parse(observedAt) > Date.parse(current)) return 'publication_evidence_cannot_be_future';
  return null;
}

export type ContentQueueApproval = HumanApproval;
