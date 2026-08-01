import type { Channel, ChannelVariant } from '../../../src/lib/blocks/block11/contracts.ts';
import type { ContentQueue } from '../../../src/lib/blocks/block11/queue.ts';

const channels: readonly Channel[] = ['tiktok', 'reels', 'shorts', 'youtube', 'pinterest', 'email'];
const variant = (channel: Channel): ChannelVariant => ({
  id: `variant:block11:${channel}`, channel, hook: 'A practical room upgrade starts with one measured choice.', script: 'Show the selected item, its fit, and the verified limitation.',
  subtitles: ['email', 'pinterest'].includes(channel) ? { kind: 'not_applicable', reason: 'Static or email format has no timed spoken track.' } : { kind: 'provided', text: 'A practical room upgrade starts with one measured choice.' },
  cover: 'Measured room upgrade cover', cta: { label: 'View the FlowHome guide', canonicalUrl: 'https://flowhome.com/guides/measured-room-upgrade' },
  utm: { source: ({ tiktok: 'tiktok', reels: 'instagram', shorts: 'youtube_shorts', youtube: 'youtube', pinterest: 'pinterest', email: 'email' } as const)[channel], medium: channel === 'email' ? 'email' : 'social', campaign: 'block11_launch', content: `measured_upgrade_${channel}` },
  rights: { verified: true, scope: 'Organic educational content', channels: [channel], territory: 'US', expiresAt: '2027-08-01T00:00:00.000Z', sourceEvidence: 'rights:block11:fixture' },
  disclosure: channel === 'email' ? { materialConnection: 'affiliate', text: 'Affiliate links may earn a commission at no extra cost to you.', placement: 'adjacent_to_endorsement_or_cta', inAsset: false, format: 'adjacent_text', hardToMiss: true } : channel === 'pinterest' ? { materialConnection: 'affiliate', text: 'Affiliate links may earn a commission at no extra cost to you.', placement: 'in_asset', inAsset: true, format: 'image_overlay', hardToMiss: true } : { materialConnection: 'affiliate', text: 'Affiliate links may earn a commission at no extra cost to you.', placement: 'in_asset', inAsset: true, format: 'visual_spoken', hardToMiss: true },
  creatorBrief: { objective: 'Explain a measured room upgrade.', audience: 'People planning a small room refresh.', permittedClaims: ['Describe verified fit facts.'], prohibitedClaims: ['Do not promise guaranteed outcomes.'], deliverables: ['One channel-ready variant.'], compensationStatus: 'affiliate', rightsTerm: 'Twelve months for organic use.', disclosureInstructions: 'Place the affiliate disclosure clearly in the channel format.', approver: 'content-reviewer' },
  approvalState: 'draft', classification: 'editorial',
});

/** Synthetic only: complete assets remain drafts and have no approval or publication evidence. */
export const SYNTHETIC_CONTENT_QUEUE: ContentQueue = Object.freeze({
  id: 'content:block11:fixture', campaignId: 'campaign:block11:launch', state: 'idea', variants: channels.map(variant),
  publishApproval: null, publicationEvidence: null, retirementReason: null, updatedAt: '2026-08-01T00:00:00.000Z',
});
