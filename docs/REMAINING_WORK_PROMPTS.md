# FlowHome Remaining Work — Token-Efficient Prompts

Use one block per fresh session. Do not concatenate blocks. Close and summarize each block before starting the next. Every block assumes P0–P2 are complete and verified as documented in docs/P2_COMPLETION_REPORT.md.

## Shared baseline

- Repository: C:\AGENTES\Proyectos\flowhome
- Preserve existing URLs, SEO, honest data, P0/P1/P2 behavior, and navy/teal/orange identity.
- Never invent prices, stock, ratings, authors, tests, traffic, conversions, credentials, or external API results.
- Do not scrape restricted platforms or bypass terms.
- Preserve unrelated worktree changes; inspect Git before editing.
- Use mocks/interfaces and exact activation steps when credentials, permissions, budgets, or real data are unavailable.
- Required final gates unless the block explicitly says otherwise: npm.cmd test, npm.cmd run lint, npm.cmd run typecheck, npm.cmd run build, git diff --check. Run npm.cmd run qa:browser for UI/runtime changes.

---

## Block 1 — Dependency security and CI quality gates

~~~text
Work only on dependency security and CI quality gates in C:\AGENTES\Proyectos\flowhome. Read docs/P2_COMPLETION_REPORT.md first. Do not start growth, CRM, data-platform, or content-factory work.

Inspect package.json, package-lock.json, workflows, official current advisories, and compatibility notes. Resolve the six production npm-audit findings without force upgrades: @astrojs/rss, Astro, fast-xml-parser, postcss, sharp, and svgo. Prefer targeted patch/minor upgrades permitted by official compatibility. Do not suppress advisories. Add lint and typecheck to the existing quality/deploy workflows if absent, and preserve browser QA as an explicit local or CI-capable gate with documented Brave requirements.

Acceptance: npm audit --omit=dev is clean or each unavoidable advisory has exact package path, exploitability analysis, owner, mitigation, and review date; all tests, lint, typecheck, build, diff-check, and browser QA pass. Document dependency changes and rollback. Do not perform deployment, commit, or push unless explicitly requested.
~~~

## Block 2 — Baseline scorecard, phased roadmap, and ownership

~~~text
Work only on the measurable baseline and implementation roadmap for FlowHome. Read docs/P2_COMPLETION_REPORT.md and current project docs. Do not implement other annex systems yet.

Create a reproducible before/current scorecard for UX, reliability, conversion, technical SEO, editorial SEO/E-E-A-T, GEO, acquisition, catalog/deals, trends, analytics, automation, trust/privacy, performance, and accessibility. Every row must include metric, source, date, owner, sample/window, status, evidence, target, and gap. Unknown values must remain unknown. Create phases 0–6 with dependencies, migrations, environment variables, feature flags, tests, Definition of Done, observability, rollout, rollback, and explicit external blockers. Add operating cadences and provisional 90-day validation requirements, but do not claim outcomes.

Acceptance: documentation is internally linked, evidence-backed, and clearly separates implemented, technically tested, externally blocked, and time/volume dependent work. Run documentation-related tests and all repository gates. Do not build unrelated features.
~~~

## Block 3 — Commercial links, consent-aware analytics, and attribution

~~~text
Work only on commercial-flow integrity, link health, event taxonomy, consent, and attribution. Preserve the verified anonymous Amazon and local-save flows.

Audit every retailer CTA and implement non-blocking outbound tracking with consent-aware, deduplicated events. Consolidate the required event taxonomy and fields, UTM rules, anonymous/session identifiers, experiment fields, market/device/consent state, and attribution preservation. Extend link monitoring to validate destination, affiliate tag, HTTPS, attributes, status, and stale/broken states without scraping Amazon. Add dashboards or report contracts only where data exists. Add E2E proving anonymous outbound navigation and local save without authentication, and sync-only login prompts.

Acceptance: critical events fire once; navigation never waits for analytics; no PII enters URLs/logs; consent states are tested; broken-link monitoring has alerts/runbook; all gates and browser QA pass. External GA4/Search Console/warehouse activation must use interfaces, mocks, required variables, permissions, and exact manual steps—never fake production data.
~~~

## Block 4 — Technical SEO, programmatic SEO, and performance budgets

~~~text
Work only on technical/programmatic SEO and measurable performance. Do not write a broad content strategy or build CRM/data engines.

Audit rendered HTML, titles/descriptions, headings, canonicals, robots, sitemaps, status codes, redirects, faceting/parameters, pagination, orphan pages, breadcrumbs, structured data, image contracts, fonts, CSS/JS/third-party budgets, and retired/expired content handling. Validate Organization, WebSite, BreadcrumbList, ItemList, Product, Offer, Review, Article, HowTo, and FAQ only where visible and eligible. Prevent thin, doorway, duplicate, and crawl-trap pages. Establish reproducible Lighthouse runs for representative mobile templates and record truthful baseline scores against 90/95/95/95 and CWV targets.

Acceptance: schema matches visible data; no unsupported stock/rating/price claims; crawl controls and internal links are tested; budgets are documented and enforced where practical; tests, lint, typecheck, build, browser QA, schema checks, and Lighthouse evidence pass. Do not claim field CWV without real-user data.
~~~

## Block 5 — Editorial E-E-A-T, GEO, localization, and authority

~~~text
Work only on editorial trust, E-E-A-T, GEO/citability, localization rules, and external-authority process. Preserve honest FlowHome Editorial Team fallback and never invent people or credentials.

Audit author/reviewer profiles, publication/update/human-review dates, methodology, corrections policy, sources, affiliate disclosure, evidence levels, and sensitive-claim review. Create concise answer-first sections, definitions, tables, FAQs, and stable citation blocks only where they add visible value. Define Product/Brand/Merchant/Category/Offer/Author/Organization entity consistency, verified sameAs, bot/snippet policy, OAI-SearchBot versus GPTBot decision, assistant-referral tracking, market/currency/availability rules, and reciprocal hreflang only for real localized equivalents. Define legitimate digital-PR/backlink monitoring without link buying.

Acceptance: visible content and schema agree; no cloaking or invented AI markup; llms.txt is optional and never presented as a ranking factor; sources and geographic scope are explicit; tests and all standard gates pass. Document what requires human editorial approval or external evidence.
~~~

## Block 6 — Funnel, CRO, feature flags, and experiments

~~~text
Work only on the TOFU/MOFU/BOFU funnel, CRO framework, and controlled experimentation. Do not implement CRM sending, trend ingestion, or paid-media automation.

Map each funnel stage to audience, asset, CTA, event, primary metric, guardrails, owner, and exit criterion. Audit card, product, search, filters, comparison, quiz, empty/error/confirmation states, and mobile CTA hierarchy. Implement a reversible feature-flag and experiment baseline with hypothesis, assignment, mutual exclusion where needed, kill switch, exposure event, primary/protection metrics, segment, minimum duration/sample, state, and decision record. Do not conclude experiments with insufficient data or optimize only superficial CTR.

Acceptance: variants are deterministic and auditable; assignment fires once; accessibility and direct retailer behavior remain intact; no dark patterns or false social proof; rollout/rollback are documented; unit/integration/browser tests and all standard gates pass. Real conversion conclusions remain pending until sufficient data exists.
~~~

## Block 7 — Consent-based CRM, email, alerts, and lifecycle

~~~text
Work only on optional account/email lifecycle capabilities. Preserve anonymous local save and require login only for explicit cross-device or persistent benefits.

Design and implement the smallest consent-based preference model for categories, market, frequency, alerts, and suppression. Add progressive capture only after value delivery. Prepare onboarding, digest, price-drop, restock, comparison follow-up, recommendation, and reactivation states with frequency caps, unsubscribe, consent record, and deletion/export handling. Do not send real email without approved provider credentials, domain configuration, and explicit authorization. Provide provider interfaces/mocks plus SPF, DKIM, DMARC, environment variables, webhook verification, retry/idempotency, and activation steps.

Acceptance: local-only users remain fully functional; consent and unsubscribe are immediate and tested; no email/PII appears in logs or URLs; jobs are idempotent; UI and all gates pass. Report delivery/open/click/conversion only when sourced from a real provider and legally appropriate.
~~~

## Block 8 — Offer, price history, DealScore, and TrendScore

~~~text
Work only on authorized offer/price/trend data and explainable scoring. Do not connect unapproved external APIs or scrape retailers/social platforms.

Model ProductVariant, Merchant, Offer, PriceSnapshot, TrendSignal, TrendTopic, and DealCandidate with market, currency, shipping, coupons/conditions, availability, affiliate URL, source, capturedAt, history windows, confidence, and lifecycle states. Implement idempotent ingestion interfaces, deduplication, variant resolution, freshness/expiry, anomaly detection, retries/backoff, and test fixtures. Implement explainable DealScore and TrendScore baselines with documented inputs and penalties. Never label lowest price/super deal without sufficient history and fresh verification.

Acceptance: deterministic scores and state transitions are tested; stale/expired offers cannot be promoted; no fabricated production data; source failures are isolated; admin review/override contract and audit trail are defined; all gates pass. External feeds/APIs require current official documentation, permissions, quotas, variables, mocks, and activation steps.
~~~

## Block 9 — Compatibility graph and Claim Ledger

~~~text
Work only on the compatibility graph, claim provenance, and decision-page integration. Do not build the general data platform or content factory.

Model product/variant/generation/hardware/firmware, ecosystems, protocols, hub/bridge, local/cloud operation, subscriptions, installation/electrical/housing constraints, market availability/warranty, complements, substitutes, and known conflicts. Every edge requires source, market, verifiedAt, confidence, scope, expiry, and status. Add contradiction/expiry checks and an admin-review contract. Build a Claim Ledger with exact claim/location/entity/version/market/source/validation/confidence/review date/owner/status/history. Integrate only verified facts into filters, quiz, comparisons, alternatives, and product-page evidence levels: Hands-on tested, Research verified, or Data evaluated.

Acceptance: unknown remains Unknown / not verified; no name-based inference; expired/disputed claims degrade or disappear; consistency tests pass; visible content and schema agree; all standard and browser gates pass. Never use “tested” without documented physical testing.
~~~

## Block 10 — Data platform, resilient jobs, admin review, and autonomous governance

~~~text
Work only on shared data architecture, operations, admin review, and bounded automation. Build on completed offer/compatibility schemas if available; otherwise define interfaces without duplicating them.

Implement or specify Product, ProductVariant, Merchant, Offer, PriceSnapshot, TrendSignal/Topic, DealCandidate, ContentAsset, Campaign, Experiment, AnalyticsEvent, UserPreference, ConsentRecord, and AuditLog with constraints, indexes, source, timestamps, and states. Add idempotent jobs, queues, retries/backoff, dead-letter handling, rate limits, tracing, alerts, partial-failure isolation, and audited manual overrides. Add rule/model/prompt versioning, explanations, feature flags, rollback, kill switch, drift detection, publication/spend limits, and human approvals for risky actions. Start with explainable rules, not bandits/models without data.

Acceptance: migration/rollback and threat model are documented; RBAC/PII/secrets boundaries are tested; failure/retry/duplicate scenarios pass; admin actions are audited; all standard gates pass. No autonomous publishing, spending, legal/privacy changes, or destructive bulk action without explicit approval.
~~~

## Block 11 — Multichannel content, official APIs, creators, and diversification

~~~text
Work only on compliant acquisition operations and commercial diversification. Do not auto-publish, buy ads, or access accounts without explicit authorization.

Create the content queue and state machine from idea through verification, script/assets, human review, approval, publication, measurement, iteration, and retirement. Define TikTok/Reels/Shorts/YouTube/Pinterest/email variants, hooks, subtitles, covers, CTA, normalized UTM, rights, disclosures, and creator briefs. Verify current official Amazon successor API/feed policy, TikTok and other platform APIs, OAuth scopes, quotas, review requirements, asset rights, and manual fallback. Prepare draft-generation and approval workflows only. Define retailer/manufacturer diversification, sponsored/editorial separation, commission independence, and concentration guardrails.

Acceptance: no scraping or browser-based policy evasion; all integrations use official interfaces/mocks and exact activation steps; no public posting or spend occurs; attribution contracts are testable; editorial ranking cannot be changed by commission; all repository gates pass. Report external permissions, budgets, and approvals separately.
~~~

## Block 12 — SLOs, runbooks, monitoring, final report, and 90-day gate

~~~text
Work only on operational readiness and the provisional/final validation framework after prior blocks are complete. Do not invent historical metrics.

Define owners and daily/weekly/monthly/quarterly cadences. Establish SLOs and alerts for site/critical-flow availability, broken retailer CTAs, expired offers, ingestion lag, jobs/queues/APIs, CWV, indexation, traffic/conversion/citability changes, consent/security incidents, and data anomalies. Create severity, alert channel, response target, runbook, rollback, and blameless postmortem templates. Build the final implementation matrix separating implemented, technically tested, validated with real users/data, externally blocked, time/volume dependent, and discarded. Define 90-day samples, windows, confidence intervals, segments, biases, and provisional thresholds without claiming success early.

Acceptance: monitoring is connected only where real infrastructure exists; synthetic/mocked checks are labelled; rollback is exercised safely; all technical gates pass; the final report lists evidence, risks, credentials/approvals, rollout, and backlog. A 10/10 or business outcome may be declared only after sufficient 90-day evidence.
~~~
