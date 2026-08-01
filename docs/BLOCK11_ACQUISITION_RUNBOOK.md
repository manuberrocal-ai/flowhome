# Block 11 Acquisition Runbook (Local/Mock Preparation)

**Accessed:** 2026-08-01. This is a local-contract runbook, not authorization. No account, network request, credentials, provider selection, publication, post, send, spend, export of contacts, deployment, or browser action was performed. Browser QA is N/A: Block 11 has no UI.

## No-action boundary, permissions, budgets, and approvals

All adapters are `not_configured` or `off` and create only a `manualOnly: true`, `approval_required` package. Local budget is **$0**. Credentials must remain external to this repository.

| Area | External permission | Budget | Owner | Approval | Action performed |
| --- | --- | --- | --- | --- | --- |
| Amazon Creators API / feeds | Unknown / unapproved | Unknown / unapproved | Unassigned | Program, feed, rights, and publish approval | None |
| TikTok upload / Direct Post | Unknown / unapproved | Unknown / unapproved | Unassigned | App review, audit where required, rights, and publish approval | None |
| Instagram Reels | Unknown / unapproved | Unknown / unapproved | Unassigned | Professional account, access review, rights, and publish approval | None |
| YouTube / Shorts | Unknown / unapproved | Unknown / unapproved | Unassigned | OAuth/audit, rights, and publish approval | None |
| Pinterest | Unknown / unapproved | Unknown / unapproved | Unassigned | Access-tier review, rights, and publish approval | None |
| Email | Unknown / unapproved | Unknown / unapproved | Unassigned | Block 7 consent/preferences and export review | None |

## Shared local gates

1. Keep the content item in the canonical queue; no state transition performs publication.
2. Every variant needs verified current rights, a matching material-connection disclosure, a complete creator brief, approved status, a FlowHome HTTPS canonical CTA, and its exact normalized channel UTM mapping.
3. A current human `publish` approval is required before `publication_ready`. Manual or official-API evidence, recorded no later than the local transition time, is required before measurement/iteration.
4. Measurement imports only exact aggregate fields from `manual_export` or `official_api`: nonnegative integer counts, no email, click ID, query, URL/referrer, secret, or unknown source. `unknown` remains a non-importable draft.
5. The FTC boundary is hard-to-miss, same-message, and same-language: video disclosure is in the asset with visual and spoken disclosure; Pinterest uses an in-asset image overlay; email is adjacent to the endorsement or CTA. A platform tool alone is not sufficient.

## Channel-specific activation preparation (still unauthorizing)

### Amazon Creators API

- Sources: [Creators API introduction](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [migration guide](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi), and [Associates Program Policies](https://affiliate-program.amazon.com/help/operating/policies).
- After separate authorization, obtain program eligibility and use OAuth2 `client_credentials`, `creatorsapi::default`, Credential ID/Secret/version held externally, a one-hour token, `creatorsapi.amazon/catalog/v1`, and `OffersV2`. PA-API was deprecated 2026-05-15.
- Feeds require separate express approval. Do not data-mine, scrape, or bypass robots. Do not cache images: use an image link for at most 24 hours. Other content is at most 24 hours then refresh; only the current-license ASIN exception applies. Respect all program content-license and rights terms. Fallback: approved manual catalog-review package.

### TikTok Content Posting API

- Sources: [getting started](https://developers.tiktok.com/doc/content-posting-api-get-started/), [upload](https://developers.tiktok.com/doc/content-posting-api-reference-upload-video/), [Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post/), [scopes](https://developers.tiktok.com/doc/tiktok-api-scopes), [content-sharing guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines/), and [app review](https://developers.tiktok.com/doc/app-review-guidelines/).
- Current local least privilege is draft-only `video.upload`. The separately modelled optional Direct Post scope is `video.publish`; its profile remains disabled and needs separate explicit approval and audit. Do not enable it through this contract.
- If separately authorized, require `creator_info`, creator consent UX, music confirmation, rights review, and the relevant app review. Preparation metadata limits are init 6/min/user token, creator-info 20/min, status 30/min; unaudited apps are limited to five active users/24h, `SELF_ONLY` private content, and five pending shares/24h. Fallback: approved creator-completed draft/manual package.

### Instagram Reels

- Source: [Instagram Platform content publishing](https://developers.facebook.com/docs/instagram-platform/content-publishing/).
- A separately authorized operator would first confirm a professional account and Advanced Access/app review. Least Instagram Login scopes are `instagram_business_basic`, `instagram_business_content_publish`. The Facebook Login path is `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`; request ads scopes only if the documented role path requires them.
- PPA can block. Read `GET content_publishing_limit`; use the lower 50 posts/24h documented bound until current route and human review resolve the official page's 50/100 route-specific sections. Fallback: approved manual Reel package.

### YouTube and Shorts

- Sources: [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), [quota costs](https://developers.google.com/youtube/v3/determine_quota_cost), and [quota/compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits).
- After separate approval, use OAuth consent and `youtube.upload` with `videos.insert`; Shorts uses the same endpoint. Preparation metadata records 100 upload calls/day at cost 1 in the Video Uploads bucket plus 10,000 other daily units. Unverified projects created after 2020-07-28 remain private until audit. Fallback: approved manual upload package.

### Pinterest

- Sources: [Connect app](https://developers.pinterest.com/docs/getting-started/connect-app/), [authentication](https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/), [access tiers](https://developers.pinterest.com/docs/key-concepts/access-tiers/), [Create Pin](https://developers.pinterest.com/docs/api/v5/pins-create), [rate limits](https://developers.pinterest.com/docs/reference/rate-limits/), and [developer guidelines](https://policy.pinterest.com/developer-guidelines/).
- After separate authorization, use OAuth2 `pins:read`, `pins:write`, and target-board `boards:read`, `boards:write` for `POST /v5/pins`. Trial needs review; Standard needs upgrade/review/demo; Trial entities are creator-only. Treat tier/category headers as runtime authority and do not operate through this local contract. Fallback: sandbox/manual approved Pin package.

### Email and disclosures

- Email remains mock-only: reuse Block 7 consent/preferences, select no provider, and do not send. Its only fallback is an approved export package without contact data or PII.
- FTC source: [Disclosures 101 for Social Media Influencers](https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers). Apply clear, conspicuous material-connection disclosure in the same language and message as the endorsement; video uses in-asset visual plus spoken disclosure where possible, images use an overlay, and platform disclosure tools do not replace the disclosure.

## Local checks

Run only `node --test test/block11-*.test.mjs`, `npm.cmd run lint`, and `npm.cmd run typecheck`. Passing checks proves local contracts, fixtures, and mock behavior only; it does not prove permissions, reviews, quotas, rights clearance, publication, delivery, or outcomes.
