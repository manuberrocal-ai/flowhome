# Block 12 — Operational readiness

**State:** local technical gates **PASS**. The 90-day gate and external/field gates remain **PENDING** or externally blocked until the required evidence exists. The append-only revalidation below records limited observed staging, CI, and deployment-control evidence; it does not establish sustained production operation, monitoring, or outcomes.

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

The `Batched Deploy` workflow verifies every push to `main` and scheduled run, including build and quality gates, but does not deploy or send deployment notifications for either trigger. Remote status verified on 2026-08-08: GitHub Environment `production` exists with a required reviewer, `prevent_self_review=false`, and custom deployment branch policy `main`. Production requires an explicit `workflow_dispatch` on the `main` branch, checking the boolean `deploy_production` checkbox, and manual reviewer approval. Repository-level Cloudflare secrets remain referenced only by the protected production job; Environment secrets are not asserted. Future rotation or migration to Environment-scoped secrets is a manual follow-up without exposing values. The job fails closed when either repository secret is absent.

## Append-only deployment incident and control state (2026-08-08)

Push `e018301` passed GitHub Actions `verify` and left `deploy-production` skipped, but Cloudflare Pages Git Integration independently created a successful external deployment for that commit before branch-control closure. This confirms an external deployment path existed; it was not a protected workflow deployment. Cloudflare Pages Branch control was subsequently saved and re-opened with automatic production branch deployments **Disabled** and Preview branch **None / Disable automatic branch deployments**.

Push `3912e2f` subsequently created neither a Cloudflare check nor a Cloudflare deployment. No protected manual production dispatch, Edge Functions deployment, lifecycle provider activation, DNS email setup, Vault/scheduler setup, alert channel, owner assignment, real data/outcome, or D90 evidence was observed.

Future pushes must depend only on the protected manual workflow path. Before production, verify:

- [ ] Automatic production branch deployments remains **Disabled**.
- [ ] Preview branch remains **None** and automatic branch deployments remains disabled.
- [ ] Manual dispatch targets `main`, `deploy_production` is checked, and the Environment reviewer approves it.

## Append-only operational revalidation (2026-08-08)

- A separate Supabase Free staging environment was created in `us-east-1`; the original Supabase production environment remained paused and intact. Migrations `001` through `008` were applied only to staging. Database lint reported 0 findings, dry-run was up-to-date, all 28/28 target tables had RLS, and staging contained 0 rows. A prior query showed seven migrations before `008`; `008` then applied its transactional assertion that direct write grants were zero.
- The observed staging migration corrections were: `003` PL/pgSQL `CASE`, `006` extension-qualified `gen_random_bytes`, `007` seven-column `sync_cart`, and `008` direct-write-grant revocation. This is staging runtime evidence, not a production Supabase activation.
- The final local suite before this documentation reconciliation was 482/482 PASS, with lint PASS, typecheck over 204 files reporting 0 errors/0 warnings/155 hints, build 88, production audit 0, and diff-check PASS. Subsequent workflow tests were 46/46 PASS and documentation tests 10/10 PASS.
- Remote `quality` and `verify` executions were observed passing on 2026-08-08. The `production` GitHub Environment has a required reviewer and `main` branch policy; `main` is protected with required PRs, strict quality, administrator enforcement, linear history, and force-push/deletion protection. `deploy-production` was skipped.
