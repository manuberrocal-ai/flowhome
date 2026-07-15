# FlowHome Organic Growth Runbook

This is a local, evidence-based operating loop for the US/Canada smart-home affiliate site. It is measurement-first: no traffic, ranking, revenue, or product claim is invented.

## Operating boundaries

- Execute only useful, evidence-backed work. Publish 2–3 useful reviews or updates per week; do not create thin scaled content.
- Paid advertising is explicitly out of scope. This runbook covers organic search, direct/owned follow-up, and affiliate measurement only.
- **Executable now:** establish the tracker, audit existing pages, record technical baselines, improve clearly useful pages, and prepare account/data requests.
- **Wait for 2–4 weeks/data/accounts:** interpret trend changes, select a new cluster, make strong title/meta decisions, compare affiliate outcomes, submit index requests, and use Canada/OneLink evidence.

## Measurement sources and KPI definitions

Record one row per source, cluster, page/query, and reporting window in `data/organic-growth-scorecard.csv`. The stable schema is:

`recorded_at,window_days,source,cluster,page_url,query,impressions,clicks,ctr,avg_position,sessions,engaged_sessions,affiliate_clicks,notes`

Use `source` values such as `GSC`, `GA4`, `Bing`, or `Amazon`; keep metrics native to their source. `impressions` and `clicks` are search exposure/actions; `ctr = clicks / impressions * 100`; `avg_position` is the source-reported mean position; `sessions` and `engaged_sessions` are GA4; `affiliate_clicks` are tracked outbound affiliate CTA clicks or Amazon-reported clicks when available. Never merge unlike source metrics. A report groups by `source + cluster` and derives CTR only from same-group clicks/impressions.

### Data entry

1. Use an ISO timestamp in `recorded_at` and the inclusive reporting window in `window_days`.
2. Copy values from GSC, GA4, Bing Webmaster Tools, and Amazon affiliate reports without rounding away useful precision.
3. Use the canonical page URL, a normalized query where available, and stable clusters: `robot-vacuums`, `smart-hubs`, or a candidate cluster.
4. Leave unavailable numeric fields blank; do not use zero unless the source explicitly reports zero. Explain exclusions, filters, country, device, and attribution in `notes`.
5. Run `npm.cmd run growth:report`; a header-only tracker must report no observations.

## Days 1–30

### Days 1–7 — establish a trustworthy baseline

- **Day 1:** confirm Search Console (GSC), GA4, Bing Webmaster Tools, and Amazon affiliate report access; document owner, timezone, country, and attribution windows. No account or submission action is performed locally.
- **Day 2:** export the first comparable GSC and Bing windows and GA4 landing-page window. Record the robot-vacuum and smart-hub baselines: indexed pages, impressions, clicks, CTR, position, sessions, engaged sessions, and affiliate clicks where available.
- **Day 3:** reconcile canonical URLs, sitemap/robots behavior, consent-safe analytics, and existing internal links. Flag missing data rather than filling it.
- **Day 4:** inventory pages by cluster and purpose. Identify pages with real usefulness, distinct intent, and a defensible update; reject thin or duplicative candidates.
- **Day 5:** review titles, meta descriptions, headings, freshness, and FAQ usefulness for the highest-impression pages. Prepare edits, do not mass-rewrite.
- **Days 6–7:** publish only the smallest useful fixes, record the change date, and establish the first weekly snapshot. Do not infer impact yet.

### Days 8–14 — improve proven clusters

- Review robot-vacuum and smart-hub queries/pages once per week across GSC and Bing; review GA4 engagement and affiliate clicks separately.
- Make 2–3 useful reviews/updates maximum for the week, prioritizing pages with impressions and an obvious intent/content gap. Each update must add comparison context, compatibility detail, caveats, or maintenance information.
- Refresh titles/meta only when query intent, page promise, and actual content agree. Keep one canonical title/description per URL and record before/after text in `notes`.
- **Decision gate:** continue a page when it has impressions and a clear usefulness improvement; hold when the signal is too small; revert/escalate when a change creates a technical or intent mismatch. No ranking claim before a comparable follow-up window.

### Days 15–21 — test one evidence-backed expansion

- Repeat the same source exports and annotate changes, seasonality, country, device, and page releases.
- Assess Smart Lighting as a **candidate only**. Choose it only if query demand, relevant internal coverage, affiliate availability, and a non-thin editorial angle are evidenced. Otherwise keep robot-vacuums/smart-hubs as the active clusters.
- Update 2–3 useful pages, not a scaled set. Add internal links where they genuinely help the reader.
- **Decision gate:** advance Smart Lighting to a small editorial test only with evidence from at least two sources or a clearly documented product/query gap; otherwise defer 2–4 weeks.

### Days 22–30 — decide, document, and reset

- Compare the same windows, source by source and cluster by cluster. Inspect GSC/Bing exposure, GA4 engaged sessions, and affiliate clicks without treating any as interchangeable.
- Keep, revise, or stop each tested update using: sustained/improving impressions; relevant CTR movement; engaged-session quality; affiliate click relevance; and absence of indexing/canonical problems.
- **Decision gates:** (1) scale only a useful cluster with repeatable evidence; (2) refresh title/meta only when the page fulfills the target intent; (3) stop a candidate with weak demand, duplication, or no defensible usefulness; (4) wait for another 2–4 weeks when data is insufficient.
- Write the next 30-day queue from observed gaps. Preserve the scorecard and change notes; do not backfill invented baselines.

## Recurring cadence and controls

- **Weekly:** one scorecard snapshot, one technical/indexing check, and 2–3 useful review/update slots. Check robots, canonicals, sitemap, broken links, and changed pages.
- **Every 2–4 weeks:** compare like-for-like windows and decide whether to continue, revise, defer, or stop. This is the minimum period for meaningful organic direction.
- **Title/meta refresh:** select a page with evidence, capture current copy and query/page metrics, write one intent-matched alternative, validate the page still delivers the promise, deploy once, and annotate the date. Do not rotate variants or mass-edit templates.
- **Content freshness:** refresh when product compatibility, standards, availability, or meaningful guidance changes; retain accurate evergreen sections and disclose uncertainty. A date change alone is not freshness.
- **Index submission:** submit only a genuinely new or materially updated canonical URL after deployment and sitemap validation. Deduplicate URLs, keep a local submission log, and never resubmit unchanged URLs on a schedule. Google discovery uses Search Console/sitemap/crawling; Bing/IndexNow requires the relevant verified account/key path.
- **Newsletter/syndication/social blockers:** do not create local email capture, syndicate duplicate copy, or post socially until consent, destination ownership, canonical handling, platform credentials, and a human approval path exist. RSS may be followed without claiming subscriber performance.
- **Canada/OneLink:** monitor Canada separately only after country data and Amazon OneLink/account coverage are available. Record country, marketplace, redirect behavior, click coverage, and conversion evidence; never assume US results apply to Canada.

## Explicit waiting list

Wait for the relevant accounts, exports, deployment, and 2–4 week comparison window before interpreting lift, selecting Smart Lighting, changing strategy, requesting broad indexing, assessing Canada/OneLink performance, or attributing affiliate revenue. The local report and header-only tracker are executable now and make no network calls.
