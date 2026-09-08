# Evidence-weighted prioritization

FH-06 (2026-09-05): discovery and daily review share `catalog-prioritization.mjs`; see the [current operator method](../INTERNAL_PRODUCT_SELECTION.md). Legacy price/rating/commission approval and priority fields are retired, including their quiz/card consumers. Discovery writes review-only output without using Amazon credentials. Product commission classifications remain separate and null until reviewed; they never influence these scores.

`scripts/lib/daily-scoring.mjs` defines configurable, validated weights totaling 100. Each signal requires a finite value in [0,1] and an evidence reference. Unknown evidence contributes no points and is separately listed; its weight is **not** redistributed. No inputs means `score:null`, not a fabricated zero-performance measurement.

Deal weights: historical discount 25, freshness 15, relevance 15, demand 15, own conversion 15, availability 10, editorial evidence 5. Opportunity weights: search gap 30, content gap 25, decay 20, relevance 15, conversion gap 10. Trend weights: search growth 40, demand 30, relevance 30.

Current local catalog entries have only recorded editorial category membership as a known relevance signal; all other signals remain unknown. New ASINs have no presumed relevance and null scores until reviewed. These are incomplete review priorities, **not verified offers, trend detections, revenue predictions, commission rankings or lowest-price claims**. Standard Amazon access is not assumed to authorize historical price storage. Search Console and conversion integrations are not configured in this work.

Future inputs must provide source, capture time, rights, exact product/variant/market/currency identity and sufficient coverage. A score never authorizes publication. Queue entries require a human decision and independently validated claims.
