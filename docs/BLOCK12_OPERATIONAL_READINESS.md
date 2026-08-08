# Block 12 — Operational readiness

**State:** local technical gates **PASS**. The 90-day gate and external/field gates remain **PENDING** or externally blocked until the required evidence exists. This change does not activate monitoring, accounts, credentials, deployment, or external alerting.

## Owner and cadence matrix

| Domain | Owner role | Human assignment | Cadence | Alert channel | Connection |
| --- | --- | --- | --- | --- | --- |
| Site/critical flow | Engineering/reliability | pending | daily | local test record; remote pending | definition present; remote execution unobserved |
| Retailer CTAs | Commercial | pending | daily | local links record; commercial pending | connected_local |
| Offers/expiry | Data | pending | daily | local data record; alert pending | connected_local |
| Ingestion lag | Data/automation | pending | daily | local data record; remote pending | not_connected |
| Jobs/queues/APIs | Engineering | pending | daily | local test record; security pending | connected_local |
| CWV/budgets | UX/accessibility | pending | weekly | local Lighthouse record; UX pending | connected_local |
| Indexation | SEO/growth | pending | weekly | local SEO record; search pending | connected_local |
| Traffic/conversion/citability | Analytics | pending | weekly | scorecard; analytics/privacy pending | not_connected |
| Consent/security | Security/privacy | pending | daily | restricted local incident record; security pending | connected_local |
| Anomalies | Data/automation | pending | weekly | local data record; alert pending | not_connected |

Monthly reviews compare like-for-like windows and choose only `continue`, `revise`, `defer`, `stop`, or `externally_blocked`. Quarterly reviews audit access, retention, bias, SLOs and approvals.

| Review cadence | Owner role | Human assignment | Required review | Channel / connection |
| --- | --- | --- | --- | --- |
| Monthly | Product owner with Analytics and Engineering | pending | comparable windows, SLO changes, flags, backlog and provisional decision | scorecard; not_connected |
| Quarterly | Product owner with Security, Privacy and Engineering | pending | governance, access, retention, bias, SLO approval and next-phase gate | governance record; not_connected |

## Infrastructure boundary

The only local execution definitions are the existing npm scripts `test`, `typecheck`, `quality:check`, `deals:detect`, `links:check`, `seo:audit`, and `lighthouse:mobile`. The existing workflow definitions are present at:

- `.github/workflows/quality.yml`
- `.github/workflows/quality-check.yml`
- `.github/workflows/automation.yml`
- `.github/workflows/trends-monitor.yml`
- `.github/workflows/batched-deploy.yml`

Their remote execution was not observed in this change. Blocks 8–10 and lifecycle remain contract/mock boundaries; no active connector, production queue, monitor, or provider is implied. `deals:detect` is a local command and its input may be fixtures or reports; it is not productive expiry monitoring.

## Evidence classification

Every observation is classified independently as `real_local`, `synthetic`, `mocked`, `simulated`, `externally_blocked`, or `time_volume_dependent`. Connection is a separate state: `connected_local`, `definition_present_remote_execution_unobserved`, or `not_connected`. `observed=false` is mandatory for every provisional SLO. No historical metrics are invented.

## Safety boundary

Rollback is pure simulation: disable flags and restore a last-known-valid snapshot without mutation. External rollback is blocked. Browser QA and Lighthouse for this documentation/contracts change are N/A/not executed, subject to final audit.

## Production deployment gate

The `Batched Deploy` workflow verifies every push to `main` and scheduled run, including build and quality gates, but does not deploy or send deployment notifications for either trigger. Remote status verified on 2026-08-08: GitHub Environment `production` exists with required reviewer `manuberrocal-ai`, `prevent_self_review=false`, and custom deployment branch policy `main`; no deployment was performed. Production requires an explicit `workflow_dispatch` on the `main` branch, checking the boolean `deploy_production` checkbox, and manual reviewer approval. `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` remain repository-level secrets referenced only by the protected production job; Environment secrets are not asserted. Future rotation or migration to Environment-scoped secrets is a manual follow-up without exposing values. The job fails closed when either repository secret is absent.
