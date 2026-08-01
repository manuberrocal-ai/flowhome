# Block 12 — Domain runbooks

## Common triage and safe rollback

For every incident record UTC time, domain, severity, trigger, evidence kind, connection state, affected segment, owner role, and source reference. Separate `real_local`, `synthetic`, `mocked`, `simulated`, `externally_blocked`, and `time_volume_dependent`. Do not include credentials or personal data. First preserve evidence, then run the local check; never mutate external state. Rollback means a pure simulated disable/restore plan; external mode is blocked. Escalate to the pending domain owner, then Engineering and Product; SEV1 also escalates to Security. Use the same postmortem template for every section.

<a id="site_flow_availability"></a>
## Site and critical-flow availability
Triage local test output and the synthetic critical-flow release check. Treat the 99.9%/30d candidate as unmeasured. Simulate disabling the affected flag and restoring the last-known-valid snapshot. Escalate SEV1 to Engineering, Security, and Product.

<a id="broken_retailer_ctas"></a>
## Retailer CTA integrity
Run local CTA/link contracts and mark remote destination status Unknown. Preserve the failing route and fixture. Simulate restoring the prior canonical CTA; do not probe or alter retailer systems. Escalate to Commercial then Engineering.

<a id="expired_offers"></a>
## Offer freshness and expiry
Run the local `deals:detect`/quality checks and identify whether input is fixture or report; this is not productive expiry monitoring. Simulate removing the surfaced offer and restoring the last valid snapshot. Escalate to Data then Engineering.

<a id="ingestion_lag"></a>
## Source ingestion lag
Compare the local/mock lag evidence with the provisional p95≤15m target and record missing sources. Simulate disabling ingestion and retaining the last valid snapshot. Escalate to Data/automation then Engineering; external connectors remain blocked.

<a id="jobs_queues_apis"></a>
## Jobs, queues, and APIs
Check typecheck/tests, idempotency, retry bounds, DLQ and fail-closed invariants. Simulate disabling the job path and restoring the prior snapshot; never replay an external queue. Escalate SEV1 to Engineering and Security.

<a id="cwv_budgets"></a>
## CWV and budgets
Review local Lighthouse output against 90/95/95/95, LCP, CLS and TBT candidates; field CWV is not observed here. Simulate restoring prior page assets/configuration. Escalate to UX then Engineering.

<a id="indexation"></a>
## Indexation and SEO budgets
Run local SEO/canonical/robots/sitemap checks and separate them from GSC/Bing validation. Simulate restoring prior metadata/content; do not submit externally. Escalate to SEO/growth then Product.

<a id="traffic_conversion_citability"></a>
## Traffic, conversion, and citability
Verify source, window, segment, missingness and consent coverage before calculating Wilson intervals. Baseline records are not outcome validation. No rollback is executed; simulate disabling an experiment/report interpretation. Escalate to Analytics and Privacy when volume or consent is insufficient.

<a id="consent_security_incidents"></a>
## Consent and security incidents
Triage fail-closed behavior, PII/secret scans and audit evidence without exposing sensitive values. Simulate disabling the affected flag and preserve evidence. Escalate immediately to Security, Privacy, Engineering, and Product.

<a id="anomalies"></a>
## Operational anomalies
Classify the signal as synthetic, mocked, local, blocked, or time-volume dependent; check source freshness and known releases. Simulate retaining the last valid snapshot and disabling the affected path. Escalate to Data/automation then Engineering.

## Blameless postmortem template

**Incident ID / UTC window / severity / domain / owner role / evidence kind / connection state:**

**Impact and detection:** record observed facts only; never infer users or business loss.

**Timeline:** commands, facts, decisions, and approvals.

**Contributing conditions:** system and process conditions, not individual blame.

**What went well / what failed / follow-ups:** role owner, due window, and evidence required.

**Rollback and escalation:** simulated, externally blocked, or not applicable; approval required for real action.
