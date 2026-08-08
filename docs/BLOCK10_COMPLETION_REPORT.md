# Block 10 Completion Report

## Scope and evidence status

Block 10 implements local, pure contracts and prepared SQL only. No migration was applied, no infrastructure/account was accessed, no source connector ran, no deployment/publish/spend occurred, and Block 11 was not started. Browser QA is N/A: the authorized scope contains no UI or public runtime surface.

## Prompt-to-artifact checklist

| Required outcome | Artifact |
| --- | --- |
| Canonical `CompatibilityNode`/`Product` identity, Block 8 variant/merchant/offer/price/trend/candidate contracts, versioned `Experiment`, sanitized analytics, and Block 7 lifecycle preference/consent projections | `src/lib/blocks/block10/domain.ts`, `analytics.ts`, migration |
| Stable FNV idempotency, enqueue/dedup, ordered claim, owner/token-bound lease, finish, safe retry, uncertain outcome, capped DLQ, replay, source limits, trace IDs, alerts, and partial-failure isolation | `operations.ts`, focused tests |
| Strict-UTC round-trip adapter and persistence boundary | `analytics.ts`, domain adapter, focused tests |
| Rules-first governance for reviewed immutable rule/model/prompt `(id, version)` artifacts, explanations, decisions, rollback references, feature controls, global/domain kill switches, drift, evidence, alerts, and unknown-action fail-closed behavior | `governance.ts`, `domain.ts`, migration, focused tests |
| Typed current approvals, approval/control/experiment review, reviewer/admin separation, risky-action inference, publication and campaign-spend integer minor-unit limits, and atomic reservations | `admin.ts`, governance contracts, migration, focused tests |
| Blocked-attempt audit, recursive snapshot sanitizer, SQL audit sanitizer, append-only audit, and no payloads in alerts | `admin.ts`, migration, focused tests, runbook |
| Direct table privilege revocation from `public`/`anon`/`authenticated`/`service_role`, RLS, no write policies, and narrow fixed-`search_path` `SECURITY DEFINER` functions for approval/control/experiment, claim/finish/replay, publication reservation, campaign-spend reservation, and governance recording | `006_shared_data_platform.sql`, migration test, runbook |
| No function performs external publish or spend; external execution remains separately authorized | runbook, threat model |
| Expired-lease atomic reclaim with attempt increment and capped DLQ; absolute global kill-switch precedence over multiple matching rows | migration, operations/governance contracts, focused tests, runbook |
| Safe data-preserving rollback refusal and exact staging activation/rollback checks | rollback SQL, migration test, runbook |
| Threats, controls, and residual owner/superuser/staging risks | `BLOCK10_THREAT_MODEL.md` |
| Phase 5 state and post-audit boundary without changing Phase 6/Block 11 scope | `ROADMAP_PHASES_0_6.md` |

## Verification record

| Gate | Observed evidence | Result |
| --- | --- | --- |
| Block 10 focused tests | `node --test test/block10-*.test.mjs` — 16/16 passing | PASS |
| Global test snapshot | 451/451 passing | PASS |
| Lint | PASS after final regex fix | PASS |
| Typecheck | 188 files; 0 errors / 0 warnings / 155 hints | PASS |
| Build | 88 | PASS |
| Links | 0 stale / 5 unknown | PASS |
| `npm audit` | production npm audit: 0 vulnerabilities | PASS |
| Diff-check | PASS; LF/CRLF warnings only | PASS |
| Browser QA | N/A; no Block 10 UI/public runtime changes | N/A |

Independent verifier: APPROVE after rollback trigger dependency ordering was fixed.

Static SQL tests are contract checks only; they do not execute a database migration or prove runtime grants, RLS, concurrency, or external outcomes. This report records no migration, deployment, source connector, account access, external publication, spend, or Block 11 work. The prompt-to-artifact checklist above is a local implementation correspondence, not evidence of staging or production activation.

## External blockers and activation preconditions

Source access/terms, database runner, backups, migration approval, privacy/legal/security review, service-role provisioning, alert routing, human owners, deployment, and real outcomes remain external and unknown. Activation requires all runbook approvals and must start with flags off plus a reviewed staged plan.

## Append-only operational revalidation (2026-08-08)

The scope statement above is historical local-implementation evidence. Later staging-only runtime evidence applied migrations `001`–`008` in a separate Supabase Free environment in `us-east-1`; the original paused Supabase production environment remained intact. Database lint had 0 findings, dry-run was up-to-date, 28/28 target tables had RLS, 0 rows were present, and `008` transactionally asserted zero direct write grants after the prior seven-migration query. The observed fixes were `003` PL/pgSQL `CASE`, `006` extension-qualified `gen_random_bytes`, `007` seven-column `sync_cart`, and `008` grant revocation.

No source connector, provider, Edge Functions deployment, manual protected production dispatch, owner, alert channel, real outcome, or D90 evidence was observed. This revalidation does not activate the data platform or assert production Supabase activity.
