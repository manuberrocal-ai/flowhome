# Block 8 Offer/Trend Runbook

V3 local correction (2026-09-04): see [the six-finding verification record](audit/flowhome-block8-gaps-v3.md). This supersedes the earlier seven-day price, implicit history, and legacy-key assumptions; it does not activate Block 8.

## Operating boundary

This Block 8 implementation is **local/mock technical preparation only**. It models authorized offer/price/trend data and explainable DealScore/TrendScore contracts in pure TypeScript + tests, plus a non-routable shared ingestion policy helper (`supabase/functions/_shared/offer-ingestion-core.js`). There is no offer-ingestion Edge Function, endpoint, worker schedule, durable store, or secret consumption. It makes **no network request, scrapes no retailer/social platform, connects no unapproved API, and contains no production data**. All data lives in fixtures in [`data/blocks/block8/fixtures.json`](../data/blocks/block8/fixtures.json) and is explicitly marked "NOT production data."

`OFFER_SOURCE`, `TREND_SOURCE`, and `DATA_STORE_URL` are deliberately set to `Unknown`; `PUBLIC_OFFERS_V1` and `PUBLIC_TREND_INGESTION_V1` remain `off`, while `PUBLIC_COMPATIBILITY_V1=false` is disabled and `true` is enabled, until externally approved and configured. Activation requires every gate below.

## Source contract (Phase 5 of [`ROADMAP_PHASES_0_6.md`](ROADMAP_PHASES_0_6.md))

External sources stay `Unknown` until a current, official, reviewed feed is available. Today, only `manual` ingestion of reviewed data is accepted locally. The two named sources in the schema (`affiliate-feed`, `amazon-creators-api`) are reserved types and require explicit activation.

- **`affiliate-feed`**: a contractual, paid or affiliate-network feed carrying price/availability/affiliate URL/ShippingTerms in a documented schema with attribution and quota. Activation requires the network agreement, the official feed spec, an approved ingestion endpoint, and a documented SLO/retention policy.
- **`amazon-creators-api` (or its current Amazon successor)**: the official program API/auth flow. Activation requires current official documentation, OAuth credentials, the exact scopes/permissions reviewed, quota/limits observed, and the manual fallback described below. We never scrape Amazon; we never use the Associates tag as an authorization bypass.

Real provider credentials, endpoint URLs, account permissions, sending-domain/DNS verification (when applicable), privacy/retention approval, and Block 8 activation remain **blocked externally**. No provider adapter is instantiated by Block 8 until all activation gates below pass.

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
- **Offer coherence**: current offers require `CommercialEvidenceContext`: a unique authorised merchant/variant, exact market/currency, a full linked non-anomalous snapshot, matching source, price/list price and capture, and one current approved `SourcePermission`. Manual snapshots remain local records only and cannot promote. Payload source labels never create permissions. Missing context, revoked/ambiguous permission or changed evidence fails closed on ingestion, promotion and scoring.
- **Freshness windows** (`FRESHNESS_WINDOWS_MS`): current price and availability are strictly less than 24h, narrowed by permission; trend is strictly less than 14d. History has no default permission (`0`). Invalid calendars, future captures, invalid reference instants and malformed/inverted/excessive expiry are rejected. Missing expiry is bounded by capture + permission TTL and permission expiry. Stale offers are rejected without retaining their commercial fields in the outcome. Independent stock capture must also fit the source permission. An override cannot extend any boundary.
- **Shared policy**: commercial ceilings come from `src/lib/commercial-policy.ts`, also consumed by the public projection and Block12. Follow the [freshness and retention policy](data/commercial-freshness-policy.md); neither daily reviews nor restores renew captures.
- **Anomaly** (`ANOMALY_DEFAULTS`): relative threshold 40%, MAD outlier 5× over the clustered history, absolute floor 0.5 and ceiling 1,000,000. Anomalous outcomes are excluded from DealScore/TrendScore. Audit retention must remain within source permissions; this is not permission to keep restricted commercial fields indefinitely. Durable expiry/purge is not implemented by this local contract.
- **Partial-failure isolation**: a batch reduces per row; a failing row never aborts the surrounding rows. Good, rejected, duplicate, and anomalous outcomes are independent.

## Score contract (documented, deterministic, explainable)

- **DealScore**: four factors retain weights `discount_vs_list` (0.40), `discount_vs_floor` (0.35), `shipping` (0.10), `coupon_uplift` (0.15). No commercial evidence means no factors or claim. A historical floor additionally requires a separate reviewed history permission, an explicit retention period, at least three distinct linked observations of the same variant/merchant/market/currency/source and a current promotable offer. Identity, ID/key and canonical-observation dedupe are checked, including renamed duplicates. Amazon observations never exceed 24h; API access/cache permission alone does not grant historical floor rights. A licensed-feed history example is synthetic only. Missing permission/evidence means `unknown`, not a guessed floor. Coupons still require a strict future expiry and explicitly satisfied conditions. No "best ever" or "super deal" label exists.
- **TrendScore**: a weighted-centroid aggregation of non-anomalous, fresh (<14d) signals. `rising`/`falling` require ≥2 authorised signals and a centroid magnitude ≥0.01; fewer signals, anomalous-only batches, or signals outside the trend window collapse to `unknown`. `stable` is published only when verified and flat.
- **Determinism**: there is no `Math.random`, no `Date.now`, no time drift inside scoring; the caller passes `now` and the breakdown is byte-for-byte reproducible (asserted in `test/block8-scoring.test.mjs`).
- **Confidence**: derives from freshness and history volume — `high` requires ≥3 snapshots and a `listPrice`; returns to `unknown` when the offer is not promotable or when history is empty.

## Admin review/override contract and audit trail

The `admin.ts` contract is fail-closed. An admin may:

| Action | Effect | Block condition |
| --- | --- | --- |
| `override_promote` | `lifecycle=active`, `review=approved` | **Blocked** unless the target ID matches, lifecycle is not terminal-expired, and the current evidence context validates source permission, linked snapshot, price and stock. Outcome `blocked_stale`, never alters state. |
| `override_suppress` | `lifecycle=suppressed`, `review=rejected` | Always allowed. |
| `expire_now` | `lifecycle=expired` (terminal) | Always allowed. |
| `reset` | `lifecycle=pending_review`, `review=unknown` | Always allowed (revert to ingestion baseline). |
| `anomaly_acknowledge` | clears `TrendSignal.anomaly` (soft false positive) | Only when anomaly was previously `true`; idempotent `no_change` otherwise. |

Every action (applied or blocked) writes an immutable `AdminAuditEntry` with `target`, `action`, `actorId`, `recordedAt`, touched `fields`, and `before`/`after` snapshots. `verifyAuditTrail` rejects entries claiming touched fields without matching before/after content. The score is recomputed from the updated inputs; an admin can **never** override the score directly or fabricate a `lowest_price` claim without the underlying proof (history + freshness).

## Ingestion endpoint status

No offer-ingestion Edge Function or endpoint is implemented. `offer-ingestion-core.js` is a pure, non-routable policy helper and does not authenticate requests, claim jobs, persist outcomes, consume a secret, or call an external connector. The server-only local contract derives `prefix:v2:<sha256>` keys from typed canonical material content and dedupes within and across supplied batches. Legacy key sets block ingestion, and Block10 blocks new enqueue over legacy jobs until explicitly reconciled; existing jobs can finish under their original identity. No records are migrated, deleted or silently re-keyed. The future store must enforce uniqueness, payload equivalence and atomic writes. Retry policy remains exponential backoff (base 1s, bounded full jitter, capped at 5 min).

Permissions in the local context must come from a reviewed trusted registry, never a provider payload. These pure functions do not authenticate that registry or purge a store. Before any persistence, implement source-specific deletion/refresh at the permitted bound, avoid retaining Amazon Product Advertising Content in long-lived reports/history, and validate the actual source contract. The 24h ceiling is not a history license.

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
