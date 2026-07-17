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

## Required GitHub secrets

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

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

`ash
npm run build
`

Then check:

- https://flowhome.dev
- https://flowhome.dev/sitemap-index.xml
- GitHub Actions latest runs

## Discovery notification lifecycle

`Batched Deploy` is the only workflow that publishes discovery notifications. It builds the site, prepares an explicit URL file, deploys to Cloudflare Pages, and only then runs best-effort WebSub and IndexNow when the deployment outcome is successful.

- Pushes compare the current build with the previous push build and select only new or byte-changed canonical HTML pages present in the current sitemap.
- `workflow_dispatch` accepts optional newline-separated canonical URLs. Each is validated against the current sitemap; an empty input sends no notifications.
- Scheduled deploys perform no WebSub or IndexNow notification.
- If Cloudflare credentials are unavailable, the deploy step is skipped and notifications are skipped too.

To preview a targeted IndexNow payload locally without network access:

```powershell
npm run build
$urls = Join-Path $env:TEMP 'flowhome-indexnow-urls.txt'
Set-Content -LiteralPath $urls -Value 'https://flowhome.dev/best/best-smart-lighting-for-room-control/' -NoNewline
$env:INDEXNOW_URLS_FILE=$urls
npm run indexnow:submit -- --dry-run
$env:INDEXNOW_URLS_FILE=$null
```
