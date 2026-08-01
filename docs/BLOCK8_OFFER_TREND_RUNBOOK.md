# Block 8 Offer/Trend Runbook

## Operating boundary

This Block 8 implementation is **local/mock technical preparation only**. It models authorized offer/price/trend data and explainable DealScore/TrendScore contracts in pure TypeScript + tests, plus a non-routable shared ingestion policy helper (`supabase/functions/_shared/offer-ingestion-core.js`). There is no offer-ingestion Edge Function, endpoint, worker schedule, durable store, or secret consumption. It makes **no network request, scrapes no retailer/social platform, connects no unapproved API, and contains no production data**. All data lives in fixtures in [`data/blocks/block8/fixtures.json`](../data/blocks/block8/fixtures.json) and is explicitly marked "NOT production data."

`OFFER_SOURCE`, `TREND_SOURCE`, and `DATA_STORE_URL` are deliberately set to `Unknown`; `PUBLIC_OFFERS_V1` and `PUBLIC_TREND_INGESTION_V1` remain `off`, while `PUBLIC_COMPATIBILITY_V1=false` is disabled and `true` is enabled, until externally approved and configured. Activation requires every gate below.

## Source contract (Phase 5 of [`ROADMAP_PHASES_0_6.md`](ROADMAP_PHASES_0_6.md))

External sources stay `Unknown` until a current, official, reviewed feed is available. Today, only `manual` ingestion of reviewed data is accepted locally. The two named sources in the schema (`affiliate-feed`, `amazon-creators-api`) are reserved types and require explicit activation.

- **`affiliate-feed`**: a contractual, paid or affiliate-network feed carrying price/availability/affiliate URL/ShippingTerms in a documented schema with attribution and quota. Activation requires the network agreement, the official feed spec, an approved ingestion endpoint, and a documented SLO/retention policy.
- **`amazon-creators-api` (or its current Amazon successor)**: the official program API/auth flow. Activation requires current official documentation, OAuth credentials, the exact scopes/permissions reviewed, quota/limits observed, and the manual fallback described below. We never scrape Amazon; we never use the Associates tag as an authorization bypass.

Real provider credentials, endpoint URLs, account permissions, sending-domain/DNS verification (when applicable), privacy/retention approval, and activation remain **blocked externally**. No provider adapter is instantiated in this repository until all activation gates below pass.

## Required server-only configuration

Set `OFFER_SOURCE`, `TREND_SOURCE`, and `DATA_STORE_URL` only as server-side environment values. Never use `PUBLIC_*`, client code, URLs, logs, or analytics for any source credential, API key, or feed token. The `affiliateTag` `flowhome-20` is a known public code constant, not a secret — the same boundary already documented in [`COMMERCIAL_LINK_RUNBOOK.md`](COMMERCIAL_LINK_RUNBOOK.md) applies here.

## Environment variables and feature flags

| Variable | Default | Role |
| --- | --- | --- |
| `OFFER_SOURCE` | `Unknown` | Offer ingestion source id (manual/affiliate-feed/amazon-creators-api). Stays `Unknown` until activated. |
| `TREND_SOURCE` | `Unknown` | Trend signal source id (manual/affiliate-feed). Stays `Unknown` until activated. |
| `DATA_STORE_URL` | `Unknown` | Durable store connection (snapshot/offer/signal/audit). Stays `Unknown` until a vetted store is approved. |
| `PUBLIC_OFFERS_V1` | `off` | Feature flag for surface promotion of offers. Off until SLOs and source contracts exist. |
| `PUBLIC_COMPATIBILITY_V1` | `false` | Reserved for Block 9 compatibility graph; use `false` when disabled and `true` when enabled. Block 8 does not activate it. |
| `PUBLIC_TREND_INGESTION_V1` | `off` | Feature flag for trend signal ingestion/surfacing. Off until a verified trend source exists. |

These mirror Phase 5 in [`ROADMAP_PHASES_0_6.md`](ROADMAP_PHASES_0_6.md) exactly, no fictional flags are introduced.

## Permissions and quotas checklist (modelled, not executed)

The schema models `Merchant.authorised` and `OfferSource/TrendSource` exactly so activation can be turned on row-by-row; no anonymous or unauthorised row ever enters scoring:

- `anon`: no offer/trend data access; cannot run any ingestion RPC.
- `authenticated`: read-only authenticated access still gated by the same `offers_v1`/`trend_ingestion_v1` flags; not used in Block 8 surface.
- No Block 8 Edge Function, endpoint authorization, database role, or worker schedule is implemented. The shared helper is not routable and does not consume configuration or secrets.

## Anomaly, freshness, and expiry invariants

- **Timestamps**: strict UTC ISO-8601 only (`YYYY-MM-DDTHH:mm:ssZ`). Date-only and offset forms are rejected at ingestion (`toStrictUtc`); unknown timestamp results stay `unknown`, never `fresh`.
- **Offer coherence**: offer ingestion accepts only active canonical offer sources (`manual`, `affiliate-feed`, `amazon-creators-api`), canonical market/currency values, and an exact known variant and authorised merchant whose market and currency both match the input. It also requires an existing authorised, non-anomalous snapshot matching the offer's variant, merchant, and price before the offer can be promoted or scored. It never substitutes US/USD for conflicting input.
- **Freshness windows** (`FRESHNESS_WINDOWS_MS`): price 7d, availability 24h, trend 14d, history 90d. `Offer.availabilityCapturedAt` is a strict UTC observation separate from price `capturedAt`; promotion requires fresh price and availability, `availability='in-stock'`, `lifecycle='active'`, and `review='approved'`. A stale or expired offer is `suppressed` at ingestion; `override_promote` may set active/approved only after its fresh in-stock inputs are rechecked.
- **Anomaly** (`ANOMALY_DEFAULTS`): relative threshold 40%, MAD outlier 5× over the clustered history, absolute floor 0.5 and ceiling 1,000,000. Anomalous rows are **kept for audit, never dropped**, but excluded from DealScore/TrendScore.
- **Partial-failure isolation**: a batch reduces per row; a failing row never aborts the surrounding rows. Good, rejected, duplicate, and anomalous outcomes are independent.

## Score contract (documented, deterministic, explainable)

- **DealScore**: four factors with documented weights — `discount_vs_list` (0.40), `discount_vs_floor` (0.35), `shipping` (0.10), `coupon_uplift` (0.15) — plus penalties for missing `listPrice`, insufficient history, or non-free shipping. Coupon uplift applies only to percentage coupons whose strict-UTC `expiresAt` is after the supplied `now` and whose `conditionsSatisfied` is explicitly `true`; missing, expired, or conditionally unknown coupons add zero. `lowest_price` requires (a) ≥3 authorised good snapshots in the 90-day history window and (b) a fresh, active, approved, in-stock offer; otherwise the label collapses to `unknown` and the floor claim explicitly says so. There is **no "best ever" or "super deal" label** in the schema, and the contracts forbid producing any such label from Block 8 inputs.
- **TrendScore**: a weighted-centroid aggregation of non-anomalous, fresh (≤14d) signals. `rising`/`falling` require ≥2 authorised signals and a centroid magnitude ≥0.01; fewer signals, anomalous-only batches, or signals outside the trend window collapse to `unknown`. `stable` is published only when verified and flat.
- **Determinism**: there is no `Math.random`, no `Date.now`, no time drift inside scoring; the caller passes `now` and the breakdown is byte-for-byte reproducible (asserted in `test/block8-scoring.test.mjs`).
- **Confidence**: derives from freshness and history volume — `high` requires ≥3 snapshots and a `listPrice`; returns to `unknown` when the offer is not promotable or when history is empty.

## Admin review/override contract and audit trail

The `admin.ts` contract is fail-closed. An admin may:

| Action | Effect | Block condition |
| --- | --- | --- |
| `override_promote` | `lifecycle=active`, `review=approved` | **Blocked** unless the candidate state has fresh price and availability, is `in-stock`, and can become active/approved. Outcome `blocked_stale`, never alters state. |
| `override_suppress` | `lifecycle=suppressed`, `review=rejected` | Always allowed. |
| `expire_now` | `lifecycle=expired` (terminal) | Always allowed. |
| `reset` | `lifecycle=pending_review`, `review=unknown` | Always allowed (revert to ingestion baseline). |
| `anomaly_acknowledge` | clears `TrendSignal.anomaly` (soft false positive) | Only when anomaly was previously `true`; idempotent `no_change` otherwise. |

Every action (applied or blocked) writes an immutable `AdminAuditEntry` with `target`, `action`, `actorId`, `recordedAt`, touched `fields`, and `before`/`after` snapshots. `verifyAuditTrail` rejects entries claiming touched fields without matching before/after content. The score is recomputed from the updated inputs; an admin can **never** override the score directly or fabricate a `lowest_price` claim without the underlying proof (history + freshness).

## Ingestion endpoint status

No offer-ingestion Edge Function or endpoint is implemented. `offer-ingestion-core.js` is a pure, non-routable policy helper and does not authenticate requests, claim jobs, persist outcomes, consume a secret, or call an external connector. The local contract derives FNV-1a keys from canonical content and dedupes within and across supplied batches. Its retry policy uses exponential backoff (base 1s, bounded full jitter, capped at 5 min); tests inject the random source for determinism.

## Rollback and incident response

The feature flags are already `off`; no Block 8 worker schedule, endpoint, or production state exists to roll back. If a future activation adds durable state, its rollback plan must be reviewed separately before activation.

## Activation gate (awaiting human decisions)

1. Obtain explicit product, privacy, and data-governance approval for offer/trend publication.
2. Obtain a current, officially documented feed/API contract (affiliate-feed or Amazon successor) with reviewed OAuth scopes/permissions, quota, attribution, retention, and SLO.
3. Design and approve a fail-closed ingestion endpoint, its secret handling, and the vetted durable store (`DATA_STORE_URL`).
4. Populate at least one `Merchant.authorised=true` row with reviewed `affiliateTag` consistent with [`COMMERCIAL_LINK_RUNBOOK.md`](COMMERCIAL_LINK_RUNBOOK.md).
5. Validate ingestion idempotency, dedupe, freshness, anomaly, retry/backoff, and admin override/audit against fixture-equivalent data first.
6. Receive explicit authorization for a staged toggle (`offers_v1`/`trend_ingestion_v1`) of one product cluster only.

Until every gate is met, `lowest_price`/`good_deal`/`rising`/`falling`/`stable` are emit at most for local/mock fixtures in tests; surface pages keep "Price last checked" and "Price snapshot" copy from the existing commercial-data contract. Amazon account state, revenue, conversion, dashboards, and provider metrics remain `Unknown`.
