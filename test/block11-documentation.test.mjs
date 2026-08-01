import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const runbook = read('../docs/BLOCK11_ACQUISITION_RUNBOOK.md');
const report = read('../docs/BLOCK11_COMPLETION_REPORT.md');
const roadmap = read('../docs/ROADMAP_PHASES_0_6.md');
const baseline = read('../docs/BASELINE_SCORECARD.md');

const officialUrls = [
  'https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction',
  'https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi',
  'https://affiliate-program.amazon.com/help/operating/policies',
  'https://developers.tiktok.com/doc/content-posting-api-get-started/',
  'https://developers.tiktok.com/doc/content-posting-api-reference-upload-video/',
  'https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/',
  'https://developers.tiktok.com/doc/tiktok-api-scopes',
  'https://developers.tiktok.com/doc/content-sharing-guidelines/',
  'https://developers.tiktok.com/doc/app-review-guidelines/',
  'https://developers.facebook.com/docs/instagram-platform/content-publishing/',
  'https://developers.google.com/youtube/v3/docs/videos/insert',
  'https://developers.google.com/youtube/v3/determine_quota_cost',
  'https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits',
  'https://developers.pinterest.com/docs/getting-started/connect-app/',
  'https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/',
  'https://developers.pinterest.com/docs/key-concepts/access-tiers/',
  'https://developers.pinterest.com/docs/api/v5/pins-create',
  'https://developers.pinterest.com/docs/reference/rate-limits/',
  'https://policy.pinterest.com/developer-guidelines/',
  'https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers',
];

test('official documentation URLs are exact and retained in the runbook and completion report', () => {
  for (const url of officialUrls) {
    assert.match(runbook, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(report, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('all six external areas remain Unknown, unapproved, unassigned, and action-free', () => {
  for (const area of ['Amazon Creators API / feeds', 'TikTok upload / Direct Post', 'Instagram Reels', 'YouTube / Shorts', 'Pinterest', 'Email']) {
    assert.match(report, new RegExp(`\\| ${area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| Unknown / unapproved \\| Unknown / unapproved \\| Unassigned \\| Unknown / unapproved \\| None \\|`));
  }
  assert.match(report, /\| Local work \| Not applicable \| \$0 \| Unassigned \| Not applicable \| None \|/);
});

test('the report records the explicit prohibited-action and Block 12 boundaries', () => {
  for (const phrase of ['No account access', 'post', 'send', 'spend', 'scraping', 'evasion', 'commit', 'push', 'deployment', 'migration', 'Block 12']) assert.match(report, new RegExp(phrase));
});

test('the checklist maps every requested documentation artifact', () => {
  for (const artifact of [
    '[`BLOCK11_COMPLETION_REPORT.md`](BLOCK11_COMPLETION_REPORT.md)',
    'BLOCK11_ACQUISITION_RUNBOOK.md',
    'BASELINE_SCORECARD.md',
    'ROADMAP_PHASES_0_6.md',
    'src/lib/blocks/block11/contracts.ts',
    'src/lib/blocks/block11/queue.ts',
    'src/lib/blocks/block11/integration.ts',
    'src/lib/blocks/block11/measurement.ts',
    'src/lib/blocks/block11/commercial.ts',
    'src/lib/blocks/block11/index.ts',
    'data/blocks/block11/synthetic-content-queue.ts',
    'test/block11-acquisition.test.mjs',
    'test/block11-documentation.test.mjs',
  ]) assert.match(report, new RegExp(artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const requirement of [
    'Nine-state queue and transition invariants',
    'Six synthetic channel variants and every required field',
    'Normalized channel UTMs and no retailer URL UTM',
    'Rights, hard-to-miss disclosures, creator briefs, and current human approval',
    'Official Amazon, TikTok, Instagram, YouTube/Shorts, Pinterest, and email interface metadata: OAuth, scopes, quotas, review, rights, and manual fallback',
    'Pure canonical mock adapters and fixed operation matrix with no I/O',
    'Attribution accepts exact aggregate fields only and preserves privacy',
    'Retailer/manufacturer diversification',
    'Sponsored/editorial separation',
    'Commission/fee-invariant editorial ranking',
    '40% retailer, 40% manufacturer, and minimum-three concentration defaults',
    'External permissions, budgets, and approvals remain unapproved',
    'No scraping, evasion, post, send, spend, account access, commit, push, deployment, or Block 12',
  ]) assert.match(report, new RegExp(requirement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('roadmap keeps Block 11 locally closed while Block 12 advances without completing Phase 6', () => {
  assert.match(roadmap, /Block 11 local\/mock is technically closed/);
  assert.match(roadmap, /Block 12 local operational contracts technically prepared\/closed/);
  assert.match(roadmap, /Phase 6 is not complete/);
  assert.match(roadmap, /90-day\/business outcomes remain not validated/);
  assert.doesNotMatch(roadmap, /\| 6 \|[^\n]*\| Completed/);
});

test('baseline preserves history and cites the Block 11 report and runbook as local-only evidence', () => {
  assert.match(baseline, /Block 9 final local evidence/);
  assert.match(baseline, /Block 11 local\/mock technical evidence/);
  assert.match(baseline, /\[`BLOCK11_ACQUISITION_RUNBOOK\.md`\]\(BLOCK11_ACQUISITION_RUNBOOK\.md\)/);
  assert.match(baseline, /\[`BLOCK11_COMPLETION_REPORT\.md`\]\(BLOCK11_COMPLETION_REPORT\.md\)/);
  assert.match(baseline, /no UI or public runtime/);
});

test('the runbook retains offline local-check guidance and manual fallbacks', () => {
  assert.match(runbook, /Run only `node --test test\/block11-\*\.test\.mjs`/);
  assert.match(runbook, /manual catalog-review package/);
  assert.match(runbook, /approved creator-completed draft\/manual package/);
  assert.match(runbook, /no provider, and do not send/);
});
