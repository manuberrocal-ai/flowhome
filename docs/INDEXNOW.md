# IndexNow Operations

FlowHome uses IndexNow to notify participating search engines when public URLs are added or updated.

## What is configured

- A public IndexNow key file is hosted at the site root: `https://flowhome.dev/85b3b79bd6a26a3862465cc5611db3a2.txt`.
- `npm run indexnow:submit` requires `INDEXNOW_URLS_FILE`: a newline-separated, explicitly selected URL list. Every URL is checked as HTTPS `flowhome.dev` and against the current `dist/` sitemap before submission.
- If `INDEXNOW_ENDPOINT` is not set, the script submits to `https://api.indexnow.org/indexnow`.
- A successful Cloudflare deployment may notify WebSub and IndexNow only for a non-empty selected list. Push deployments derive that list from new or byte-changed canonical HTML pages; manual deployments accept an optional selected list. Scheduled deployments never notify.
- IndexNow sends batches of at most 10,000 URLs. Network response failures are soft-fail in CI; missing, empty, or invalid URL files fail validation.

## Manual run

```bash
npm run build
printf '%s\n' 'https://flowhome.dev/best/best-smart-lighting-for-room-control/' > /tmp/flowhome-indexnow-urls.txt
INDEXNOW_URLS_FILE=/tmp/flowhome-indexnow-urls.txt npm run indexnow:submit
```

For a payload preview only:

```bash
npm run build
printf '%s\n' 'https://flowhome.dev/best/best-smart-lighting-for-room-control/' > /tmp/flowhome-indexnow-urls.txt
INDEXNOW_URLS_FILE=/tmp/flowhome-indexnow-urls.txt npm run indexnow:submit -- --dry-run
```

To submit through Yandex explicitly:

```bash
npm run build
INDEXNOW_URLS_FILE=/path/to/selected-urls.txt INDEXNOW_ENDPOINT=https://yandex.com/indexnow npm run indexnow:submit
```

PowerShell equivalent:

```powershell
npm run build
$urls = Join-Path $env:TEMP 'flowhome-indexnow-urls.txt'
Set-Content -LiteralPath $urls -Value 'https://flowhome.dev/best/best-smart-lighting-for-room-control/' -NoNewline
$env:INDEXNOW_URLS_FILE=$urls
npm run indexnow:submit -- --dry-run
$env:INDEXNOW_URLS_FILE=$null
```

## Current search-engine behavior

- The key file is valid and publicly reachable.
- Yandex accepts the same key and URLs with `202 Accepted` / `{ "success": true }`.
- Bing/Microsoft can return `403 UserForbiddedToAccessSite` even when the key file is reachable. This is treated as an external authorization/domain-verification issue, not a FlowHome key-file bug.

## Bing Webmaster Tools unblock path

To unlock Bing IndexNow reliably:

1. Open Bing Webmaster Tools: https://www.bing.com/webmasters
2. Add `https://flowhome.dev/`.
3. Prefer XML verification if Bing offers it.
4. If Bing provides `BingSiteAuth.xml`, place it in `public/BingSiteAuth.xml`, deploy, then click Verify in Bing.
5. If Bing provides a meta tag instead, add `msvalidate.01` to the site head in `src/layouts/BaseLayout.astro`, deploy, then click Verify.
6. After verification, rerun `npm run indexnow:submit` with an explicit current-sitemap URL file.

## Notes

- Google does not support IndexNow and deprecated unauthenticated sitemap pings. Google discovery depends on `robots.txt`, Search Console, WebSub/RSS discovery, normal crawling, or verified Search Console APIs.
- Keep the key file in `public/`; removing or changing it requires a fresh deployment before the next successful submission.
- CI treats IndexNow endpoint failures as non-blocking because search-engine authorization can fail independently from site correctness. It does not suppress invalid selection-file errors.

## WebSub / PubSubHubbub

FlowHome also publishes RSS update notifications to Google's public WebSub hub.

```bash
npm run websub:publish
```

For CI, WebSub is best-effort and must not block deploys.
