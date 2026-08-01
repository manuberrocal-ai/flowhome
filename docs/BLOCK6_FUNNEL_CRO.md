# Block 6 Funnel and CRO Baseline

This is an inactive, reversible baseline. The single registered experiment is `home_primary_cta_v1`; it is `draft`, both public flags are off by default, and no treatment is activated by this document.

## Funnel map

| Stage | Audience | Asset | CTA | Event | Primary metric | Protection metrics / guardrails | Owner | Exit criterion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TOFU | US consented visitors on home | Editorial hero and honest product context | Find my setup | `quiz_start` | Home-to-quiz start rate | Errors, bounce/engagement proxy, accessibility, no navigation delay | Unassigned | Sufficient comparable traffic and approved review |
| MOFU | US consented home visitors who start quiz | Quiz questions and useful shortlist | Continue quiz | `quiz_complete` | Quiz completion rate | Completion time, empty/error states, mobile CTA reachability | Unassigned | At least 30 `quiz_complete` per arm and 14 days |
| BOFU | US consented quiz completers | Recommendation and direct Amazon context | Check on Amazon | `affiliate_click` | Quiz-complete-to-affiliate-click rate | Direct URL/tag integrity, no dark patterns, provider failures, consent | Unassigned | Human review after day 28 with guardrails clear |

The experiment CTA copy is the only treatment surface. Both variants continue to `/quiz/`; Amazon links, save behavior, consent, and navigation remain unchanged. Success is never CTR-only: a decision requires the primary funnel metric, protection metrics, sample balance, guardrails, and comparable windows.

## Surface audit

| Surface | Current state | Gap | Guardrail | Evidence path |
| --- | --- | --- | --- | --- |
| Cards | Product cards provide product/detail, direct Amazon, and anonymous-list actions | No Block 6 treatment or experiment metric on cards | Preserve direct link metadata and list action | `src/components/ProductCard.astro` |
| Product pages | Product profile provides direct Amazon CTA, disclosure, and compatibility context | No Block 6 treatment | Preserve tagged direct URL and disclosure | `src/pages/product/[slug].astro` |
| Search | Client-side name/brand/category search renders matching cards | No Block 6 experiment instrumentation | Do not change query matching or result rendering | `src/pages/search.astro` |
| Filters | Category pages statically select catalog-active products by category; no dedicated interactive filter was inspected | No Block 6 filter treatment or telemetry | Preserve category discoverability | `src/pages/category/[slug].astro` |
| Comparisons | Curated comparison routes and index expose documented side-by-side guidance | No Block 6 treatment | Preserve comparison context | `src/pages/compare/[...slugs].astro`, `src/pages/compare/index.astro` |
| Quiz | Five-step quiz renders a shortlist, including an explicit no-match summary | `quiz_start` is diagnostic; outcome validation remains pending | Preserve completion and no-match explanation | `src/pages/quiz.astro` |
| Empty | Cart has an empty-list message and browse-products action | No CRO copy change | Keep a useful recovery action | `src/pages/cart.astro` |
| Error | 404 provides a home link; cart provides unreadable-storage recovery | No Block 6 error treatment | No blocked navigation or false success | `src/pages/404.astro`, `src/pages/cart.astro` |
| Confirmation | Quiz exposes a focused results region; cart exposes persisted-list state and feedback region | No separate Block 6 confirmation treatment | Keep state honest; do not duplicate exposure | `src/pages/quiz.astro`, `src/pages/cart.astro` |
| Mobile CTA | Primary home CTA is `/quiz/` with 48px minimum height (exceeds the 44px guardrail); smoke checks inactive experiment state at 375px | No active treatment | Reachable, accessible, reduced-motion safe | `src/pages/index.astro`, `scripts/qa/browser-smoke.mjs` |

The experiment primary is `quiz_complete` per `experiment_exposure`; `quiz_start`/exposure is diagnostic, not success. No CTR-only decision is valid.

## Hypothesis and decision record

- **Hypothesis:** Clearer, accessible home CTA copy may increase qualified quiz starts without reducing quiz completion, direct affiliate integrity, anonymous save, or accessibility.
- **Experiment:** `home_primary_cta_v1`, US + home + accepted consent, control/treatment, assignment version `v1`, minimum 14 days and 30 `quiz_complete` per arm, sample balance and guardrails required.
- **Runtime contract:** Production keeps the registry definition `draft` and both public flags off; public environment values cannot promote a draft registry entry. Therefore normal production builds cannot assign, expose, or change CTA copy. The active-state path exists only in the strictly local browser-QA harness, which injects an in-memory active copy and is not shipped by the application. That harness verifies the same consent/segment gate, runtime kill switch and exact rollback, mutual exclusion, and once-per-session queued exposure behavior. States remain `draft → active → paused/killed` for a future explicitly reviewed activation; flags are the kill switch and do not promote registry state.
- **Review:** Inspect on day 28. Require 14 days, at least 30 `quiz_complete` outcomes per arm, 45%–55% exposure balance, and confirmed protection metrics. Automatic winner selection is prohibited. Evidence is `Unknown` when insufficient; a human may continue, revise, defer, or stop.
- **Decision record:** Unknown — no activation, outcome, or production result is claimed.
