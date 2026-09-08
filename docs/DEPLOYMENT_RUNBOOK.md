# FlowHome Deployment Runbook

## Status
Local update 2026-09-05: follow the [verified artifact and recovery runbook](operations/release-artifact-runbook.md). The revised protected workflow is prepared and tested locally, not executed remotely. Historical observations below remain dated evidence.

The project builds locally. An observed Cloudflare Git Integration incident reached an external deployment before branch controls were closed; this is not an approved release and does not establish current production availability. The only authorized future route is the protected manual workflow gate below.

## GitHub publication
If the remote repository already exists:

```bash
git remote add origin https://github.com/manuberrocal-ai/flowhome.git
git push -u origin main
```

If it does not exist, create `manuberrocal-ai/flowhome` first from GitHub UI or with a PAT that has repository creation permission.

## Cloudflare Pages settings

- Project name: `flowhome`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: repository root
- Domain: `flowhome.dev`

## Required repository secrets

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

## Production workflow gate

Remote status verified on 2026-08-08: the GitHub Environment `production` exists with a required reviewer, `prevent_self_review=false`, and a custom deployment branch policy restricted to `main`. The Cloudflare secrets remain repository-level secrets and are referenced only by the protected `deploy-production` job; this runbook does not claim that Environment secrets exist. Future secret rotation or migration to Environment-scoped secrets must be performed manually, without recording secret values here.

`Batched Deploy` runs all verification gates on every push to `main` and on the scheduled trigger, but those triggers never deploy or notify. After specific owner approval, open **Run workflow**, select `main`, check `deploy_production`, provide the reviewed current production UUID in `rollback_deployment_id`, optionally provide separately authorized canonical `notification_urls`, and approve the Environment review after inspecting the exact source and artifact hashes. Production checks out the verification job's SHA, not a moving `main`, and is serialized with `flowhome-production`.

## Append-only deployment incident and control state (2026-08-08)

- Push `e018301` passed the GitHub Actions `verify` job and left `deploy-production` skipped, but Cloudflare Pages Git Integration independently created a successful external deployment for that commit before automatic branch deployments were disabled. This was not a protected workflow deployment.
- Cloudflare Pages Branch control was then saved and re-opened to verify both controls: **automatic production branch deployments Disabled** and **Preview branch None / Disable automatic branch deployments**.
- Future pushes must depend only on the protected manual workflow path; do not treat external Git Integration deployments as an approved production gate.

Before each future production deployment, confirm:

- [ ] Cloudflare Pages **automatic production branch deployments** remains **Disabled**.
- [ ] Cloudflare Pages **Preview branch** remains **None** and **automatic branch deployments** remains disabled.
- [ ] GitHub Actions run is a manual dispatch on `main`, with `deploy_production` checked and the Environment review approved.

## Optional public environment variables

```text
PUBLIC_GA4_ID
PUBLIC_GTM_ID
PUBLIC_CLARITY_ID
```

## Local review archives (not a deployment fallback)

Build and package locally:

```bash
npm run build
npm run package:artifacts
```

These archives are for review or backup only. Do not upload them as an alternative to the protected release chain. The old `deploy:cloudflare` shortcut now refuses unverified publication; use the verified workflow and recovery runbook.

## Production verification

No current production availability is asserted by this runbook. The only observed deployment event was the automatic Git Integration deployment of `e018301` described above; it was not a protected workflow deployment. `3912e2f` subsequently produced neither a Cloudflare check nor a deployment after automatic production deployments were Disabled and Preview was set to None.

After an explicitly approved manual dispatch, inspect the preserved `preflight.json` and `deployment.json`, the approved source/artifact identity and the actual canonical production endpoint, sitemap and user journey. Rebuilding locally does not prove which bytes were served. Complete and preserve the separate online smoke verification before treating the release as operationally verified.


Do not infer current availability from the historical `e018301` incident. No manual protected production dispatch occurred in this revalidation.

## Discovery notification lifecycle

`Batched Deploy` is the only workflow permitted to publish discovery notifications. Only an explicitly approved manual production dispatch may deploy and then run best-effort WebSub and IndexNow after a successful protected deployment.

- Push and scheduled triggers verify only; they never deploy or send notifications.
- `workflow_dispatch` accepts optional newline-separated canonical URLs. Each is validated against the current sitemap; an empty input sends no notifications.
- If Cloudflare credentials are unavailable, the manual production job fails before deployment; it is never silently skipped.

To preview a targeted IndexNow payload locally without network access:

```powershell
npm run build
$urls = Join-Path $env:TEMP 'flowhome-indexnow-urls.txt'
Set-Content -LiteralPath $urls -Value 'https://flowhome.dev/best/best-smart-lighting-for-room-control/' -NoNewline
$env:INDEXNOW_URLS_FILE=$urls
npm run indexnow:submit -- --dry-run
$env:INDEXNOW_URLS_FILE=$null
```
