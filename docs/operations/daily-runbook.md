# Daily runbook

The daily runner uses the CI core (tests, lint, types, editorial structure,
commercial links, build, SEO) plus browser QA. A contract test prevents that core
from drifting from the shared CI action; the CI-only dependency audit and Git diff
gate remain in CI. Editorial/link reports stay in the run directory and are hashed
along with the other evidence. Any failed or missing pre-build gate prevents the
build and its dependent audits; other diagnostic checks still run. Such a run is
`needs_attention`, never a successful reuse. The exact supplied environment is
passed to the checks, matching the public flags recorded in the fingerprint.
Reuse of the entire run is limited to an identical complete same-day run with
intact evidence. Browser coverage is selected conservatively by impact: new or
changed source, public configuration or Node runtime requires the full matrix.
The daily subset is allowed only after finding an intact complete validation of
the same inputs among the seven most recent dated run folders (excluding future
dates). All core checks still run on a new day, including a fresh build for
time-sensitive content. Weekly runs always retain the weekly full matrix and
Lighthouse. Missing/corrupt baselines never narrow coverage. This is not a
cross-day build cache or a per-file dependency-graph selector. manifest.json and
visual.json record the selected browser profile and baseline reason.

1. Inspect `manifest.json` and `summary.md`: `needs_attention` is not success. Read `tests.json`, `anomalies.json`, `expired-deals.json`, `seo.json`, `visual.json`, `amazon-candidates.json`, `review-queue.json` and `review-persistence.json`.
2. Each candidate is `needs-review`, not approved/published. Check the exact ASIN/variant, marketplace, source permissions, category, duplicate identity, current terms and primary manufacturer specifications. Missing demand/history/conversion is unknown. No automated “lowest price” claim is supported.
3. Provider errors are sanitized. A long Retry-After or exhausted request budget stops that batch; other audits still run. No raw provider body, token, image or price snapshot goes into persisted reports. Retry later with `--refresh` after resolving the cause.
4. `.flowhome-daily.lock` prevents concurrent local writes. It records PID/start/run ID. If a run was killed, check that its process/children really ended before manually removing **that exact file**. The tool never steals stale locks or kills an unrelated process. Interrupted runs regenerate under a new lock; there is no partial-step replay that could skip validation.
5. Review proposed editorial work manually. This version writes a review queue, not generated articles or source patches. Draft only from permissioned evidence. Verify claims, dates, authorship, product identity, copy, structured data, accessibility and all project gates before any separate publication approval.
6. Monday's scheduled slot selects the weekly profile. Monthly: inspect Search Console/analytics exports, content decay and evidence expiry. Quarterly: recheck Amazon policies, permissions, dependencies and accessibility. These reviews require actual owner-provided data; they are not represented as automated measurements here.

Local reports have no automatic deletion; retain only what the owner needs and remove exact dated folders deliberately. GitHub artifacts expire after 14 days. No commercial PAC is intentionally stored by acquisition; screenshots may contain site content, so do not expand retention to live PAC without reviewing the data policy.

## Optional durable review storage — local implementation, remote inactive

Only an explicitly injected server-side `reviewStore` enables durable writes;
the CLI and remote workflow do not configure one. Its stable, non-secret
`targetId` identifies the authorized destination and participates in reuse.
Dry-run neither reads nor writes that store. Persistence requires every core
check, no failed extra check, no anomaly and readable, parseable required quality
artifacts before the first lookup. Artifact presence is not proof of independent
review: the check runner and store are trusted injected implementation boundaries.

The persistence report distinguishes `disabled`, `dry_run`, `skipped_quality`,
`confirmed` and `needs_attention`. Each item is looked up before at most one
idempotent enqueue. An uncertain response stops the remaining batch. Resolve the
transport problem, then rerun: lookup reconciles a write whose acknowledgement
was lost; a unique database identity protects concurrent writes. Never delete a
stored job or reset its state just to retry. `reused` is historical evidence, not
a live queue query. `completed` is a processing state, not human approval.

Local PostgreSQL validation is recorded in
[FH17E](../project/FH17E_DIARIO_PERSISTENCIA_2026-09-06.md).
Real PostgREST authentication, reviewer authorization, remote activation and
durable human decisions remain unverified. No publication follows a queue result.

## Incident reading and reconciliation

`summary.md` shows the final run status and separate counts for inserted,
already-present, unresolved and not-attempted review items. An unresolved write
is not evidence that the database rejected it. The next run reconciles identity;
do not reset or delete jobs to obtain a green run. Already-present jobs may be
pending, completed or dead: their presence is not editorial approval.

If final artifact reading fails, `run_evidence_unconfirmed` appears in
`anomalies.json`; the manifest and summary remain `needs_attention`. Preserve
the directory, inspect the required evidence, and fix the producing check before
rerunning. A report failure does not undo earlier confirmed writes. Raw error
messages are not copied into the summary.

These are local diagnostic reports, not an activated uptime monitor or an alert
delivery service. Operational owner, notification destination and response-time
commitments remain to be approved. No incident automatically publishes,
notifies a third party or rolls production back.
