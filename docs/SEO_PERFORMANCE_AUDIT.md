# FlowHome Block 4 — Technical SEO and Performance Audit

Date: 2026-07-29

## Scope and evidence boundary

This block records local build-output, browser, and Lighthouse evidence. It does not access a search, analytics, retailer, or deployment account; it does not claim field Core Web Vitals, indexing, redirects delivered by a host, or external performance results.

## Findings and corrective changes

- The base layout made every page depend on Google Fonts. It now uses system font stacks, removing a render-blocking third-party stylesheet and two preconnects while preserving the existing navy, teal, and orange tokens.
- Organization schema included public-profile `sameAs` URLs without repository evidence that they are verified. They are omitted rather than asserted.
- `robots.txt` now blocks the existing noindex utility routes (`/account/`, `/cart/`, `/search/`). Their rendered `noindex, nofollow` declarations and sitemap exclusion remain the source-level contract.
- Avatar images now declare dimensions and loading/decoding behavior, so all rendered image slots have stable geometry. Critical product/hero images retain eager/high priority; cards and footer media remain lazy.
- Product prices, ratings, availability, and deals remain source-bound. Stale price records are visibly labelled historical; Offer JSON-LD is emitted only by `getCommerceData()` for a valid HTTPS URL and a price record fresh within seven days. Availability needs a separately sourced record fresh within 24 hours. Expired deals are not promoted.

## Local audit and budgets

Run after a production build:

```powershell
npm.cmd run build
npm.cmd run seo:audit
```

`seo:audit` writes JSON outside the repository by default and fails on canonical/title/description/H1 duplication or drift, robots/sitemap/redirect contracts, indexable query crawl traps, missing built HTML or non-HTML targets, indexable sitemap orphans, invalid schema claims, and missing image `alt`/dimensions. Host-verification HTML and the noindex 404 output are deliberately not treated as content pages.

| Budget | Gate |
| --- | --- |
| HTML per page | <= 350,000 bytes |
| Inline JavaScript per page | <= 120,000 bytes |
| First-party CSS/JS per page | <= 800,000 bytes, with per-template observed maximum recorded |
| External executable resources | 0 scripts and 0 stylesheets |
| Remote images | <= 64 per page, reported separately from executable third parties |
| Fonts | 0 external font stylesheets or preconnects |
| Product/Offer/Review | no aggregate retailer rating; prices/availability only when the source freshness guard permits it |

The script’s report path can be set with `SEO_AUDIT_REPORT_PATH`; it rejects a repository path to keep full reports out of version control.

Verified 2026-07-29 audit evidence is `%TEMP%\flowhome-seo-audit-bwTnlh\report.json`: 87 content pages, 0 errors, and 0 warnings. Observed maxima were 213,045 HTML bytes, 19,774 inline JavaScript bytes, 132,474 first-party CSS/JS bytes, and 29 remote images. These are below the respective former 300,000, 120,000, 800,000, and 64 budgets in effect at that time; external scripts and stylesheets were both 0. Remote retailer media are counted and reported separately; they are not described as only the footer QR image.

## Mobile Lighthouse procedure

Lighthouse 13.4.1 is installed as a repository development dependency. The runner uses that local binary by default, auto-detects Brave (or honors `LIGHTHOUSE_CHROME_PATH`/`BRAVE_PATH`), passes the resolved executable through Lighthouse's supported `CHROME_PATH` child environment variable, starts and stops local Astro preview when required, and stores reports outside the repository:

```powershell
npm.cmd run build
npm.cmd run lighthouse:mobile
```

The deterministic mobile templates are home, one product, one review, and one comparison. The runner uses Lighthouse’s mobile/default throttling and enforces **Performance 90, Accessibility 95, Best Practices 95, SEO 95, LCP <= 2,500 ms, CLS <= 0.1, and TBT <= 200 ms**. It records INP only when the lab provides it. It passes the supported `--no-enable-error-reporting` opt-out, uses an isolated temporary browser profile, and blocks external network requests. It writes one JSON report per route plus `summary.json` to `%TEMP%\flowhome-lighthouse-*` by default. `LIGHTHOUSE_OUTPUT_DIR` may choose another location outside the repository.

Verified local lab evidence is `%TEMP%\flowhome-lighthouse-2026-07-30T00-06-39-646Z\summary.json`: Lighthouse 13.4.1, mobile/default throttling, three complete samples per route, external HTTPS blocked, and zero median-gate failures. All 12 samples had finite category scores and required LCP, CLS, and TBT values. Scores and metrics below are synthetic local lab evidence only; they are not field Core Web Vitals. INP was unavailable in all samples.

| Route | Performance | Accessibility | Best Practices | SEO | Median LCP | Median CLS | Median TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 98 | 96 | 100 | 100 | 1764.683 ms | 0 | 0 ms |
| Product | 99 | 96 | 100 | 100 | 1620.6775 ms | 0 | 0 ms |
| Review | 99 | 100 | 100 | 100 | 1617.328 ms | 0 | 0 ms |
| Comparison | 100 | 100 | 100 | 100 | 1465.585 ms | 0 | 0 ms |

All 12 samples returned a Windows Brave/chrome-launcher `EPERM` only after writing complete JSON reports. The runner retained those complete reports as execution warnings; it now rejects any sample missing finite LCP, CLS, or TBT before median aggregation and still fails median budget failures.

## Remaining platform checks

- Verified local browser evidence is `%TEMP%\flowhome-browser-qa-2026-07-29T23-55-24-563Z\report.json`: 16/16 Brave cases passed with 0 failures, 0 setup errors, and 0 cleanup errors. Its loopback HTTP checks passed for home 200, robots 200, sitemap 200, and the deterministic missing path 404. Static `seo:audit` checks `_redirects` syntax, destinations, and 301/302 policy; deployed Cloudflare redirect, 404, and header behavior remains external and unverified.
- Sitemap generation is checked by the build and excludes account, cart, and search. The audit verifies built routes and internal hrefs; it does not claim that a remote crawler has fetched them.
- Query search is a client utility route with a stable `/search/` canonical and `noindex, nofollow`; there are no server-rendered facets or pagination routes to crawl. Any future parameterized indexable route requires an explicit canonical, crawl policy, finite page set, and internal-link audit before release.
- Google identity, GTM, and Clarity remain runtime/consent or user-triggered boundaries and require separate privacy/performance review if activated.

## Closure

Block 4 is limited to technical SEO and performance controls. Google Fonts were replaced with a system stack; unverified Organization `sameAs` was removed; robots blocks account/cart/search; the sitemap excludes those noindex utilities; the comparison hub, compatibility 301, and visible matching breadcrumbs repair crawl paths; consent prepaint removed measured lab CLS from about 0.157 to 0 without loading analytics; Supabase/auth synchronization is deferred behind a token-name-only session hint; the empty cart dock is idempotent; SVG brand assets replaced the logo/favicon payloads; home CSS is inline and the initial featured-card budget is eight. No Block 5 data/offer/compatibility engine, account action, Git operation, deployment, external account access, or external result claim was performed.

## FlowHome visual restoration follow-up

The restored visual system now uses self-hosted Latin-only Inter Variable and Plus Jakarta Sans Variable WOFF2 files with `font-display: optional`. The original 1076x250 PNG remains the approved master asset and Organization JSON-LD logo, while Header and Footer use the responsive 430x100 8,998-byte derivative via `srcset` with the original fallback retained. Astro inlines the project CSS, and the consent prepaint is inline and allowed by the exact CSP SHA-256 hash without `unsafe-inline`. The current 350,000-byte HTML cap accommodates that intentional CSS inlining.

Verified local evidence is `%TEMP%\flowhome-lighthouse-2026-08-09T02-59-25-331Z\summary.json`: 3 complete samples per 4 routes, zero median-gate failures, external HTTPS blocked, and synthetic lab results only, not field CWV. Medians were Home 96/96/100/100 with LCP 2407.262 ms, CLS 0, TBT 0; Product 97/96/100/100 with LCP 2257.976 ms; Review 97/100/100/100 with LCP 2258.360 ms; Comparison 97/100/100/100 with LCP 2184.184 ms. EPERM warnings occurred only during post-report cleanup.

Current SEO audit evidence is `%TEMP%\flowhome-seo-audit-ivKvAp\report.json`, 88 content pages, max HTML 324,639 bytes, 0 errors, 0 warnings, within the current 350,000-byte cap.

Validation also recorded 488/488 tests passing, lint PASS, typecheck across 205 files with 0 errors, 0 warnings, and 155 hints, build output for 88 pages, Browser QA 20/20 at `%TEMP%\flowhome-browser-qa-2026-08-09T03-10-23-662Z\report.json`, and `git diff --check` PASS with LF/CRLF warnings only. No deploy or external-result claim is made.
