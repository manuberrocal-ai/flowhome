# Block 9 Compatibility Graph & Claim Provenance Runbook

## Operating boundary

This Block 9 implementation is **local/synthetic technical preparation only**. It models a verified compatibility graph, a Claim Ledger with provenance, contradiction/expiry detection, and an audited admin-review contract in pure TypeScript + tests. It makes **no network request, scrapes no manufacturer/retailer page, connects no unapproved API, and contains no production data**. All graph/ledger data lives in fixtures at [`data/blocks/block9/fixtures.json`](../data/blocks/block9/fixtures.json) and is explicitly marked "NOT production data."

The feature flag `PUBLIC_COMPATIBILITY_V1` remains disabled until externally approved and configured. Activation requires every gate below.

## Source contract (Phase 5 of [`ROADMAP_PHASES_0_6.md`](ROADMAP_PHASES_0_6.md))

External compatibility sources stay absent until a current, official, reviewed claim is available. Today, only manually reviewed claims encoded in the graph/ledger are accepted locally. The Claim Ledger schema requires a `ClaimSource` (label, url, supplier, accessedAt) for every surface-facing claim; a claim with no source row cannot surface.

- **Manufacturer documentation**: an authoritative compatibility list/spec sheet. Activation requires the current official URL, a captured `accessedAt`, and a documented validation method.
- **Hands-on testing**: documented physical testing with a recorded method and date. `isDocumentedHandsOnTest` requires a physical-method keyword (`physical|hands-on|in-home|on-device|bench`), a test/trial/measurement/run keyword, and a 4-digit year. The word "tested" alone is **never enough**.
- **Editorial review**: a reviewed claim signed by the editorial team owner. Activation requires the reviewer id and an approved review-history entry.

Real provider credentials, source URLs, and activation remain **blocked externally**. No source adapter is instantiated in this repository until all activation gates below pass.

## Environment variables and feature flags

| Variable | Default | Role |
| --- | --- | --- |
| `PUBLIC_COMPATIBILITY_V1` | `false` | Astro public-environment boolean string. Set it to `true` only to enable verified surfacing when an approved graph provider also returns a graph; the default provider returns `null`. |

This mirrors Phase 5 in [`ROADMAP_PHASES_0_6.md`](ROADMAP_PHASES_0_6.md) exactly. No fictional flags are introduced. Block 8 reserved this flag; Block 9 owns it.

## Required invariants

### No name-based inference

A compatibility flag is verified only when an exact `(nodeId, ecosystem/relation, market)` graph edge has exactly one matching active Claim Ledger row at the requested exact `visibleLocation`. An entry for another surface cannot authorize the rendered surface. Two products with similar names never inherit each other's compatibility. The resolver `nodeBySlug` matches by exact slug + market, and `bestEdgeFor` matches a closed canonical target ID + node type; labels are display-only. Asserted in `test/block9-resolver.test.mjs` and surface integration tests.

### Explicit edge scope and physical/commercial constraints

Every edge has a required `CompatibilityScope`, separate from `market`, with exact nullable `productId`, `variantId`, `generationId`, `hardwareId`, `firmwareId`, `installation`, `electrical`, and `housing` fields. Runtime validation requires at least one typed entity reference, requires `edge.from` to equal one scoped entity ID, and resolves IDs only by exact node identity. Missing, malformed, label-derived, or mismatched scope fails closed.

The closed graph vocabulary also models `installation`, `electrical`, `housing`, `market`, and `warranty` nodes with `requires-installation`, `requires-electrical`, `requires-housing`, `available-in`, and `warranty-covered-in` relations. Their notices pass through the same scope, ledger, market, status, expiry, and confidence gate as ecosystem claims.

### Unknown stays Unknown / not verified

When no claim exists, the flag returns `{ verified: false, level: null }`. Surfacing "compatible" without a verified claim is forbidden. The adapter `applyVerifiedCompatibility` degrades the catalog boolean to `undefined` (Unknown) when the flag is on and no verified claim backs it. Asserted in `test/block9-adapter.test.mjs`.

### Expired or disputed claims degrade or disappear

An expired claim is removed from the verified set. A disputed claim is removed from the verified set. A stale claim (older than 180d but not expired) stays surfaced with confidence `low`. Asserted in `test/block9-freshness.test.mjs` (`effectiveClaimStatus` returns `surfaced: false` for expired/disputed/suppressed).

### Evidence levels (closed set)

Only three evidence levels surface to visitors:
- `hands-on-tested` — surfaced as "Hands-on tested"; requires `isDocumentedHandsOnTest` validation method.
- `research-verified` — surfaced as "Research verified".
- `data-evaluated` — surfaced as "Data evaluated".

`not-verified` is the absence of evidence and is never stored on an edge; it is the default for any claim with no ledger row. Asserted in `test/block9-domain.test.mjs`.

### Visible content and schema agree

Every public-facing claim has one `ClaimLedgerEntry` per exact rendered `visibleLocation`, recording the exact claim text, entity + version, market, source, validation method, confidence, review date, owner, and status/history. The ledger is the single source of truth: visible content and schema must agree, and a claim with no exact-location row cannot surface. Ledger and edge confidence must match exactly.

## Freshness, expiry, and contradictions

- **Timestamps**: strict UTC ISO-8601 only. `toStrictUtc` rejects date-only and offset forms; unknown timestamp results stay `unknown`.
- **Freshness windows** (`CLAIM_FRESHNESS_WINDOWS_MS`): claim 180d, field 90d. A stale claim stays active but degrades to confidence `low`. An expired claim disappears.
- **Contradiction detection** (`detectEdgeContradictions`, `detectLedgerContradictions`): only explicit same-tuple pairs are compared; name-based inference is never used. A positive (`works-with`) vs `conflicts` pair on the same `(from, to, market)` tuple is flagged. A positive vs negative claim text on the same `(entityId, visibleLocation, market)` tuple is flagged.

## Admin review/override contract and audit trail

An admin reviews ledger entries and edges and applies a narrow set of override actions. The contract is fail-closed and mirrors the Block 8 discipline:

- **`approve`** / **`reinstate`**: can move a claim to `active` only when it is still fresh. Admin cannot force an expired/stale claim through; the action is rejected with `outcome=blocked_stale` and still audited.
- **`suppress`**: moves any claim to `suppressed`; never fabricates.
- **`dispute`**: moves any claim to `disputed`; surfaced content degrades.
- **`expire_now`**: terminates a claim (`expired`).
- **`reset`**: reverts to `unknown` (needs review).

Every action writes an immutable `ClaimAdminAuditEntry` with before/after snapshots of the touched fields. Blocked actions still record an entry. `verifyClaimAuditTrail` asserts the trail is self-contained. Asserted in `test/block9-admin.test.mjs`.

## Integration contract (flag-gated, optional)

The integration is strictly optional and flag-gated. The actual quiz, comparison, alternatives, and product paths consume `getCompatibilityEnvironment` from `src/lib/blocks/block9/runtime.ts`, then bind an exact surface location. The central runtime contract accepts only `PUBLIC_COMPATIBILITY_V1 === 'true'`; its default approved provider returns `graph=null` and never imports fixtures. A separately approved provider can be supplied centrally later without rewiring surface paths. When the flag is disabled (or no graph is provided), the integration is inert and delegates to existing legacy behavior.

- **Quiz** (`selectVerifiedRecommendationResult`): pre-processes products with `applyVerifiedCompatibility`; claims with no verified backing degrade their catalog booleans to `undefined` (Unknown), so the quiz never surfaces an unverified claim as fact.
- **Comparison** (`buildVerifiedComparisonInsights`): pre-processes products and adds verified constraints/conflicts to the tradeoffs and a `verifiedConstraints`/`verifiedConflicts` list.
- **Alternatives** (`selectVerifiedDirectAlternatives`): promotes verified `substitutes` edges ahead of the same-category candidates.
- **Product pages**: apply `applyVerifiedCompatibility` and read `getVerifiedConstraints` when the flag is on and a graph exists. Structured notices visibly include the evidence label, effective confidence, and source label. The verified path is authoritative: an empty verified result renders `Check listing` rather than falling back to catalog booleans. The production page never imports synthetic fixtures; without an approved production graph the integration remains inert.

## Activation gates (all must pass)

1. A current, official, reviewed source feed for compatibility claims exists (manufacturer docs, hands-on test reports, or editorial review records).
2. The source contract — URL, `accessedAt`, validation method, supplier — is documented per claim in the Claim Ledger.
3. `PUBLIC_COMPATIBILITY_V1=true` is configured only after the source contract is in place and an approved graph provider is installed.
4. The admin-review contract is staffed: at least one reviewer id is authorised to approve/suppress/dispute claims.
5. All Block 9 tests pass (`npm test`), lint passes, typecheck passes, build passes.
6. Browser QA confirms visible content and schema agree on a representative sample.

Until all six gates pass, Block 9 stays inert and the catalog booleans remain the existing "not-verified" fallback.


## Local closure evidence (2026-08-01)

Block 9 is closed as **local/synthetic technical preparation only**. This does not activate production compatibility claims or authorize a source connector, deployment, or later roadmap work.

- Tests: 404/404 PASS, including 13 product-page integration cases and 107 focused Block 9/surface cases.
- Lint: PASS.
- Typecheck: 173 files, 0 errors, 0 warnings, 155 non-failing hints.
- Build: 88 pages.
- Link check: 0 stale, 5 unknown, PASS.
- SEO audit: 88 content pages, 0 errors, 0 warnings.
- Production dependency audit: 0 vulnerabilities.
- Browser QA: 19/19 PASS, including product pages at 375px and 1440px; 0 failures/setup errors.
- Diff check: PASS; LF/CRLF warnings only.

The feature remains off and no synthetic fixture is loaded by a production page. Activation still requires every gate above plus a separately reviewed production graph/source contract.
