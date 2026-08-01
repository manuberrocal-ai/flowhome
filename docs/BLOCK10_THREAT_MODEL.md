# Block 10 Threat Model

| Threat | Control | Evidence / residual risk |
| --- | --- | --- |
| Duplicate delivery or source replay | Stable Block 8 FNV idempotency keys and unique SQL keys | At-least-once sources still require source-side evidence. |
| Concurrent worker double-processing | Claim state, ordered selection, lease token/expiry, and one claim transition | Database runner must enforce the matching conditional update. |
| Calendar-normalized timestamp bypass | Strict-UTC round-trip validation before private persistence | PostgreSQL `timestamptz` normalization is not sufficient on its own. |
| Wrong worker or expired lease finishes a job | Pure finish contract validates strict UTC, lease owner, and unexpired lease | Durable executor must use a conditional database update. |
| Uncertain provider outcome causes duplicate effect | Only explicit safe-to-retry retries; uncertain outcomes go to DLQ and cannot replay | Human investigation may be required. |
| Poison item blocks healthy work | Per-item/partition isolation and partial-failure alerts | Source outage remains externally observable. |
| Rate-limit exhaustion | Per-source bounded windows and retry-at decision | Limits must be reviewed from provider terms. |
| Unauthorized or unreviewed admin change | Least-privilege roles, approval IDs, reason, immutable audit including blocked attempts | Identity/RBAC provisioning is external. |
| Secret/PII enters telemetry or audit | Analytics sanitizer reuse; reason rejection/minimization; no payload in alerts | Existing source payloads require external data classification. |
| Privileged analytics writer bypasses browser sanitizer | SQL allowlisted-key and conservative PII/secret/URL trigger | SQL guard is defense in depth; canonical sanitizer remains mandatory. |
| Direct public writes or RLS bypass | RLS on every Block 10 table; explicit revoke from public/anon/authenticated; no policies | Privileged service credentials remain external and must be protected. |
| Service-role privilege boundary bypass | Direct table privileges are revoked from `service_role`; only narrow fixed-`search_path` `SECURITY DEFINER` functions expose approval/control/experiment, claim/finish/replay, publication reservation, campaign-spend reservation, and governance recording | Function ownership, execute grants, search path, and service-role provisioning require staging review. |
| Unsafe automation, spend, or publication | Flags fail closed, global/domain kill switches, hard minor-unit spend cap, human approval | Legal/privacy decisions cannot be automated. |
| Multiple matching kill-switch rows are evaluated incorrectly | Global kill switch has absolute precedence; the most restrictive applicable global/domain state wins | Staging must verify precedence with multiple matching rows. |
| Concurrent reservations exceed a limit | Publication and campaign-spend reservations use one conditional atomic database transition and integer minor units | Runtime concurrency and transaction isolation remain unobserved until staging execution. |
| Expired lease is reused or loses retry cap | Owner/token/expiry predicates, atomic reclaim, attempt increment, and capped DLQ routing | Database runtime behavior is not proven by static SQL tests. |
| Blocked risky attempt disappears from audit | Approval/control functions record blocked attempts in an append-only audit transaction without before/after payload | Audit retention and operator access remain external decisions. |
| Caller mislabels a risky action as safe | Closed action vocabulary infers risk; unknown action fails closed | Reviewed action vocabulary changes are required for expansion. |
| Opaque or drifting model changes | Immutable version/explanation, deterministic rules first, drift disables eligibility | Statistical thresholds need owner review. |
| Unreviewed governance artifact or prompt is used | Rules, models, prompts, feature controls, decisions, and drift records use reviewed immutable versions and persist referenced versions | Governance owner and model/prompt review remain unassigned. |
| SQL audit contains PII or secrets | Recursive SQL sanitizer rejects PII, secrets, authorization data, URLs, and long numeric identifiers; audit is append-only | Sanitization is defense in depth; retention and source classification remain external. |
| Sensitive audit snapshot | Recursive snapshot validation and redacted blocked audits | Human reviewers must keep state snapshots minimized. |
| Destructive rollback loses evidence | Transactional count guard refuses rollback while rows exist; reviewed export/retention prerequisite | Authorized deletion remains a human decision. |
| Lifecycle privacy duplication | Existing Block 7 preference/consent tables are projection views only | Lifecycle table access remains governed by Block 7 functions. |

Security review must verify SQL grants/RLS after application, the service-role boundary and definer-function surface, multiple-row kill-switch precedence, atomic reservation races, expired-lease reclaim/DLQ behavior, governance review/version references, SQL audit sanitization, retention policy, source agreements, alert routing, and incident response before activation. Residual risks include owner/RBAC and superuser access, staging configuration drift, and all unobserved external provider, deployment, migration, and production outcomes.
