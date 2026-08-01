import assert from 'node:assert/strict';
import test from 'node:test';
import { SYNTHETIC_CONTENT_QUEUE } from '../data/blocks/block11/synthetic-content-queue.ts';
import { assessAttribution, buildCanonicalUtmUrl, CHANNEL_UTM, containsPiiOrSecret, createMockOfficialAdapter, DEFAULT_CONCENTRATION_GUARDRAILS, evaluateConcentration, normalizeUtm, OFFICIAL_INTEGRATIONS, rankEditorial, transitionContent, validateAllChannelVariants, validateAttribution, validateCreatorBrief, validateDisclosure, validateQueueState, validateRights, validateVariant } from '../src/lib/blocks/block11/index.ts';

const NOW = '2026-08-01T12:00:00.000Z';
const approval = (state = 'approved', expiresAt = '2026-08-02T12:00:00.000Z') => ({ id: 'approval:publish', action: 'publish', actorId: 'reviewer', state, reason: 'Reviewed publication package', approvedAt: NOW, expiresAt });
const approvedVariants = SYNTHETIC_CONTENT_QUEUE.variants.map((item) => ({ ...item, approvalState: 'approved' }));
const readyQueue = { ...SYNTHETIC_CONTENT_QUEUE, state: 'approval', variants: approvedVariants, publishApproval: approval() };
const evidence = { source: 'manual_recorded', reference: 'evidence:manual:1', observedAt: NOW };

test('canonical queue permits every required edge and rejects skips', () => {
  let queue = { ...SYNTHETIC_CONTENT_QUEUE };
  for (const state of ['verification', 'script_assets', 'human_review', 'approval']) queue = transitionContent(queue, state, NOW).queue;
  assert.equal(transitionContent(queue, 'measurement', NOW).reason, 'canonical_transition_required');
  queue = transitionContent(readyQueue, 'publication_ready', NOW).queue;
  queue = transitionContent(queue, 'measurement', NOW, { publicationEvidence: evidence }).queue;
  queue = transitionContent(queue, 'iteration', NOW).queue;
  assert.equal(transitionContent(queue, 'verification', NOW).allowed, true);
  const retired = transitionContent({ ...queue, state: 'iteration' }, 'retirement', NOW, { retirementReason: 'Rights term concluded.' });
  assert.equal(retired.allowed, true); assert.equal(transitionContent(retired.queue, 'retirement', NOW).reason, 'retirement_terminal');
});

test('current-state invariants block forged publication-ready and measurement states', () => {
  assert.equal(transitionContent({ ...readyQueue, state: 'publication_ready', publishApproval: approval('revoked') }, 'measurement', NOW, { publicationEvidence: evidence }).reason, 'current_human_publish_approval_required');
  assert.equal(transitionContent({ ...readyQueue, state: 'publication_ready', variants: approvedVariants.slice(0, 5) }, 'measurement', NOW, { publicationEvidence: evidence }).reason, 'every_channel_variant_required');
  const forgedMeasurement = { ...readyQueue, state: 'measurement', publicationEvidence: null };
  assert.equal(validateQueueState(forgedMeasurement, NOW), 'manual_or_official_publication_evidence_required');
  assert.equal(transitionContent(forgedMeasurement, 'iteration', NOW).reason, 'manual_or_official_publication_evidence_required');
  assert.equal(transitionContent({ ...readyQueue, state: 'publication_ready' }, 'measurement', NOW, { publicationEvidence: { ...evidence, observedAt: '2026-08-01T12:00:01.000Z' } }).reason, 'publication_evidence_cannot_be_future');
});

test('publication readiness fails closed for revoked or expired approvals, rights, disclosure, and missing variants', () => {
  assert.equal(transitionContent({ ...readyQueue, publishApproval: null }, 'publication_ready', NOW).reason, 'current_human_publish_approval_required');
  assert.equal(transitionContent({ ...readyQueue, publishApproval: approval('revoked') }, 'publication_ready', NOW).reason, 'current_human_publish_approval_required');
  assert.equal(transitionContent({ ...readyQueue, publishApproval: approval('approved', '2026-08-01T11:00:00.000Z') }, 'publication_ready', NOW).reason, 'current_human_publish_approval_required');
  assert.equal(validateAllChannelVariants(approvedVariants.slice(0, 5), NOW), 'every_channel_variant_required');
  assert.equal(validateVariant({ ...approvedVariants[0], rights: { ...approvedVariants[0].rights, expiresAt: '2026-08-01T11:00:00.000Z' } }, NOW, true), 'rights_expired');
});

test('six fixture variants expose every required contract field and remain draft/no-publication', () => {
  assert.equal(SYNTHETIC_CONTENT_QUEUE.variants.length, 6); assert.equal(SYNTHETIC_CONTENT_QUEUE.publicationEvidence, null);
  for (const variant of SYNTHETIC_CONTENT_QUEUE.variants) {
    for (const key of ['id', 'channel', 'hook', 'script', 'subtitles', 'cover', 'cta', 'utm', 'rights', 'disclosure', 'creatorBrief', 'approvalState', 'classification']) assert.equal(key in variant, true);
    for (const key of ['materialConnection', 'text', 'placement', 'inAsset', 'format', 'hardToMiss']) assert.equal(key in variant.disclosure, true);
    assert.deepEqual({ source: variant.utm.source, medium: variant.utm.medium }, CHANNEL_UTM[variant.channel]);
    assert.equal(variant.approvalState, 'draft');
  }
  assert.equal(validateAllChannelVariants(approvedVariants, NOW), null);
});

test('stored UTMs must be normalized and match the channel attribution mapping', () => {
  const utm = normalizeUtm({ source: 'TikTok', medium: 'Social', campaign: 'Launch_2026', content: 'Hero_A' });
  assert.deepEqual(utm, { source: 'tiktok', medium: 'social', campaign: 'launch_2026', content: 'hero_a' }); assert.equal(Object.isFrozen(utm), true);
  assert.equal(validateVariant({ ...approvedVariants[0], utm: { ...approvedVariants[0].utm, campaign: 'Launch_2026' } }, NOW, true), 'stored_utm_must_be_normalized');
  assert.equal(validateVariant({ ...approvedVariants[0], utm: { ...approvedVariants[0].utm, source: 'instagram' } }, NOW, true), 'channel_utm_attribution_mismatch');
  assert.throws(() => normalizeUtm({ source: 'x', medium: 'social', campaign: 'a@b.com', content: 'hero' }), /unsafe/);
  assert.throws(() => normalizeUtm({ source: 'x', medium: 'social', campaign: 'https://tracker.test', content: 'hero' }), /unsafe/);
  assert.throws(() => normalizeUtm({ source: 'x', medium: 'social', campaign: 'launch', content: 'hero', click_id: 'x' }), /keys/);
  assert.match(buildCanonicalUtmUrl(approvedVariants[0].cta, utm), /^https:\/\/flowhome\.com\/guides\/measured-room-upgrade\?utm_source=tiktok/);
  assert.throws(() => buildCanonicalUtmUrl({ label: 'Buy', canonicalUrl: 'https://amazon.com/item' }, utm), /retailer/);
});

test('sponsored and editorial material connections require hard-to-miss matching disclosures', () => {
  const video = approvedVariants[0];
  assert.equal(validateVariant({ ...video, classification: 'sponsored', disclosure: { ...video.disclosure, materialConnection: 'none', text: null, placement: 'none', inAsset: false, format: 'none', hardToMiss: false } }, NOW, true), 'sponsored_material_connection_and_compensation_required');
  assert.equal(validateVariant({ ...video, disclosure: { ...video.disclosure, hardToMiss: false } }, NOW, true), 'hard_to_miss_disclosure_required');
  assert.equal(validateVariant({ ...video, disclosure: { ...video.disclosure, format: 'image_overlay' } }, NOW, true), 'video_visual_spoken_in_asset_disclosure_required');
  assert.equal(validateVariant({ ...approvedVariants[4], disclosure: { ...approvedVariants[4].disclosure, format: 'visual_spoken' } }, NOW, true), 'pinterest_image_overlay_in_asset_disclosure_required');
  assert.equal(validateVariant({ ...approvedVariants[5], disclosure: { ...approvedVariants[5].disclosure, placement: 'in_asset', inAsset: true } }, NOW, true), 'email_adjacent_disclosure_required');
  assert.equal(validateVariant({ ...video, classification: 'sponsored', creatorBrief: { ...video.creatorBrief, compensationStatus: 'paid' } }, NOW, true), 'compensation_and_disclosure_must_match');
  assert.match(validateDisclosure({ materialConnection: 'paid', text: 'Regular product note.', placement: 'in_asset', inAsset: true, format: 'visual_spoken', hardToMiss: true }, 'tiktok'), /clear_paid/);
});

test('creator and rights contracts reject private or incomplete material', () => {
  assert.equal(containsPiiOrSecret('author@example.com'), true);
  assert.equal(validateCreatorBrief({ ...approvedVariants[0].creatorBrief, audience: 'email author@example.com' }), 'creator_brief_invalid_or_pii');
  assert.equal(validateRights({ ...approvedVariants[0].rights, verified: false }, 'tiktok', NOW), 'rights_unverified_or_invalid');
  assert.equal(validateVariant({ ...approvedVariants[4], subtitles: { kind: 'not_applicable', reason: '' } }, NOW, true), 'subtitles_missing_or_not_applicable');
});

test('attribution accepts only exact, private, integer aggregate importable observations', () => {
  const observation = { contentId: 'content:1', campaignId: 'campaign:1', variantId: 'variant:1', source: 'manual_export', observedAt: NOW, metrics: { impressions: 0, clicks: 0, conversions: 0 } };
  assert.equal(validateAttribution(observation), null);
  assert.equal(validateAttribution({ ...observation, email: 'a@b.com' }), 'attribution_top_level_keys_invalid');
  assert.equal(validateAttribution({ ...observation, clickId: 'x' }), 'attribution_top_level_keys_invalid');
  assert.equal(validateAttribution({ ...observation, referrer: 'https://x.test' }), 'attribution_top_level_keys_invalid');
  assert.equal(validateAttribution({ ...observation, query: 'email=a@b.com' }), 'attribution_top_level_keys_invalid');
  assert.equal(validateAttribution({ ...observation, metrics: { ...observation.metrics, arbitrary: 1 } }), 'attribution_metric_keys_invalid');
  assert.equal(validateAttribution({ ...observation, metrics: { ...observation.metrics, clicks: 0.5 } }), 'aggregate_metrics_must_be_nonnegative_integers');
  assert.equal(validateAttribution({ ...observation, metrics: { ...observation.metrics, clicks: -1 } }), 'aggregate_metrics_must_be_nonnegative_integers');
  assert.deepEqual(assessAttribution({ ...observation, source: 'unknown' }), { importable: false, status: 'draft_unknown', reason: 'unknown_source_not_importable' });
});

test('every official integration has verification metadata and mock adapters remain manual-only', () => {
  assert.equal(OFFICIAL_INTEGRATIONS.length, 6);
  for (const metadata of OFFICIAL_INTEGRATIONS) {
    for (const key of ['endpoint', 'leastScopes', 'quota', 'review', 'rights', 'manualFallback', 'sourcePolicy', 'sourceUrls', 'runbookContract']) assert.equal(key in metadata, true);
    assert.equal(metadata.enabled, false); assert.equal(metadata.lastVerifiedAt, '2026-08-01');
    assert.equal(metadata.sourceUrls.length > 0 || metadata.runbookContract !== null, true);
    const result = createMockOfficialAdapter(metadata).prepare(metadata.id === 'amazon_creators' ? 'catalog' : metadata.id === 'email_mock' ? 'email_export' : 'publication', NOW);
    assert.deepEqual({ status: result.status, manualOnly: result.manualOnly, integrationId: result.integrationId }, { status: 'approval_required', manualOnly: true, integrationId: metadata.id });
  }
  const tiktok = OFFICIAL_INTEGRATIONS.find((item) => item.id === 'tiktok_content_posting');
  assert.deepEqual(tiktok.leastScopes, ['video.upload']); assert.deepEqual(tiktok.draftScopes, ['video.upload']); assert.equal(tiktok.directPublishScope, 'video.publish'); assert.deepEqual(tiktok.directPostProfile, { enabled: false, scope: 'video.publish', explicitApprovalRequired: true, auditRequired: true });
  assert.match(OFFICIAL_INTEGRATIONS.find((item) => item.id === 'instagram_reels').quota, /50/);
});

test('official adapters enforce canonical metadata identity and fixed operation mapping', () => {
  const cases = [
    ['amazon_creators', 'catalog', 'publication'],
    ['tiktok_content_posting', 'publication', 'catalog'],
    ['instagram_reels', 'publication', 'catalog'],
    ['youtube_uploads', 'publication', 'catalog'],
    ['pinterest_pins', 'publication', 'catalog'],
    ['email_mock', 'email_export', 'publication'],
  ];

  for (const [id, allowedOperation, forbiddenOperation] of cases) {
    const metadata = OFFICIAL_INTEGRATIONS.find((item) => item.id === id);
    assert.equal(createMockOfficialAdapter(metadata).prepare(allowedOperation, NOW).operation, allowedOperation);
    assert.throws(() => createMockOfficialAdapter(metadata).prepare(forbiddenOperation, NOW), (error) => error.code === 'incompatible_official_integration_operation');
    assert.throws(() => createMockOfficialAdapter({ ...metadata }).prepare(allowedOperation, NOW), (error) => error.code === 'canonical_official_integration_metadata_required');
  }
});

test('editorial rank excludes sponsored content and concentration remains independent of commission', () => {
  const items = [
    { id: 'a', classification: 'editorial', editorialRank: 5, commissionMinor: 0, feeMinor: 0, retailerId: 'r1', manufacturerId: 'm1' },
    { id: 'b', classification: 'editorial', editorialRank: 4, commissionMinor: 999999, feeMinor: 999999, retailerId: 'r2', manufacturerId: 'm2' },
    { id: 's', classification: 'sponsored', editorialRank: 99, commissionMinor: 999999, feeMinor: 999999, retailerId: 'r3', manufacturerId: 'm3' },
  ];
  assert.deepEqual(rankEditorial(items).map((item) => item.id), ['a', 'b']);
  assert.deepEqual(rankEditorial(items.map((item) => ({ ...item, commissionMinor: item.commissionMinor + 1, feeMinor: item.feeMinor + 2 }))).map((item) => item.id), ['a', 'b']);
  assert.equal(DEFAULT_CONCENTRATION_GUARDRAILS.retailerMaxShare, 0.4);
  const balanced = Array.from({ length: 10 }, (_, index) => ({ ...items[0], id: `i${index}`, retailerId: `r${index % 3}`, manufacturerId: `m${index % 3}` }));
  assert.equal(evaluateConcentration(balanced).allowed, true);
  assert.equal(evaluateConcentration(balanced.map((item) => ({ ...item, retailerId: 'r1' }))).breaches.includes('retailer_max_share'), true);
  assert.equal(evaluateConcentration([{ ...balanced[0], retailerId: 'unknown' }]).allowed, false);
});
