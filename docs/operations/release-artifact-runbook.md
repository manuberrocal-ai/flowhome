# Verified static release and recovery

FH-03 adds a validated build environment record: `release-environment.json` is covered by the static inventory, and production publication rejects local/staging artifacts or a missing/malformed record. Account and analytics services are explicit build-time settings; changing Pages variables cannot change an already-built artifact. The environment procedure is documented in `docs/operations/environment-runbook.md`.

Implemented locally on 2026-09-05. The GitHub/Pages publication path has **not** been executed by this change. This runbook never authorizes publication, notifications or rollback.

## Before requesting a production run

1. Finish the release's content, environment and quality gates. Commit the reviewed source through the repository's review process; the local V3 working tree is not yet a publishable commit. Keep Cloudflare automatic production deployment disabled and preview branches set to none.
2. Identify the current successful **production** deployment in the `flowhome` Pages project. Confirm its domain and exact deployment ID, and review whether restoring it is acceptable. A historical record is not enough.
3. Request the owner's approval for the exact changes, destination, expected artifacts, limitations and recovery target. Only then dispatch **Batched Deploy** on `main` with `deploy_production=true` and that UUID in `rollback_deployment_id`. Leave `notification_urls` empty unless those sends were also authorized.
4. Review the verification job's source SHA, manifest SHA-256 and tree SHA-256 before approving the protected production environment. If main advances, the production checkout still uses the verified SHA.

## Integrity chain

`release-artifact.mjs create` requires a clean Git checkout matching the supplied SHA. It creates an inventory of all static files, hashes and byte sizes outside `dist`; it rejects symlinks, traversal, unsupported server bundles, unreviewed hidden paths and obvious private-key material. `.well-known` is the only allowed hidden directory class. This is a release-integrity control, not exhaustive secret scanning.

The quality report is written under `runner.temp`, so validation does not change tracked source. The sealed artifact is checked again after preparation of notification URLs and before upload. Artifact names include run ID and attempt; downloads use immutable artifact IDs from the verification job. A trusted manifest digest comes from job outputs, not from the downloaded manifest itself.

The production job verifies source, run, attempt, manifest and every artifact file before using Cloudflare credentials. Missing, added or modified files fail the job. A pinned Wrangler Action and Wrangler 4.129.0 are configured; npm saving and lockfile writes are disabled for its installation. `preCommands` rechecks the release after tool setup and before publication. The command explicitly supplies the verified SHA and `commit-dirty=false` only after these checks.

An ordinary `npm run deploy:cloudflare` now fails with guidance to use the protected workflow. The former unverified direct-upload shortcut is disabled. `package:artifacts` still produces local review archives, not verified release authority. `deploy:check` alone checks only environment-variable presence; it is insufficient without the manifest and preflight controls.

## Recovery evidence and deployment record

`release-record.mjs preflight` performs a bounded, authenticated GET against the fixed `flowhome` project. It checks the production branch/domain, successful canonical deployment and exact approved rollback ID. If production changed while approval was pending, it refuses to publish; review the new state instead of retrying blindly.

The preflight file records only selected metadata, artifact identity and the recovery target. It never copies project environment values, API tokens or raw provider responses. Older dirty-source deployments remain marked dirty; their declared commit alone cannot reconstruct their original bytes.

FH13J also fails closed unless the current project's `source.config.production_deployments_enabled` is exactly `false` and `preview_deployment_setting` is exactly `none`. Missing or malformed controls are not accepted as disabled. Both preflight and post-deployment recording use this check. If controls change after publication, recording fails and optional notifications remain disabled; production may already have changed, so inspect it before retrying. This is a point-in-time check, not a lock against concurrent provider setting changes, and it never changes the controls itself.

After publication, `record` requires a different successful canonical deployment, the verified source SHA, clean-source metadata and the exact URL returned by Wrangler. Only a successful record enables the existing optional notification decision. If deployment succeeded but recording fails, production may already have changed: inspect its actual state before any retry. Failure does not automatically trigger rollback or notifications.

`flowhome-release-evidence-<run>-<attempt>` preserves the preflight and, when successful, the deployment record. Static artifact and manifest artifacts also retain 30 days, subject to repository limits. Before retention expires, preserve approved release evidence in an authorized durable location if needed; this workflow does not provide long-term storage.

## Explicit rollback procedure

After separate approval, open the `flowhome` Pages project → Deployments → All deployments. Locate the **exact** `rollback.id` in `preflight.json`, check its successful production state, then use **Rollback to this deployment** and confirm. Never select a preview, an approximate date, a mutable branch or a newly rebuilt archive as an equivalent replacement.

Verify the canonical deployment ID and real domain afterward; test anonymous Amazon CTAs, shortlist, affected routes, headers and relevant content. Preserve incident evidence and note which known defects return with the older release. Do not use Workers `wrangler rollback` commands for Pages. No rollback is executed automatically by these scripts.

## Failures and local verification

- Manifest/source mismatch: preserve evidence and rebuild from reviewed source; do not overwrite hashes to force acceptance.
- Missing rollback ID or changed production: obtain current evidence and a specific approval before a fresh run.
- Failed-only job reruns can have a different run attempt than the original artifact. The verifier rejects that mismatch. Re-run the complete workflow (with fresh verification and environment approval), not just deployment using stale outputs.
- Expired/missing artifact: re-verify a fresh artifact and obtain approval again. A new build is not assumed byte-identical.
- Real smoke verification remains separate: matching metadata is not proof of all remotely served bytes, user journeys, cache behavior or analytics.

Local checks: `node --test test/release-artifact.test.mjs test/release-record.test.mjs test/deployment-notification-workflow.test.mjs`, followed by the project's general controls. The isolated rehearsal generated a real build, manifest and transferred copy, and rejected intentional alteration; the Cloudflare integration tests use fixtures or captured read-only metadata, not a new deployment.

## Official references

- [GitHub artifact validation](https://docs.github.com/en/actions/tutorials/store-and-share-data): digest mismatch may only warn; the repository adds a failing content verifier.
- [Upload Artifact](https://github.com/actions/upload-artifact) and [Download Artifact](https://github.com/actions/download-artifact): artifact IDs, hidden files and immutability.
- [Wrangler Pages options](https://developers.cloudflare.com/workers/wrangler/commands/pages/) and [pinned action definition](https://github.com/cloudflare/wrangler-action/blob/9acf94ace14e7dc412b076f2c5c20b8ce93c79cd/action.yml).
- [Cloudflare project API](https://developers.cloudflare.com/api/resources/pages/subresources/projects/methods/get/) and [Pages rollback procedure](https://developers.cloudflare.com/pages/configuration/rollbacks/).
