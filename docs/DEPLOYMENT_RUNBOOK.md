# FlowHome Deployment Runbook

## Status
The project builds locally and is ready for Cloudflare Pages. Deployment is blocked only by external account permissions/secrets.

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

`Batched Deploy` runs all verification gates on every push to `main` and on the scheduled trigger, but those triggers never deploy or notify. To deploy production, open **Run workflow**, select the `main` branch, check the `deploy_production` checkbox, optionally provide newline-separated canonical `notification_urls`, and approve the Environment review. Production uses Cloudflare Pages branch `main` and is serialized with the `flowhome-production` concurrency group.

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

## Manual deployment fallback

Build and package locally:

```bash
npm run build
npm run package:artifacts
```

Upload the generated `artifacts/flowhome-dist-*.zip` contents to Cloudflare Pages direct upload.

## Production verification

Production is live at https://flowhome.dev. The Cloudflare Pages fallback URL is https://flowhome-a1b.pages.dev.

After each major deploy, verify:

```bash
npm run build
```

Then check:

- https://flowhome.dev
- https://flowhome.dev/sitemap-index.xml
- GitHub Actions latest runs

## Discovery notification lifecycle

`Batched Deploy` is the only workflow that publishes discovery notifications. It builds the site, prepares an explicit URL file, deploys to Cloudflare Pages, and only then runs best-effort WebSub and IndexNow when the deployment outcome is successful.

- Pushes compare the current build with the previous push build and select only new or byte-changed canonical HTML pages present in the current sitemap.
- `workflow_dispatch` accepts optional newline-separated canonical URLs. Each is validated against the current sitemap; an empty input sends no notifications.
- Scheduled deploys perform no WebSub or IndexNow notification.
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
