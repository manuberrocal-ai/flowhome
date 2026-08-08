# FlowHome Roadmap: Phases 0–6

This roadmap sequences the remaining work without implementing later systems. `Completed` means existing evidence is recorded; `Technically tested` means local contracts or checks exist; `Not started`, `Externally blocked`, and `Time/volume-dependent` are explicit states, not success claims.

## Phase summary

| Phase | Scope | State | Dependency |
| --- | --- | --- | --- |
| 0 | Verified foundations, P0–P2, security | Completed / technically tested | Existing repository evidence |
| 1 | Baseline, ownership, and this scorecard | Technically tested / not started for assignments | Phase 0 |
| 2 | Commercial links and consent analytics | Not started / externally blocked | Phase 1, account permissions |
| 3 | Technical SEO, performance, editorial E-E-A-T, GEO | Technically tested locally; externally/time blocked for validation | Phases 1–2 |
| 4 | Funnel experiments, optional CRM, and local/mock lifecycle preparation | Baseline and Block 7 local/mock lifecycle technically tested; activation and outcomes Unknown/not started/time-volume-dependent | Consent-safe analytics and traffic |
| 5 | Offer/trend, compatibility, data platform/governance | Blocks 8–10 contracts technically tested locally; activation and outcomes Unknown / externally blocked | Phases 2–4 and source access |
| 6 | Multichannel, SLOs/runbooks, 90-day validation | Blocks 11 local/mock and Block 12 operational contracts technically closed; Phase 6, D90 validation, and outcomes remain incomplete / externally blocked / time-volume-dependent | Phases 2–5 and comparable data |

Remaining prompts for later blocks: [`REMAINING_WORK_PROMPTS.md`](REMAINING_WORK_PROMPTS.md). Baseline: [`BASELINE_SCORECARD.md`](BASELINE_SCORECARD.md). Organic runbook: [`ORGANIC_GROWTH_RUNBOOK.md`](ORGANIC_GROWTH_RUNBOOK.md).

## Phase 0 — Verified foundations and P0–P2/security

- **State:** Completed / technically tested. P0–P2 evidence is in [`P2_COMPLETION_REPORT.md`](P2_COMPLETION_REPORT.md); security is in [`DEPENDENCY_SECURITY.md`](DEPENDENCY_SECURITY.md).
- **Dependencies:** Existing source, tests, local Node environment, and the dependency/security block.
- **Migrations:** None. Do not migrate production data.
- **Environment variables:** None required for the local evidence; external credentials remain outside the repository.
- **Feature flags:** Existing behavior and reduced-motion boundaries; no new flag.
- **Tests:** Existing test, lint, typecheck, build, browser QA, and dependency audit gates.
- **Definition of Done:** Evidence remains reproducible, no P0–P2 regression, and zero production audit findings remain recorded.
- **Observability:** Local command output and browser report only; no claim of deployed monitoring.
- **Rollout:** None in this phase.
- **Rollback:** Revert the relevant P0–P2/security block and rerun its gates.
- **External blockers:** Remote CI execution and deployment evidence are not observed here.

## Phase 1 — Baseline and ownership

- **State:** Technically tested for the artifact; assignments not started. Scorecard: [`BASELINE_SCORECARD.md`](BASELINE_SCORECARD.md).
- **Dependencies:** Phase 0 evidence, source-specific organic tracker, and human owners.
- **Migrations:** Additive CSV/docs only; preserve `data/organic-growth-scorecard.csv` unchanged.
- **Environment variables:** None for local parsing; future GSC, GA4, Bing, and Amazon access variables are `Unknown` until approved and configured externally.
- **Feature flags:** None.
- **Tests:** Focused scorecard/roadmap test plus existing `npm.cmd test`.
- **Definition of Done:** Exact schema, 14 areas, evidence links, allowed statuses, role states, cadence, and 90-day protocol are present; no invented metrics.
- **Observability:** Versioned CSV and dated evidence paths; compare like-for-like windows.
- **Rollout:** Review locally, then assign roles; no external publication is implied.
- **Rollback:** Revert only the additive scorecard/roadmap artifacts.
- **External blockers:** Human ownership, current exports, and account permissions.

## Phase 2 — Commercial links and consent analytics

- **State:** Commercial contracts technically tested; provider activation externally blocked.
- **Dependencies:** Phase 1 ownership; affiliate and analytics account permissions; consent policy review.
- **Migrations:** Define event and link contracts before changing production tracking; no data backfill without source evidence.
- **Environment variables:** `GA4_MEASUREMENT_ID=Unknown`, `GTM_CONTAINER_ID=Unknown`, and provider credentials held externally. `flowhome-20` is a known public code constant, not a secret environment variable. The existing analytics build contract is `PUBLIC_GTM_ID`, configured through GitHub/Cloudflare; provider/account activation remains `Unknown` and externally blocked.
- **Feature flags:** No fictional runtime flags. The actual analytics gate is a non-empty `PUBLIC_GTM_ID` plus explicit accepted consent; direct Amazon links are always direct and locally checked.
- **Tests:** Event-once, consent states, no PII in URLs/logs, navigation does not wait for analytics, broken-link fixtures, and mocked provider boundaries.
- **Definition of Done:** Contracts, local adapter/mock tests, manual activation steps, alert/runbook, and rollback are reviewed; provider data remains Unknown/external and no fake production data is claimed.
- **Observability:** Event counts, consent-state coverage, broken CTA rate, and provider error logs without PII.
- **Rollout:** Local mocks, then internal/staged activation after permission; no deployment here.
- **Rollback:** Remove `PUBLIC_GTM_ID` from the deployment environment or revoke consent, then restore the previous link/event contract if required.
- **External blockers:** Account access, consent approval, provider permissions, and deployment.

## Phase 3 — SEO, performance, editorial E-E-A-T, and GEO

- **State:** Block 4 build-output crawl/schema/image controls and Lighthouse 13.4.1 three-sample local medians are technically tested. Field CWV, deployed redirects/headers/status codes, search validation, and outcome validation remain `Unknown` or externally/time-volume blocked; see [`SEO_PERFORMANCE_AUDIT.md`](SEO_PERFORMANCE_AUDIT.md) and [`BLOCK4_COMPLETION_REPORT.md`](BLOCK4_COMPLETION_REPORT.md).
- **Dependencies:** Phase 1 baseline; Phase 2 consent-safe analytics where measurement is needed.
- **Migrations:** Additive metadata/content evidence and measurement records; no mass rewrite or index submission by default.
- **Environment variables:** `GSC_PROPERTY=Unknown`, `BING_SITE=Unknown`, `LIGHTHOUSE_CI_URL=Unknown`.
- **Feature flags:** `seo_change_v1=off`, `editorial_experiment_v1=off` until review.
- **Tests:** Canonical/robots/sitemap/JSON-LD checks, CWV/Lighthouse when available, editorial decision contracts, and page-level accessibility checks.
- **Definition of Done:** One evidence-backed useful change has a before/current record, technical checks pass, and validation window is scheduled; no lift claim.
- **Observability:** Indexation, impressions, CTR, position, CWV, content changes, and GEO/citability observations by comparable window.
- **Rollout:** One page or small reviewed change; hold broad rollout until 2–4 week evidence exists.
- **Rollback:** Revert the page-level change and restore prior metadata/content.
- **External blockers:** Search tools, current exports, deployment, formal accessibility/performance review, and sufficient volume.

## Phase 4 — Funnel experiments and local/mock lifecycle preparation

- **State:** Funnel baseline technically tested. Block 7 lifecycle is locally/mock technically tested (231/231 tests, lint PASS, typecheck 0 errors/0 warnings, build 88, browser 19/19); provider activation and all outcomes remain Unknown/not started/time-volume-dependent.
- **Dependencies:** Consent analytics, stable commercial links, baseline segments, and sufficient comparable traffic.
- **Migrations:** Version experiment assignments and event schemas; CRM import is optional and must be approved. Lifecycle migration/RLS is prepared locally but not applied.
- **Environment variables:** `EXPERIMENT_ASSIGNMENT_KEY` is not needed; assignment uses a consented session ID, and experiment env flags are public/off. Lifecycle uses server-only secrets documented in `BLOCK7_LIFECYCLE_RUNBOOK.md`; no provider adapter or provider credential is configured. Edge Functions are prepared locally but not deployed.
- **Feature flags:** `PUBLIC_FUNNEL_EXPERIMENT_V1=off`, `PUBLIC_HOME_PRIMARY_CTA_V1=off`, `crm_sync_v1=off`; the only registered experiment remains draft.
- **Tests:** Deterministic assignment, exposure-before-outcome, consent/no-PII, holdout, duplicate event, and provider failure tests; Block 7 local gates are recorded in [`BLOCK7_COMPLETION_REPORT.md`](BLOCK7_COMPLETION_REPORT.md).
- **Definition of Done:** Block 6 contract, deterministic assignment, consent gate, exposure rollback, and focused tests pass locally. Local technical DoD is complete; approval, activation, and results remain Unknown/not started/time-volume-dependent until approval and volume exist.
- **Observability:** Exposure, funnel steps, errors, consent coverage, and sample balance.
- **Rollout:** Internal mock, then small staged audience only after approval; never infer success from early movement.
- **Rollback:** Turn off either experiment flag, preserve raw evidence, and restore control.
- **External blockers:** Traffic volume; consent/analytics approval; provider credentials; sending-domain/DNS and SPF/DKIM/DMARC verification; privacy/retention approval; activation approval; deployment.
- **Lifecycle provider:** The mock boundary is implemented and fail-closed; no real provider is configured. Activation and delivery/open/click/conversion evidence remain Unknown.

## Phase 5 — Offers, trends, compatibility, and data governance

- **State:** Offer/trend contracts (Block 8) are technically tested locally with deterministic ingestion, scoring, freshness, anomaly, retry/backoff, partial-failure isolation, admin override/audit, and fixture data — see [BLOCK8_OFFER_TREND_RUNBOOK.md](BLOCK8_OFFER_TREND_RUNBOOK.md) and [BLOCK8_COMPLETION_REPORT.md](BLOCK8_COMPLETION_REPORT.md). Compatibility graph, Claim Ledger, contradiction/expiry checks, audited review, and verified quiz/comparison/alternatives/product-page integration (Block 9) are also technically tested locally — see [BLOCK9_COMPATIBILITY_RUNBOOK.md](BLOCK9_COMPATIBILITY_RUNBOOK.md) and [BLOCK9_COMPLETION_REPORT.md](BLOCK9_COMPLETION_REPORT.md). Block 10 is locally and technically closed under [BLOCK10_COMPLETION_REPORT.md](BLOCK10_COMPLETION_REPORT.md), with shared-data, queue/DLQ, rate-limit/trace/alert, RBAC/audit, bounded automation, prepared migration/rollback, and threat-model contracts recorded in its runbook and threat model. Blocks 8–10 remain fixture/local preparation for external purposes: source activation, production connectors/graphs, governance execution, migration application, deployment, outcomes, and time-volume validation remain Unknown / externally blocked / time-volume-dependent. The Blocks 0–9 audit remains its own report and is not replaced by Block 10 closure.
- **Dependencies:** Source access, Phase 2 link telemetry, Phase 3 editorial evidence, Phase 4 experiment contracts.
- **Migrations:** Version catalog/offer schemas and data retention rules; no destructive migration.
- **Environment variables:** `OFFER_SOURCE=Unknown`, `TREND_SOURCE=Unknown`, `DATA_STORE_URL=Unknown`.
- **Feature flags:** `offers_v1=off`, `compatibility_v1=off`, `trend_ingestion_v1=off`.
- **Tests:** Freshness/expiry, compatibility matrix, source attribution, ingestion idempotency, schema validation, and retention tests.
- **Definition of Done:** Source contracts, ownership, freshness SLO, governance/retention, anomaly handling, and rollback are reviewed with real source evidence.
- **Observability:** Ingestion lag, stale offers, source errors, compatibility anomalies, and provenance.
- **Rollout:** Fixture data first; staged source activation only with permission.
- **Rollback:** Disable ingestion/flags and retain last known valid snapshot.
- **External blockers:** Provider APIs/exports, permissions, data volume, and legal/privacy review.

## Phase 6 — Multichannel, SLOs/runbooks, and 90-day validation

- **State:** Block 11 local/mock is technically closed; Block 12 local operational contracts technically prepared/closed. Phase 6 is not complete; 90-day/business outcomes remain not validated, externally blocked, or time-volume-dependent.
- **Dependencies:** Stable phases 2–5, owners, deployment, alert channels, and comparable 90-day data.
- **Migrations:** Additive runbook, alert, and reporting records; no channel migration without ownership and consent.
- **Environment variables:** `ALERT_CHANNEL=Unknown`, `PUBLIC_BASE_URL=Unknown`, `SLO_REPORT_STORE=Unknown`.
- **Feature flags:** `multichannel_v1=off`, `slo_alerts_v1=off`.
- **Tests:** SLO probes, alert routing, runbook drills, rollback, channel consent, anomaly, and report reproducibility tests.
- **Definition of Done:** Runbooks, SLOs, severity/response targets, 90-day report, bias notes, and provisional decisions are reviewed; no early success claim.
- **Observability:** Availability, broken CTAs, expired offers, ingestion lag, CWV, indexation, traffic/conversion/citability, consent/security incidents, and anomalies.
- **Rollout:** Dry-run reports, then staged channels after manual approval.
- **Rollback:** Disable channel/alerts, restore prior routing, and preserve evidence.
- **External blockers:** Accounts, deployment, alert infrastructure, sample size, and calendar time.

## Ownership matrix and cadence

| Workstream | Owner | Assignment state | Reviewer | Escalation |
| --- | --- | --- | --- | --- |
| Product scope and decisions | Product owner (unassigned) | Unassigned | Engineering owner (unassigned) | Phase gate |
| UX/accessibility | UX owner (unassigned) | Unassigned | Accessibility owner (unassigned) | Critical usability defect |
| Engineering/reliability | Engineering owner (unassigned) | Unassigned | Security owner (unassigned) | Failed gate |
| SEO/editorial/GEO | Growth owner (unassigned) / Editorial owner (unassigned) | Unassigned | Product owner (unassigned) | Evidence or quality gap |
| Analytics/commercial | Analytics owner (unassigned) / Commercial owner (unassigned) | Unassigned | Privacy reviewer (unassigned) | Consent or attribution issue |
| Data/automation | Data owner (unassigned) | Unassigned | Engineering owner (unassigned) | Freshness or pipeline failure |

- **Daily:** review production/error signals only when available; record `Unknown` when unavailable; no interpretation from one-day movement.
- **Weekly:** snapshot the scorecard, check technical/indexing/broken links, review 2–3 useful editorial slots, and record changes and blockers.
- **Monthly:** compare like-for-like windows, review ownership/flags/runbooks, and decide continue, revise, defer, or stop.
- **Quarterly:** audit governance, access, SLOs, bias, retention, and roadmap state; approve or reject the next phase.

## Provisional 90-day validation protocol

1. **Windows:** capture a pre-period baseline, then weekly snapshots and 30/60/90-day like-for-like comparisons. Keep source, country, device, attribution, and release dates constant where possible.
2. **Minimum samples:** technical checks require one reproducible run per release; directional search/conversion decisions require at least two comparable windows and a pre-agreed minimum of 30 outcome events per primary segment. If that volume is not reached, state `time_volume_dependent` and do not decide success.
3. **Segments:** US/Canada, source (GSC/Bing/GA4/Amazon), device, landing-page cluster, consent state, and experiment arm. Never merge unlike source metrics.
4. **Intervals:** report 95% confidence intervals for proportions/rates; use bootstrap or an explicitly documented count model for sparse continuous metrics. Zero or one event gets an interval and a caution, not a success claim.
5. **Bias notes:** seasonality, country mix, device mix, consent loss, bot/filter differences, attribution windows, release timing, selection into affiliate clicks, survivorship, and small samples can bias comparisons.
6. **Decision states:** `continue`, `revise`, `defer`, `stop`, or `externally_blocked`; each decision must cite the window, sample, interval, segment, and evidence. Provisional means subject to the next comparable window.

No phase in this document authorizes account operations, deployment, external publishing, credential creation, or implementation of later systems.

## Block 7 lifecycle boundary

The Block 7 schema, preference UI, mock provider, worker, webhook verifier, and runbook are local/mock technical preparation only. Migration/RLS and Edge Functions are prepared locally but were not applied/deployed. `EMAIL_PROVIDER=mock` is fail-closed. A real provider remains blocked until credentials, verified sending domain, SPF/DKIM/DMARC, privacy/retention approval, and explicit human authorization are all present; this does not authorize any later roadmap phase.

## Post-audit verification (2026-08-01)

Cross-block local technical audit for Blocks 0–9: **complete**. The dual-blind Judgment Day method, corrected categories, and current gates are recorded in [`BLOCKS_0_9_AUDIT_REPORT.md`](BLOCKS_0_9_AUDIT_REPORT.md); that audit remains its own report. Block 10 is locally and technically closed under [`BLOCK10_COMPLETION_REPORT.md`](BLOCK10_COMPLETION_REPORT.md), while its migration was not applied and external activation, providers, sources, production graphs, deployment, clean-checkout remote CI, outcomes, and time/volume validation remain `Unknown` or externally blocked. Block 11 is local/mock technically closed under [`BLOCK11_COMPLETION_REPORT.md`](BLOCK11_COMPLETION_REPORT.md); Block 12 local operational contracts technically prepared/closed under [`BLOCK12_FINAL_REPORT.md`](BLOCK12_FINAL_REPORT.md). Phase 6 is not complete, and 90-day/business outcomes remain not validated, externally blocked, or time-volume-dependent.

## Append-only revalidation (2026-08-08)

The Block 10 approval-reason boundary and Block 12 runtime gate input validation were corrected locally. The visible skip-link destination now receives programmatic focus; the prior Block 11 present-tense statement about Block 12 was qualified as historical. Local revalidation recorded 476/476 tests PASS, lint PASS, typecheck 202 files with 0 errors / 0 warnings / 155 hints, build 88, quality check 15 review files PASS, SEO 88/0/0 PASS, links 0 stale / 5 unknown PASS, `npm audit --omit=dev` 0 vulnerabilities after the transitive lock updates to `js-yaml` 4.3.1 and `nanoid` 3.3.18, and diff-check PASS. Browser QA revalidation passed 20/20 in Brave with 0 failures and 0 setup errors. No Lighthouse, production, deployment, account, credential, or external-outcome claim is added.
