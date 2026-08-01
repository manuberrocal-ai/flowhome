export interface EditorialSource {
  label: string;
  url: string;
  accessedAt?: string;
}

export type EvidenceLevel = 'hands-on-tested' | 'research-verified' | 'data-evaluated' | 'not-verified';

export const EDITORIAL_POLICY = {
  corrections: 'Report the page, claim, evidence, and date of the suspected error. A human editor reviews the record before a correction or update is published.',
  sensitiveClaims: 'Privacy, safety, health, legal, financial, security, and vulnerability claims require human editorial approval and a current primary or otherwise authoritative source. If that evidence is unavailable, the claim remains unverified.',
  geographicScope: 'Content is written for the United States market unless a page explicitly states another market. Prices are USD snapshots; shipping, taxes, stock, warranty, compatibility, and retailer terms must be confirmed for the shopper’s location.',
  localization: 'Only real localized equivalents may use reciprocal hreflang links. Translation widgets do not create localized equivalents, so this single English market currently emits no hreflang pair.',
} as const;

export interface EditorialMetadataOptions {
  authorId?: string;
  reviewedBy?: string;
  humanReviewedDate?: string;
  sources?: EditorialSource[];
}

export const EDITORIAL_TEAM = {
  id: 'flowhome-editorial-team',
  name: 'FlowHome Editorial Team',
  role: 'Editorial organization',
  profileUrl: '/about/#editorial-team',
  bio: 'FlowHome Editorial Team is the organization responsible for FlowHome buying guidance. It is not an individual person and does not represent a personal professional credential.',
  methodology: 'We compare documented compatibility, setup requirements, public product information, owner feedback, price snapshots, and practical tradeoffs. We do not run controlled lab tests or claim hands-on testing unless that is explicitly stated on the page.',
  disclosure: 'FlowHome may earn from qualifying purchases through affiliate links. Automation can assist with discovery and maintenance, but it does not replace editorial responsibility.',
} as const;

export const EDITORIAL_AUTHORS = {
  [EDITORIAL_TEAM.id]: EDITORIAL_TEAM,
} as const;

export function resolveAuthor(authorId?: string) {
  // Unknown or missing authors must never become invented people or credentials.
  return authorId && authorId in EDITORIAL_AUTHORS
    ? EDITORIAL_AUTHORS[authorId as keyof typeof EDITORIAL_AUTHORS]
    : EDITORIAL_TEAM;
}

function safeSources(sources?: EditorialSource[]) {
  return (sources ?? []).filter((source) => {
    try {
      return source.label && new URL(source.url).protocol === 'https:';
    } catch {
      return false;
    }
  });
}

export function getEditorialMetadata(options: EditorialMetadataOptions = {}) {
  return {
    author: resolveAuthor(options.authorId),
    reviewedBy: options.reviewedBy,
    humanReviewedDate: options.humanReviewedDate,
    sources: safeSources(options.sources),
  };
}

export function getEvidenceLevel(hasHandsOnTest = false, hasResearchSources = false, hasStructuredData = false): EvidenceLevel {
  if (hasHandsOnTest) return 'hands-on-tested';
  if (hasResearchSources) return 'research-verified';
  if (hasStructuredData) return 'data-evaluated';
  return 'not-verified';
}
