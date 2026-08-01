import { strictUtc } from '../block10/domain.ts';
import type { Channel } from './contracts.ts';

export type OfficialMode = 'not_configured' | 'off';
export type DirectPostProfile = Readonly<{ enabled: false; scope: 'video.publish'; explicitApprovalRequired: true; auditRequired: true }>;
export type OfficialIntegration = Readonly<{
  id: 'amazon_creators' | 'tiktok_content_posting' | 'instagram_reels' | 'youtube_uploads' | 'pinterest_pins' | 'email_mock';
  mode: OfficialMode; enabled: false; lastVerifiedAt: '2026-08-01'; endpoint: string; leastScopes: readonly string[];
  quota: string; review: string; rights: string; manualFallback: string; contentChannels: readonly Channel[]; sourcePolicy: string;
  sourceUrls: readonly string[]; runbookContract: string | null; draftScopes?: readonly ['video.upload']; directPublishScope?: 'video.publish'; directPostProfile?: DirectPostProfile;
}>;
export type PreparationPackage = Readonly<{ integrationId: OfficialIntegration['id']; operation: 'publication' | 'catalog' | 'email_export'; status: 'approval_required'; manualOnly: true; generatedAt: string; metadata: OfficialIntegration }>;
export type MockOfficialAdapter = Readonly<{ metadata: OfficialIntegration; prepare: (operation: PreparationPackage['operation'], now: string) => PreparationPackage }>;

const OFFICIAL_OPERATION_BY_INTEGRATION = Object.freeze({
  amazon_creators: 'catalog',
  tiktok_content_posting: 'publication',
  instagram_reels: 'publication',
  youtube_uploads: 'publication',
  pinterest_pins: 'publication',
  email_mock: 'email_export',
} as const satisfies Record<OfficialIntegration['id'], PreparationPackage['operation']>);

function failClosed(code: string, message: string): never {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  throw error;
}

/** Facts are static policy metadata; adapters deliberately contain no HTTP, auth, or publishing code. */
export const OFFICIAL_INTEGRATIONS: readonly OfficialIntegration[] = Object.freeze([
   { id: 'amazon_creators', mode: 'not_configured', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'https://creatorsapi.amazon/catalog/v1 (OffersV2)', leastScopes: ['creatorsapi::default'], quota: 'OAuth2 client_credentials; Credential ID/Secret/version; 1-hour token. PA-API deprecated 2026-05-15. Feeds require separate express approval.', review: 'Program approval and any feed express approval required.', rights: 'Program content license, caching, and rights rules apply; scraping prohibited.', manualFallback: 'Approved manual catalog-review package only.', contentChannels: ['tiktok', 'reels', 'shorts', 'youtube', 'pinterest', 'email'], sourcePolicy: 'Official Creators API only; no scraping.', sourceUrls: ['https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction', 'https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi', 'https://affiliate-program.amazon.com/help/operating/policies'], runbookContract: null },
   { id: 'tiktok_content_posting', mode: 'off', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'Content Posting API video.upload / video.publish', leastScopes: ['video.upload'], draftScopes: ['video.upload'], directPublishScope: 'video.publish', directPostProfile: { enabled: false, scope: 'video.publish', explicitApprovalRequired: true, auditRequired: true }, quota: 'init 6 req/min/user token; creator_info 20/min; status 30/min; unaudited: 5 active users/24h, SELF_ONLY/private, 5 pending shares/24h.', review: 'creator_info, explicit consent UX, music confirmation, and audit for public posting.', rights: 'Creator confirms music and publication rights.', manualFallback: 'Approved creator-completed draft or manual posting package.', contentChannels: ['tiktok'], sourcePolicy: 'Official TikTok API only; no automated posting.', sourceUrls: ['https://developers.tiktok.com/doc/content-posting-api-get-started/', 'https://developers.tiktok.com/doc/content-posting-api-reference-upload-video/', 'https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/', 'https://developers.tiktok.com/doc/tiktok-api-scopes', 'https://developers.tiktok.com/doc/content-sharing-guidelines/', 'https://developers.tiktok.com/doc/app-review-guidelines/'], runbookContract: null },
  { id: 'instagram_reels', mode: 'off', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'Instagram Platform content publishing', leastScopes: ['instagram_business_basic', 'instagram_business_content_publish'], quota: 'runtime_authoritative: use lower documented 50 posts/24h bound until route and human review resolve 50 versus 100 official-page sections.', review: 'Professional account, Advanced Access/app review; PPA may block. Facebook Login alternative: instagram_basic, instagram_content_publish, pages_read_engagement; ads scopes only if role path requires.', rights: 'Professional-account content rights and disclosure review required.', manualFallback: 'Approved manual Reel publication package.', contentChannels: ['reels'], sourcePolicy: 'Official Instagram Platform only; no browser automation.', sourceUrls: ['https://developers.facebook.com/docs/instagram-platform/content-publishing/'], runbookContract: null },
  { id: 'youtube_uploads', mode: 'off', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'YouTube Data API videos.insert', leastScopes: ['youtube.upload'], quota: '100 upload calls/day, cost 1 in current Video Uploads bucket, plus 10,000 other units/day. Unverified projects created after 2020-07-28 are private until audit.', review: 'OAuth consent and audit required before public operational use.', rights: 'Uploader must hold video/audio/disclosure rights.', manualFallback: 'Approved manual YouTube/Shorts upload package; Shorts has no separate upload API.', contentChannels: ['youtube', 'shorts'], sourcePolicy: 'Official YouTube Data API only.', sourceUrls: ['https://developers.google.com/youtube/v3/docs/videos/insert', 'https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits'], runbookContract: null },
   { id: 'pinterest_pins', mode: 'off', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'POST /v5/pins', leastScopes: ['pins:read', 'pins:write', 'boards:read', 'boards:write'], quota: 'Tier/category response headers are runtime-authoritative; 429 requires retry. Trial entities are creator-only.', review: 'Trial review then Standard upgrade/review/demo required.', rights: 'Pin assets and destination rights/disclosure must be reviewed.', manualFallback: 'Sandbox/manual approved Pin package.', contentChannels: ['pinterest'], sourcePolicy: 'Official Pinterest API only.', sourceUrls: ['https://developers.pinterest.com/docs/getting-started/connect-app/', 'https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/', 'https://developers.pinterest.com/docs/key-concepts/access-tiers/', 'https://developers.pinterest.com/docs/api/v5/pins-create', 'https://developers.pinterest.com/docs/reference/rate-limits/', 'https://policy.pinterest.com/developer-guidelines/'], runbookContract: null },
  { id: 'email_mock', mode: 'not_configured', enabled: false, lastVerifiedAt: '2026-08-01', endpoint: 'No provider selected', leastScopes: [], quota: 'Unknown; no send permitted.', review: 'Reuse Block 7 consent/preferences boundary.', rights: 'Consent and approved editorial/disclosure review required.', manualFallback: 'Approved export package only; never a contact list or PII.', contentChannels: ['email'], sourcePolicy: 'Mock only; no provider, network, or sending.', sourceUrls: [], runbookContract: 'Block 7 consent/preferences boundary and approved export package only.' },
]);

export function createMockOfficialAdapter(metadata: OfficialIntegration): MockOfficialAdapter {
  const canonical = OFFICIAL_INTEGRATIONS.find((item) => item.id === metadata?.id);
  if (!canonical || metadata !== canonical) failClosed('canonical_official_integration_metadata_required', 'Metadata must be the canonical object registered in OFFICIAL_INTEGRATIONS.');
  const allowedOperation = OFFICIAL_OPERATION_BY_INTEGRATION[canonical.id];
  return Object.freeze({ metadata: canonical, prepare: (operation, now) => {
    const verified = strictUtc(`${canonical.lastVerifiedAt}T00:00:00.000Z`);
    const generatedAt = strictUtc(now);
    if (!verified || !generatedAt || canonical.mode === undefined || canonical.enabled !== false) failClosed('invalid_fail_closed_integration_metadata', 'Integration metadata failed fail-closed validation.');
    if (operation !== allowedOperation) failClosed('incompatible_official_integration_operation', `Integration ${canonical.id} only supports ${allowedOperation}.`);
    return Object.freeze({ integrationId: canonical.id, operation, status: 'approval_required', manualOnly: true, generatedAt, metadata: canonical });
  } });
}
