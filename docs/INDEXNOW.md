# IndexNow Operations

FlowHome uses IndexNow to notify Bing and other participating search engines when public URLs are added or updated.

## What is configured

- A public IndexNow key file is hosted at the site root.
- `npm run indexnow:submit` reads generated sitemap URLs from `dist/` and submits them to `https://api.indexnow.org/indexnow`.
- `FlowHome Automation` runs the submitter after scheduled/content automation.

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

## Notes

- Google does not support IndexNow and deprecated unauthenticated sitemap pings. Google discovery still depends on `robots.txt`, Search Console, or the Search Console API with a verified property.
- Keep the key file in `public/`; removing or changing it requires a fresh deployment before the next successful submission.
## WebSub / PubSubHubbub

FlowHome also publishes RSS update notifications to Google's public WebSub hub.

```bash
npm run websub:publish
```

For CI, WebSub is best-effort and must not block deploys.