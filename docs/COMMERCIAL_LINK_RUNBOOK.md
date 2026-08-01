# FlowHome Commercial Link Runbook

`npm run links:check` is a strict local health monitor. It makes no network request, Amazon probe, scrape, provider call, or data update. It parses repository URLs and source CTA contracts only. Set `LINK_CHECK_REPORT_PATH` to an explicit report file when machine-readable JSON is needed; the command never overwrites catalog data.

## Contract

- HTTPS and `amazon.com`/`www.amazon.com` only.
- Product links must be `/dp/{ASIN}` with exactly one query parameter: `tag=flowhome-20`.
- Cart links must be `/gp/aws/cart/add.html` with exactly one `AssociateTag=flowhome-20` plus paired valid `ASIN.N` and positive `Quantity.N` parameters; no other parameters are allowed.
- No UTM, click ID, user/dynamic subtag, cloaking, redirect destination, duplicate tag, arbitrary query parameter, username/password, non-default port, or fragment.
- Source retailer CTAs must be direct `<a>` elements with a literal validated URL or recognized affiliate/cart expression, `data-fh-amazon-cta`, `_blank`, exact `rel="nofollow sponsored noopener noreferrer"`, and a safe `data-cta-position`. Buttons and missing/unknown hrefs are broken.

## Severity and response

| Status | Meaning | Severity | Response |
| --- | --- | --- | --- |
| `broken` | Contract parsing or validation failed | High | Stop release/repair the exact reported path; rerun the check. The CLI exits nonzero. |
| `stale` | Local freshness date is older than 90 days | Medium | Review source evidence manually; update only through approved catalog maintenance. The CLI warns and reports it. |
| `unknown` | No usable local freshness date | Low | Record the gap; do not infer live Amazon availability. |
| `valid` | Local format and freshness metadata pass | Informational | This is not proof of live retailer availability. |

The current alert mechanism is CI/nonzero command exit only; no external alert integration is claimed. The owner is **Commercial/Engineering owner (unassigned)**. Repair `broken` findings before release, review `stale` findings in the next weekly review, and place `unknown` freshness gaps in the backlog.

If a broken finding appears, preserve the report, repair the local direct URL/CTA contract, and rerun the focused test plus `npm run links:check`. Do not click, scrape, probe, or activate Amazon to diagnose it. Amazon account state, link performance, revenue, conversion, dashboards, and provider data are **Unknown/external**. Roll back an unsafe deployment by restoring the prior validated direct link; never add a cloaking layer.
