# FlowHome Block 4 Completion Report

Date: 2026-07-29

## Scope and closure

Block 4 delivered technical and programmatic SEO controls, reproducible local mobile Lighthouse evidence, performance budgets, and closure documentation. It did not start Block 5, create a CRM or data engine, access accounts, deploy, use Git operations, or make external-result claims.

## Root causes and implementation

- Global Google Fonts created a third-party render dependency; the site now uses a system font stack.
- Organization `sameAs` lacked verification evidence and was removed.
- Utility crawl contracts were incomplete; robots now disallows account, cart, and search, and sitemap generation excludes them.
- The retired comparison destination caused broken links and orphan comparisons; `/compare/` is a useful hub of existing curated definitions, comparison breadcrumbs visibly match JSON-LD, and the retired URL has a static 301 compatibility mapping.
- Consent-banner post-paint visibility caused measured lab CLS of about 0.157. A same-origin, storage-only prepaint bootstrap selects accepted/rejected/unset before body paint; the final local lab median CLS is 0. No analytics is loaded or dispatched by that bootstrap.
- Supabase/auth synchronization no longer ships as a global public-page payload. A localStorage key-name-only session hint gates dynamic initialization and rechecks on focus; anonymous local cart behavior remains immediate.
- Empty cart initialization no longer rewrites default DOM state or dispatches visibility events. Non-empty hydration and user changes retain the existing dock, accessibility labels, local save, and Amazon behavior.
- Header/footer branding and favicon use existing SVG assets. Home CSS is inline and the initial featured-card performance budget is eight cards while the hero remains six.

## SEO, schema, and crawl evidence

`seo:audit` verified 87 content pages with 0 errors and 0 warnings. Its report is `%TEMP%\flowhome-seo-audit-bwTnlh\report.json`.

| Observed maximum | Budget |
| --- | ---: |
| HTML 213,045 bytes | 300,000 bytes |
| Inline JavaScript 19,774 bytes | 120,000 bytes |
| First-party CSS/JS 132,474 bytes | 800,000 bytes |
| Remote images 29 | 64 |
| External scripts/styles | 0 / 0 | 0 / 0 |

The auditor validates Organization, WebSite, BreadcrumbList, ItemList, Product, Offer, and Review including nested product/offer/review claims. Article, HowTo, and FAQ are accepted and validated only when emitted; none are emitted because no eligible matching visible structure was identified. Product price, rating, availability, deal expiry, and Offer emission retain their source/freshness guards.

The final local browser report is `%TEMP%\flowhome-browser-qa-2026-07-29T23-55-24-563Z\report.json`: 16/16 Brave cases passed with 0 failures, 0 setup errors, and 0 cleanup errors. Loopback checks passed for home 200, robots 200, sitemap 200, and the deterministic missing path 404. `_redirects` syntax, internal destinations, and 301/302 policy are statically audited; Cloudflare-hosted redirect, 404, and header behavior remains external and unverified.

## Final local gates

| Gate | Verified result |
| --- | --- |
| `npm.cmd test` | 203/203 passed |
| Lint | PASS |
| Typecheck | 0 errors, 0 warnings; 155 non-failing hints |
| Build | 87 pages |
| `seo:audit` | 87 content pages, 0 errors, 0 warnings |
| `links:check` | 0 stale, 5 unknown; pass |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `diff-check` | PASS; LF/CRLF warnings only |
| Brave QA | 16/16 pass; 0 failures, 0 setup errors, 0 cleanup errors; HTTP checks home/robots/sitemap 200 and missing path 404 |

## Local Lighthouse evidence

Lighthouse 13.4.1 ran three complete mobile/default-throttling samples for home, product, review, and comparison. External HTTPS was blocked. The summary is `%TEMP%\flowhome-lighthouse-2026-07-30T00-06-39-646Z\summary.json`; all 12 samples had finite category scores and required LCP/CLS/TBT values, and median gates had 0 failures.

| Route | P/A/BP/SEO median | LCP | CLS | TBT | INP |
| --- | --- | ---: | ---: | ---: | --- |
| Home | 98 / 96 / 100 / 100 | 1764.683 ms | 0 | 0 ms | Unavailable |
| Product | 99 / 96 / 100 / 100 | 1620.6775 ms | 0 | 0 ms | Unavailable |
| Review | 99 / 100 / 100 / 100 | 1617.328 ms | 0 | 0 ms | Unavailable |
| Comparison | 100 / 100 / 100 / 100 | 1465.585 ms | 0 | 0 ms | Unavailable |

All 12 child processes exited nonzero after complete JSON output because Windows Brave/chrome-launcher cleanup hit `EPERM`. The runner recorded execution warnings and retained the complete reports; it now rejects missing finite LCP/CLS/TBT values before median aggregation and still fails incomplete samples and median budget defects. These are local lab measurements, not field Core Web Vitals.

## Rollout, rollback, and remaining blockers

No deployment occurred. A future staged rollout must independently verify deployed 301/404 behavior, headers, robots, sitemap, and field data. Roll back by concern: revert the related SEO metadata/crawl change, prepaint consent change, deferred-auth change, cart-idempotence change, or home performance change, then rerun local gates. Do not roll back unrelated P0–P2 work.

External search/indexing, Cloudflare behavior, field CWV, formal accessibility review, remote CI, traffic, and commercial outcomes remain unverified. All planned Block 4 local browser status evidence is recorded.

## Relevant files

- `scripts/qa/seo-audit.mjs` — build-output crawl, schema, image, and budget audit.
- `scripts/qa/lighthouse-mobile.mjs` — three-sample median local mobile Lighthouse runner.
- `scripts/qa/browser-smoke.mjs` — local browser and loopback HTTP status contracts.
- `docs/SEO_PERFORMANCE_AUDIT.md` — procedure, budgets, and local evidence.
- `data/program-baseline-scorecard.csv` — 14-area program baseline.

## Post-audit verification (2026-08-01)

The cross-block audit revalidated Block 4’s SEO, search/link, product/review, localization, consent, Node/CI, and isolated-preview boundaries without replacing dated evidence. See [`BLOCKS_0_9_AUDIT_REPORT.md`](BLOCKS_0_9_AUDIT_REPORT.md).
