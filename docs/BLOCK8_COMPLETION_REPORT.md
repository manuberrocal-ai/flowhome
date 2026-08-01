# Block 8 Completion Report — Offer/price/trend data and explainable DealScore/TrendScore contracts (local/mock)

Date: 2026-07-30

## Scope and boundary

Block 8 implements the authorized offer/price/trend data model and the explainable DealScore/TrendScore baseline contracts as **local/mock technical preparation only**. It models `ProductVariant`, `Merchant`, `Offer`, `PriceSnapshot`, `TrendSignal`, `TrendTopic`, and `DealCandidate` with market/currency, shipping, coupons/conditions, availability, affiliate URL, source, capturedAt, history windows, confidence, and lifecycle/review states. It implements idempotent ingestion with dedupe, variant resolution, freshness/expiry, anomaly detection, retry/backoff, partial-failure isolation, and an admin review/override contract with an audit trail. It never labels "lowest price", "best ever", or "super deal" without sufficient authorised history and fresh verification. No Block 9 work is included.

Production activation, source connectors, real offers, and outcome metrics are **not started and externally blocked**; see [`BLOCK8_OFFER_TREND_RUNBOOK.md`](BLOCK8_OFFER_TREND_RUNBOOK.md). No commit, push, deploy, external-feed activation, scraping, or fabrication of production data occurred.

## Prompt → artifact/evidence checklist

| Prompt requirement | Artifact | Evidence/status |
| --- | --- | --- |
| Model ProductVariant/Merchant/Offer/PriceSnapshot/TrendSignal/TrendTopic/DealCandidate | `src/lib/blocks/block8/domain.ts` | All seven entities plus enums; loaded and imported by all tests. |
| Market, currency, shipping, coupons/conditions, availability, affiliate URL, source, capturedAt | `domain.ts` | `MarketCode`/`CurrencyCode` enums, `ShippingTerms`, `Coupon`, `AvailabilityStatus`, `OfferSource`/`TrendSource`, strict-UTC `capturedAt`. |
| History windows, confidence, lifecycle and review states | `domain.ts`, `freshness.ts` | `FRESHNESS_WINDOWS_MS` (price 7d/availability 24h/trend 14d/history 90d), `ConfidenceLevel` (high/medium/low/unknown), `OfferLifecycle` (pending_review/active/suppressed/expired/unknown), `ReviewVerdict`. |
| Idempotent ingestion interfaces and fixtures | `ingestion.ts`, `data/blocks/block8/fixtures.json` | Content-based FNV-1a idempotency keys; fixtures explicitly marked "NOT production data" and validated by `test/block8-ingestion.test.mjs`. |
| Deduplication | `ingestion.ts` `ingestPriceSnapshots`/`ingestOffers`/`ingestTrendSignals` | Duplicate-key detection covered by `test/block8-ingestion.test.mjs` (snapshot/offer/trend dedupe). |
| Variant resolution | `ingestion.ts` `resolveVariant` | Authorised marketplace-id-only matching; fuzzy name rejected; `test/block8-ingestion.test.mjs`. |
| Freshness and expiry | `freshness.ts` | `isPriceSnapshotFresh`/`evaluateOfferFreshness`/`isTrendSignalFresh`/`isOfferPromotable`; covered by `test/block8-freshness.test.mjs`. |
| Anomaly detection | `anomaly.ts` `detectPriceAnomaly` | Relative threshold + MAD outlier + absolute floor/ceiling; covered by `test/block8-anomaly.test.mjs`. |
| Retry and backoff | `retry.ts`, `supabase/functions/_shared/offer-ingestion-core.js` | Exponential backoff with bounded full jitter, `safeToRetry` gating, dead after `MAX_ATTEMPTS=5`; covered by `test/block8-retry.test.mjs`. |
| Partial-failure isolation | `ingestion.ts` | Per-row outcomes; `summariseIngestion`; covered by `test/block8-ingestion.test.mjs` (good/rejected/anomaly interleave). |
| Explainable DealScore/TrendScore baselines | `scoring.ts` `computeDealScore`/`computeTrendScore` | Weighted factors with reason strings; covered by `test/block8-scoring.test.mjs` (14 tests). |
| Documented inputs, weights, penalties, confidence | `scoring.ts`, `docs/BLOCK8_OFFER_TREND_RUNBOOK.md` | `DEAL_SCORE_WEIGHTS` (discount_vs_list 0.40, discount_vs_floor 0.35, shipping 0.10, coupon_uplift 0.15), penalties, `MIN_HISTORY_FOR_FLOOR_CLAIM=3`, `TREND_SCORE_THRESHOLDS`, `ConfidenceLevel` derivation. |
| Admin review/override contract and audit trail | `admin.ts` `applyOverride`/`verifyAuditTrail` | `override_promote` blocked on stale (cannot force promotion), `override_suppress`/`expire_now`/`reset`/`anomaly_acknowledge`, audit `before`/`after`; covered by `test/block8-admin.test.mjs` (13 tests). |
| Never label "lowest price"/"best ever"/"super deal" without sufficient authorised history and fresh verification | `scoring.ts`, `admin.ts` | `lowest_price` requires ≥3 good snapshots and a promotable offer; no "best ever"/"super deal" labels in the schema; admin override cannot bypass freshness. Asserted by `test/block8-scoring.test.mjs` and `test/block8-admin.test.mjs`. |
| Deterministic scores and state transitions | `scoring.ts`, `admin.ts` | No `Math.random`/`Date.now` inside scoring or admin; `test/block8-scoring.test.mjs` asserts byte-for-byte determinism. |
| Stale or expired offers cannot be promoted | `freshness.ts` `isOfferPromotable`, `admin.ts` | Strict `promotable=false` for stale/expired/suppressed/unknown lifecycle or `rejected` review; admin `override_promote` returns `blocked_stale`. |
| Unknown remains Unknown | `freshness.ts`, `scoring.ts`, `admin.ts` | `unknown` lifecycle never promotable; missing timestamp/character returns `unknown_captured_at`; insufficient history collapses `lowest_price` to `unknown`. |
| No fabricated production data | `data/blocks/block8/fixtures.json` | `_meta.purpose` explicitly says "NOT production data"; synthetic ASINs/timestamps. |
| Source failures are isolated | `ingestion.ts`, `offer-ingestion-core.js` | Per-row outcomes and pure retry policy; no endpoint, provider, or external connector is implemented. |
| External feeds document official API, permissions, quotas, variables, mocks, activation steps | `docs/BLOCK8_OFFER_TREND_RUNBOOK.md` | Source contract (`affiliate-feed`/`amazon-creators-api`), permissions/quotas checklist, env table, activation gate. |
| Tests/lint/typecheck/build/links/audit/diff-check pass; browser QA if UI/runtime changes | All gates below | All pass; browser QA intentionally not run — no UI/runtime change in this block. |

## Final local evidence

| Gate | Command | Result |
| --- | --- | --- |
| Tests | `npm.cmd test` | 297/297 passed (66 new Block 8 tests; baseline was 231/231). |
| Lint | `npm.cmd run lint` | PASS — 0 errors, 0 warnings. |
| Typecheck | `npm.cmd run typecheck` | 0 errors / 0 warnings; 157 files; 155 non-failing hints. |
| Build | `npm.cmd run build` | 88 page(s) built in 3.52s. |
| Link check | `npm.cmd run links:check` | `Affiliate link check passed (0 stale, 5 unknown).` |
| Production dependency audit | `npm.cmd audit --omit=dev` | `found 0 vulnerabilities`. |
| Diff check | `npm.cmd run diff-check` | PASS; LF/CRLF warnings only. |
| Browser QA | n/a | **Intentionally not run.** No `src/pages/*`, `src/components/*`, `src/layouts/*`, or `src/styles/*` change in this block. Block 8 is data/scoring/admin contracts + tests + docs; no runtime/UI surface was modified. |

## New artifacts

- `src/lib/blocks/block8/domain.ts` — entities, enums, confidence/lifecycle/review states, strict-UTC helpers, defaults.
- `src/lib/blocks/block8/freshness.ts` — price/availability/trend/offer freshness & promotability.
- `src/lib/blocks/block8/anomaly.ts` — pure anomaly detection.
- `src/lib/blocks/block8/retry.ts` — pure retry/backoff policy.
- `src/lib/blocks/block8/ingestion.ts` — idempotent ingestion + dedupe + variant resolution + partial-failure isolation.
- `src/lib/blocks/block8/scoring.ts` — explainable DealScore/TrendScore baselines.
- `src/lib/blocks/block8/admin.ts` — admin review/override contract + audit trail.
- `supabase/functions/_shared/offer-ingestion-core.js` — non-routable shared ingestion policy helper.
- `data/blocks/block8/fixtures.json` — test fixtures (no production data).
- `test/block8-domain.test.mjs` (3) · `test/block8-freshness.test.mjs` (8) · `test/block8-anomaly.test.mjs` (7) · `test/block8-retry.test.mjs` (8) · `test/block8-ingestion.test.mjs` (13) · `test/block8-scoring.test.mjs` (14) · `test/block8-admin.test.mjs` (13) — **66 new tests**.
- `docs/BLOCK8_OFFER_TREND_RUNBOOK.md` — source contract, env/flags, permissions, invariants, audit, activation gate.

## Edited artifacts (additive, non-destructive)

- `.env.example` — appended Block 8 contract variables (`OFFER_SOURCE=Unknown`, `TREND_SOURCE=Unknown`, `DATA_STORE_URL=Unknown`, `PUBLIC_OFFERS_V1=off`, `PUBLIC_COMPATIBILITY_V1=false`, `PUBLIC_TREND_INGESTION_V1=off`) below the existing Block 7 entries. No Block 8 worker secret is configured because no endpoint exists.
- `docs/ROADMAP_PHASES_0_6.md` — updated Phase 5 row state and the summary table to reflect Block 8 local technical preparation, with links to the new runbook and this report. Migrations, env, flags, tests, DoD, observability, rollout, rollback, and external blockers unchanged.

## Reused contracts (no duplication)

- `src/lib/deal-state.ts` — `Unknown` never active philosophy reused.
- `src/lib/commerce-data.ts` — strict-UTC freshness windows (price 7d, availability 24h) reused with identical thresholds.
- `supabase/functions/_shared/lifecycle-core.js` — retry/idempotency pattern (`safeToRetry`, dead-after-5, idempotency key) adapted by the pure `offer-ingestion-core.js` helper.

## Deliberate non-activation and external gates

No provider, credential, network call, scrape, Amazon probe, account access, deployment, commit, push, or activation occurred. The `affiliate-feed`/`amazon-creators-api` source types are schema-reserved but **not configured**. `OFFER_SOURCE`/`TREND_SOURCE`/`DATA_STORE_URL` remain `Unknown`. Feature flags remain `off`. Activation requires the gate documented in [`BLOCK8_OFFER_TREND_RUNBOOK.md`](BLOCK8_OFFER_TREND_RUNBOOK.md). Amazon account state, revenue, conversion, dashboards, ingestion lag, and provider metrics remain **Unknown**, not zero.

## Post-audit verification (2026-08-01)

The approved cross-block audit revalidated ingestion, dedupe, strict UTC, coupons, availability, snapshots, anomaly handling, bounded jitter, and admin audit boundaries. Historical counts remain unchanged; see [`BLOCKS_0_9_AUDIT_REPORT.md`](BLOCKS_0_9_AUDIT_REPORT.md).
