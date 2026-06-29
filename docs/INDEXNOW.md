# IndexNow Operations

FlowHome uses IndexNow to notify participating search engines when public URLs are added or updated.

## What is configured

- A public IndexNow key file is hosted at the site root: `https://flowhome.dev/85b3b79bd6a26a3862465cc5611db3a2.txt`.
- `npm run indexnow:submit` reads generated sitemap URLs from `dist/` and submits them to the endpoint in `INDEXNOW_ENDPOINT`.
- If `INDEXNOW_ENDPOINT` is not set, the script submits to `https://api.indexnow.org/indexnow`.
- `FlowHome Automation` runs both:
  - the default IndexNow endpoint as a soft-fail step.
  - the Yandex IndexNow endpoint as a soft-fail fallback.

## Manual run

```bash
npm run build
npm run indexnow:submit
```

For a payload preview only:

```bash
npm run build
npm run indexnow:submit -- --dry-run
```

To submit through Yandex explicitly:

```bash
npm run build
INDEXNOW_ENDPOINT=https://yandex.com/indexnow npm run indexnow:submit
```

PowerShell equivalent:

```powershell
npm run build
$env:INDEXNOW_ENDPOINT='https://yandex.com/indexnow'
npm run indexnow:submit
$env:INDEXNOW_ENDPOINT=$null
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
6. After verification, rerun `npm run indexnow:submit`.

## Notes

- Google does not support IndexNow and deprecated unauthenticated sitemap pings. Google discovery depends on `robots.txt`, Search Console, WebSub/RSS discovery, normal crawling, or verified Search Console APIs.
- Keep the key file in `public/`; removing or changing it requires a fresh deployment before the next successful submission.
- CI treats IndexNow failures as non-blocking because search-engine authorization can fail independently from site correctness.

## WebSub / PubSubHubbub

FlowHome also publishes RSS update notifications to Google's public WebSub hub.

```bash
npm run websub:publish
```

For CI, WebSub is best-effort and must not block deploys.