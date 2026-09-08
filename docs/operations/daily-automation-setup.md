# Daily review setup — V3

Prepared locally on 2026-09-04. **Not activated or deployed.** The existing automation workflow is converted to one review-only daily entry point; unrelated workflows are unchanged. No remote settings were changed.

## Local use

Use the project's supported Node runtime (CI uses Node 24) and locked dependencies. Run `npm run flowhome:daily -- --dry-run`. This writes generated evidence under `reports/daily/YYYY-MM-DD/` (ignored by Git), not source content. It runs tests, lint, types, build, static SEO and a small critical-page browser suite. Add `--weekly` for the full seven-viewport matrix and Lighthouse median-of-three; add `--refresh` to recheck identical inputs. Identical successful same-day runs reuse evidence only if its hashes remain intact. Failed or incomplete runs are rebuilt.

No credentials are needed for dry runs. An ordinary run without credentials writes `not_configured`, not fake products/prices. A completed **run** does not mean SEO growth or Amazon integration is complete. Consult each report's state.

Reuse fingerprints include application code, tests, auxiliary `data`, Supabase migrations, public assets, workflows and build manifests. Documentation/report edits are not runtime inputs; use `--refresh` if you want to repeat documentation-related assertions after changing only those files. Environment-file changes are detected by metadata without logging secret values.

## Owner activation (requires approval)

1. Review/merge the branch, policy assessment and workflow changes. No deployment is part of this workflow. Assess Actions usage/cost before enabling its once-daily schedule.
2. The workflow is inert for scheduled events unless repository variable `FLOWHOME_DAILY_SCHEDULE_ENABLED=true`. Manual dispatch defaults to `dry_run=true`.
3. Set `FLOWHOME_TIMEZONE` to an IANA timezone and `DAILY_RUN_TIME` to `HH:mm`; defaults are America/Argentina/Buenos_Aires and 10:07. Update the workflow's `cron` and native `timezone` fields together with these variables; the runtime rejects mismatches. Current GitHub documentation supports timezone-aware schedules. Delayed scheduled runs are still executed, not discarded by a clock window. GitHub can drop schedules and runs from the default branch; use manual dispatch if a day was missed. Do not rely on it for time-critical price expiry.
4. `FLOWHOME_DAILY_KILL_SWITCH=true` stops processing. `DAILY_AUTOPUBLISH=false` is mandatory; enabling it is rejected, not interpreted as permission.
5. For approved catalog acquisition, provide `AMAZON_CREATORS_CLIENT_ID` and `AMAZON_CREATORS_CLIENT_SECRET` as server/repository secrets; version/tag are ordinary variables. Never prefix secrets with `PUBLIC_`, commit them or send them in chat. Confirm US marketplace eligibility and any prior written permission needed for analysis/aggregation. Only then set `AMAZON_DISCOVERY_APPROVED=true` and deliberately uncheck dry-run for an integration test.
6. Verify the first remote run and artifact. It has not been tested in GitHub in this change. Scheduled runners are ephemeral: cross-run artifact restoration is not implemented, and durable review storage is not wired into the remote workflow. Optional explicitly injected storage has been tested against local PostgreSQL (see the daily runbook); that does not establish remote persistence, identity or permissions. Do not claim durable hosted orchestration until its destination, authentication, migrations and activation are approved and tested.

The workflow uses read-only repository permissions, no persisted checkout credentials, a 45-minute job timeout, a concurrency group, immutable action revisions, no push/deploy command and 14-day evidence retention. The runner uses its installed Chrome; no additional browser dependency is installed. Existing [GitHub runner documentation](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md) lists Chrome. The [scheduler documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) explains timing constraints.

See [daily runbook](daily-runbook.md), [rollback](rollback-runbook.md) and [Amazon integration](../data/amazon-integration-v3.md).
