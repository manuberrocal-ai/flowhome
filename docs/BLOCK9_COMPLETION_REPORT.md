# Block 9 Completion Report — Compatibility Graph and Claim Provenance

Date: 2026-08-01

## Scope closed

Block 9 is closed as local/synthetic technical preparation only. It implements the compatibility graph, Claim Ledger, contradiction and expiry checks, audited admin review, and verified decision-page adapters for filters/quiz, comparisons, alternatives, and product pages. It does not start later roadmap work or create a general data platform.

## Evidence boundaries

- All graph and ledger records used by tests are explicitly synthetic fixtures.
- `PUBLIC_COMPATIBILITY_V1` uses canonical Astro string values (`false` by default, `true` only for activation); without an approved provider, the central runtime still returns `graph=null`.
- Public surfaces do not import Block 9 fixtures and have no production graph.
- No manufacturer/retailer source was fetched, no connector was activated, and no physical test was invented.
- Production compatibility, commercial outcomes, deployment, and source freshness remain Unknown / externally blocked.

## Implemented contracts

- Exact product, variant, generation, hardware, firmware, ecosystem, protocol, installation, electrical, housing, market, and warranty identities; no name-based inference.
- Canonical ecosystem/protocol resolution uses closed target IDs plus node types; labels are display-only.
- Structured visitor notices preserve evidence label, effective confidence, and source attribution, including stale confidence degradation.
- Edge provenance: source, market, verified timestamp, confidence, scope, expiry, status, and review history.
- Every edge has a separate required structured scope for product/variant/generation/hardware/firmware identity and installation/electrical/housing applicability; malformed or mismatched scope fails closed.
- Installation, electrical, housing, market availability, and warranty use explicit closed node/relation types and verified visitor notices.
- Claim Ledger: every surfaced edge requires exactly one matching active row at the exact rendered visible location, with exact claim, entity/version, market, source, validation method, evidence, confidence, review date, owner, status, history, and linked edge. One edge may have rows for distinct surfaces.
- Closed evidence levels: Hands-on tested, Research verified, Data evaluated. Hands-on wording requires documented physical testing.
- Unknown remains Unknown; expired, suppressed, and disputed claims do not surface; stale unexpired claims surface only with low effective confidence.
- Contradiction checks compare explicit tuples only.
- Admin actions are fail-closed and append immutable audit evidence; stale/expired approval is blocked.
- Quiz/comparison/alternative/product-page integrations use the central runtime provider and consume explicit verified graph claims only when enabled with a graph.
- Product pages render verified constraints/conflicts conditionally, verify Bluetooth like every other supported protocol, and use `Check listing` instead of falling back to rejected catalog claims.

## Verification

| Gate | Result |
| --- | --- |
| Unit/integration/consistency tests | 404/404 PASS |
| Product-page Block 9 tests | 13/13 PASS |
| Focused Block 9/surface tests | 107/107 PASS |
| Lint | PASS |
| Typecheck | 173 files; 0 errors; 0 warnings; 155 non-failing hints |
| Build | 88 pages PASS |
| Link check | 0 stale; 5 unknown; PASS |
| SEO audit | 88 pages; 0 errors; 0 warnings |
| Production dependency audit | 0 vulnerabilities |
| Browser QA | 19/19 PASS; 0 failures/setup errors |
| Diff check | PASS; LF/CRLF warnings only |

## Relevant files

- `src/lib/blocks/block9/domain.ts` — graph, provenance, evidence, ledger, and audit contracts.
- `src/lib/blocks/block9/freshness.ts` — freshness, expiry, contradictions, and degradation.
- `src/lib/blocks/block9/resolver.ts` — exact-identity verified resolution and constraints.
- `src/lib/blocks/block9/admin.ts` — audited review/override contract.
- `src/lib/blocks/block9/compatibility-adapter.ts` — fail-closed decision-page adapter.
- `src/lib/blocks/block9/comparison-insights-verified.ts` — comparison integration.
- `src/lib/quiz-recommend.ts` — verified quiz integration.
- `src/lib/product-taxonomy.ts` — verified alternatives integration.
- `src/pages/product/[slug].astro` — flag-gated product-page integration; no fixture import.
- `data/blocks/block9/fixtures.json` — synthetic test data only.
- `test/product-verified-page.test.mjs` — product-page fail-closed and source-wiring coverage.
- `docs/BLOCK9_COMPATIBILITY_RUNBOOK.md` — operating and activation boundary.

## Remaining external blockers

Production activation requires current authoritative sources, reviewed URLs and validation methods, assigned reviewers/owners, an approved production graph, and explicit activation/deployment authorization. Until then, the feature remains off and outcomes remain Unknown.

## Post-audit verification (2026-08-01)

The approved cross-block audit revalidated runtime-surface wiring, exact `visibleLocation`, typed destinations, unknown confidence, and provenance. Historical counts remain unchanged; see [`BLOCKS_0_9_AUDIT_REPORT.md`](BLOCKS_0_9_AUDIT_REPORT.md).
