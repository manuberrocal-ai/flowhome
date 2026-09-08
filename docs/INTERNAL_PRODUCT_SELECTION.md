# Internal product review — current method

Updated 2026-09-05 (FH-06). This operator workflow creates review candidates, not approved products. No score is a sales forecast, commission ranking, verified deal or publication permission.

## Command and report

Run `npm run discover:products`. Output: `reports/discovery/product-review.json`, outside published collections and versioned data. Active, unambiguous identities enter `needs-review`; invalid/duplicate identities are reported and inactive records remain inactive. The report contains every evaluation. Ordering uses opportunity points, coverage and slug, never commission.

`FLOWHOME_ROI_PHASE` is retired and ignored with a warning. Seed/growth thresholds, approval/lead/hero tiers and five obsolete ROI code/report files were removed; prior versions remain recoverable through Git. No workflow was activated. Trends Monitor runtime/scheduling review remains FH-04.

## Evidence and limits

Discovery and daily review share `catalog-prioritization.mjs` and the [evidence-weighted method](data/deal-score-methodology-v3.md). A recognized category with local provenance establishes only editorial relevance: deal 15/100 at 15% coverage; opportunity 15/100 at 15%; trend 30/100 at 30%. These are different scales, not business performance.

No known evidence means null score and zero coverage. Missing weights are never redistributed. Invalid/inactive classifications have no relevance signal. Price, ratings, discounts, compatibility flags and legacy approval/priority cannot inflate these reports. New inputs need independently reviewed source, identity, time, rights and meaning; a non-empty reference alone is not external verification.

The 28 products and schema no longer carry ROI priority fields. The quiz and product cards no longer consume them; no automatic “Top pick” badge is derived from a tier. Other product and compatibility claims still require FH-07/FH-20 review.

## Commission classification is not income

`data/amazon-commission-classifications.json` is a separate trusted review registry. It currently contains **no verified product classifications**, so category and rate are null for all 28 products. A camera or smart display does not automatically qualify for Ring or Echo fees. No default 4% applies.

Before adding a record, verify exact ASIN/US market, category assignment and applicable rate independently. Required fields: `asin`, `market`, `state`, `amazonCategory`, `rate`, `classificationEvidence`, `rateSource`, `scheduleVersion`, `reviewedAt`, `validUntil`. Dates are strict UTC. Approval is a documented review, never a field copied from the product payload. Recheck the official schedule when recording a classification; its dated local subset is not a future-rate guarantee. The validity deadline is a reviewer-imposed recheck, not an Amazon promise.

Missing, duplicate, revoked, future, expired, mismatched or unsubstantiated records stay unknown. A verified zero rate differs from null. The rate table alone cannot establish an ASIN's classification. The resolver consumes trusted local records; it is not a new authentication system.

The [official US schedule](https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ), checked 2026-09-05, applies rates to qualifying revenue. Price multiplied by a rate is not confirmed commission, profit or ROI. Estimated-commission fields remain null and classification never affects editorial scores. Actual qualified purchases, returns, costs and comparable periods belong to FH-25.

## Verification

Run `node --test test/product-discovery.test.mjs test/flowhome-daily.test.mjs test/quiz-recommend.test.mjs`. Coverage includes manual-value invariance, missing evidence, CLI output, shared scores, identity and classification boundaries, and retired UI consumers. Fixtures prove local behavior only; source connections, publication, monitoring and business results remain unverified.
