# Block 10 Shared Data Platform Runbook

## Scope and activation boundary

This is a local contract and prepared migration only. It does not authorize a database apply, source connector, account access, deployment, model training, publishing, spend, or user-data processing. All flags are off/fail-closed until the named human approvals exist.

## Canonical ownership and persistence mapping

| Concern | Canonical contract | Block 10 treatment |
| --- | --- | --- |
| Product identity | Block 9 `CompatibilityNode` | `Product` is a type alias; `compatibility_node_id` is the durable link. |
| Variant, merchant, offer, price, trends, candidate | Block 8 `domain.ts` | Re-exported types; migration preserves its explicit source/state/UTC/idempotency fields. |
| Experiments | `src/lib/experiments.ts` | `Experiment` aliases `ExperimentDefinition`; stored definition is versioned. |
| Analytics | `analytics.ts` / event contract | Only already-sanitized allowlisted event/payloads enter `block10_analytics_events`. |
| Lifecycle preference and consent | migrations 003–005 | Views project `lifecycle_preferences` and `lifecycle_consent_history`; no copied table exists. |

## Safe migration procedure

1. Obtain written data-owner, security, privacy, and operations approval; verify a backup and the target migration history outside this repository.
2. Review `006_shared_data_platform.sql` in a staging-equivalent environment. Confirm Block 7 tables from migrations 003–005 exist because the two projection views depend on them.
3. Apply through the approved transactional migration runner once. Do not paste it into an unreviewed console. Verify all `block10_*` tables have RLS enabled, direct table privileges are revoked from `public`, `anon`, `authenticated`, and `service_role`, and no policies grant writes. The service-role boundary is limited to the narrow `SECURITY DEFINER` functions documented below; it is not a general table-writer permission.
4. Keep all ingestion, campaign, publication, and automation flags off. Exercise only fixture/local contracts until source, legal/privacy, and human approval evidence exists.
5. Observe queue lag, source rate-limit decisions, dead letters, partial-failure ratio, and audit outcomes by trace ID. Alert warning on any partial failure and critical on configured failure ratio or 15-minute lag.

`timestamptz` normalizes instants in PostgreSQL; it cannot preserve whether a caller supplied an invalid calendar date. Private write functions and the TypeScript boundary therefore require Block 10 strict-UTC round-trip validation before persistence. Database guards are defense in depth, not a replacement for that API validation.

## Database privilege and function boundary

The migration directly revokes table privileges from `service_role` as well as from public client roles. Approved server execution uses narrow `SECURITY DEFINER` functions with fixed `search_path`, explicit arguments, ownership checks, and conditional writes. The function surface is limited to:

- approval/control/experiment review and state transitions;
- claim, finish, and replay operations, including lease-owner/token checks;
- publication reservation and campaign-spend reservation, with integer minor-unit limits;
- governance recording for reviewed rules, models, prompts, drift decisions, feature controls, kill switches, and audit records.

No function performs an external publication or spend. The database records/reserves an approved action; an external executor remains separately authorized, observable, and fail-closed.

## Operations and recovery

- Jobs use stable Block 8 FNV idempotency keys, duplicate enqueue refusal, strict UTC, a 60-second owner-and-token-bound lease, stable `(availableAt,id)` ordering, and the Block 8 five-attempt exponential bounded-jitter policy. A finish with the wrong/expired lease is a no-op. The prepared SQL claim/finalize functions use matching conditional state, owner, token, and expiry predicates in one transaction.
- Only explicitly `safeToRetry` outcomes retry. Unknown or uncertain send/outcome states become dead letters and are never replayed.
- A manual replay requires a named admin, non-empty reason, and reviewed approval; it can only replay a non-uncertain dead letter. Retain the original audit evidence.
- Rate-limit every source separately. A source outage returns per-item failures while other partitions continue; never retry an entire partition blindly.
- Preserve trace and correlation IDs in jobs, rate observations, alerts, and admin audits. Alerts contain identifiers/reason codes only, never payloads, secrets, URLs, or PII.

## Governance and hard bounds

Immutable reviewed rule/model/prompt versions are multi-version `(id, version)` records with reviewed metadata; their rows are append-only after review. Decisions persist every referenced artifact version and rollback persists current/target versions. Deterministic explainable rules are evaluated first; model or bandit assistance also requires a reviewed prompt, sufficient evidence, and a passing drift decision. Missing/malformed flags are off. Durable global/domain feature controls and kill switches stop work immediately; a global kill switch takes precedence over every domain or feature control, and the most restrictive applicable state wins when multiple rows match.

The closed action vocabulary infers risk: publishing, spend, destructive, and legal/privacy actions always require explicit human approval; unknown actions fail closed. Positive spend cannot exceed the integer minor-unit campaign limit, and publication count cannot exceed its configured limit. SQL requires approval IDs for published assets, active campaigns, and positive campaign spend; guarded triggers also require the referenced approval to be approved, unexpired, and action-scoped. Drift or insufficient evidence disables model-assisted eligibility pending review. Roll back by turning off the global/domain flag or kill switch, retaining records/audit evidence, and selecting a prior reviewed immutable version with rollback approval.

## Manual rollback procedure

1. Enable the global kill switch, which has absolute precedence, disable domain flags/workers, and stop new claims; do not delete data.
2. Obtain reviewed retention/export, security, privacy, and owner approvals. Export audited evidence through the approved controlled process.
3. Run the count guard in `006_shared_data_platform.rollback.sql`. It intentionally raises and refuses rollback when any Block 10-owned row exists.
4. Only after a separately reviewed retention/deletion procedure has made every count zero may an authorized operator run the rollback file. Re-verify Block 7 lifecycle tables/views remain intact; they are never dropped.

## Admin review

`reviewer` can review only. `admin` alone can override, replay, or operate a kill switch; every risky action also needs an approval ID and reason. The caller persists the state transition and immutable audit row in one database transaction. Blocked attempts are recorded with no before/after payload. Actor/target/approval IDs and timestamps are validated; reasons and recursively checked audit snapshots reject PII, secrets, authorization data, URLs, and long numeric identifiers. SQL audit sanitization is defense in depth, and audit rows are append-only.

Expired leases are reclaimed atomically only when the lease is expired; the reclaim increments the attempt count and routes an item to the capped DLQ when the configured maximum is reached. Replay never bypasses the uncertain-outcome rule or the same approval/audit requirements.

The prepared SQL tests are static contract checks (definitions, grants, RLS, triggers, and rollback guards); they do not execute the migration or prove database runtime behavior.

## Browser QA

N/A. Block 10 adds only pure server/data contracts, migrations, tests, and documentation; no UI or public runtime file is in the authorized scope.

## Staging activation and rollback checks

Before any approved staging activation, verify: a disposable staging database and backup exist; migrations 003–005 and their lifecycle projections are present; the migration is applied once transactionally; every `block10_*` table has RLS; direct privileges are revoked from public client roles and `service_role`; only the documented definer functions are executable; functions use the intended fixed `search_path`; no policy grants writes; global/domain flags and kill switches are off; approval, limit, lease-reclaim, DLQ, audit-sanitization, and rollback-guard checks pass; and no external publisher, spender, source connector, or deployment is enabled.

Rollback checks require the global kill switch first, worker/domain shutdown, an evidence export and retention approval, a zero-row count guard, and confirmation that Block 7 lifecycle tables/views remain intact. If any Block 10-owned row exists, rollback must refuse. These checks authorize neither production migration nor external outcomes.
