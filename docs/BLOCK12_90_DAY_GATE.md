# Block 12 — 90-day validation gate

The gate is provisional and never reports `success`. Current state: **PENDING**.

## Windows and evidence

| Window | Required record | Comparison rule |
| --- | --- | --- |
| D0 | release/version, baseline source, consent coverage, exclusions, segment counts | freeze definitions before interpretation |
| D30 | 30-day comparable snapshot and technical checks | same source/country/device/landing cluster where possible |
| D60 | second comparable snapshot, missingness and release log | explain changes; no early success claim |
| D90 | final comparable snapshot and pre-agreed decision calculation | only now may a provisional decision be recorded |

Technical checks need one reproducible local run per release. The pure gate also requires `comparableWindows >= 2`, `confidenceIntervalsComputed === true`, and `biasReviewComplete === true`; any missing condition returns `defer`, never `continue`. Outcome decisions require at least two comparable windows and **≥30 outcomes per primary segment**. No volume means `time_volume_dependent`; no access, approval, deployment, or source means `externally_blocked`.

## Samples and statistics

Keep countries, GSC/Bing/GA4/Amazon sources, devices, landing-page clusters, consent states, and experiment arms separate. Record denominators, missingness, null/unknown values, bot filters, attribution windows, and explicit exclusions. For proportions/rates use the pure Wilson 95% interval in `contracts.ts` with counts and segment labels. For sparse continuous metrics, use a documented bootstrap procedure: resample observed non-missing values within the same segment/window at least 1,000 times, report the percentile 95% interval, and show the missingness rate; if no defensible sample exists, defer. Never merge unlike sources or treat one event as a success claim.

## Bias and provisional thresholds

Record seasonality, country/device mix, consent loss, bot/filter differences, attribution windows, release timing, selection into affiliate clicks, survivorship, source changes, and small samples. Thresholds are provisional: candidate availability 99.9%/30d, critical flow 100% synthetic per release, CTA 100% contract-valid per release, zero expired surfaced with price 7d/availability 24h freshness, ingestion p95≤15m, Lighthouse 90/95/95/95, LCP≤2500ms, CLS≤0.1, TBT≤200ms, existing SEO budgets, and ≥30 outcomes/segment.

## Decision rules

- `continue`: D90, sufficient volume, comparable windows, interval and pre-agreed trigger support continuation.
- `revise`: evidence is sufficient but a provisional threshold or implementation needs adjustment.
- `defer`: before D90, below volume, missingness too high, or sparse metrics lack a defensible interval.
- `stop`: D90 evidence meets the pre-agreed stop rule or a safety boundary requires stopping.
- `externally_blocked`: required account, approval, deployment, source, or alert infrastructure is unavailable.

No early movement, historical baseline, local synthetic result, or mock outcome can produce a success state. Browser QA/Lighthouse for this documentation/contracts change are N/A/not executed, subject to final audit.
