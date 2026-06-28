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
