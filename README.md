# FlowHome

## Dirección vigente — 2026-09-05

Empezar por el [prompt maestro](docs/project/PROMPT_MAESTRO.md), el [juzgado integral por etapa](docs/project/JUZGADO_INTEGRAL.md) y el [backlog con criterios de cierre](docs/project/BACKLOG.json). Separan V3 local, `main` remoto y producción; los planes e informes anteriores conservan su valor histórico. La entrega editorial puede prepararse sin API Amazon; la integración comercial conectada tiene sus propios requisitos.

Production: https://flowhome.dev


Automated smart-home affiliate site for `flowhome.dev`.

## Quick start

Use Node 24.16.0 (the locally verified runtime) with the committed lockfile.
For Windows x64 and Linux x64, the dependency engine intersection is
`^22.22.3 || ^24.16.0 || >=26.3.0`;
this declares package compatibility, not a tested runtime matrix. Other allowed
versions have not been verified by the local release checks. CI selects Node 24.
Windows 32-bit is not covered: its optional Sharp binary has a different Node requirement.

Configuration defaults to a local build with account services and analytics disabled. See the [environment runbook](docs/operations/environment-runbook.md) before enabling services or preparing staging/production. Existing `.env` values no longer select an account automatically; never copy credentials between environments.

```bash
npm ci
npm run build
npm run preview
```

## Core commands

```bash
npm run quality:check
npm run links:check
npm run discover:products
npm run deals:detect
npm run syndicate
npm run maintenance:weekly
```

## Shared CI quality checks

For a read-only documentary compatibility inventory, run
`node scripts/qa/compatibility-coverage.mjs`. It prints model and field coverage,
freshness-sensitive resolution by surface, and structural accounting errors.
Unknown does not mean incompatible; this check neither approves sources nor
activates the public provider. See the [inventory contract](docs/project/FH20M_INVENTARIO_REPRODUCIBLE_2026-09-06.md).
The research queue separately lists raw catalog affirmations lacking current
evidence on any surface and raw negations with qualified candidate signals.
These are review leads, not verified incompatibilities or a publication gate;
model coverage alone never establishes field completeness.

For an internal publication-readiness packet, run
`node scripts/qa/compatibility-release-readiness.mjs`. It identifies the exact
candidate snapshot and lists unresolved identity, ownership, review and surface
gates. It always exits with code 2: it is not a deployment gate or an approval,
even when review records contain names and approved verdicts. It never installs
a provider or changes accounts. Human authorization remains separate.

`node scripts/qa/compatibility-render-review.mjs candidate` builds the real Astro
pages into a new temporary directory, injecting the documentary provider only
into that build's server module. Run `expired` and `disputed` separately for
failure states. It uses a sanitized child environment and never changes the
public runtime source or the normal `dist` destination. Outputs are review-only,
not approved release artifacts. The check covers rendered profile conditions,
the quiz JSON, displayed comparison fields, alternative links and client bundles;
it is not a browser layout or account integration test.

The normal build defines a non-configurable static-compatibility guard: an
enabled, installed graph aborts rendering with
`STATIC_COMPATIBILITY_DELIVERY_BLOCKED`. Rebuilding at an expired date cannot
expire HTML that was already published. `static-guard` proves this rejection;
the other render-review scenarios bypass the guard only through their isolated
in-memory test transform. No PUBLIC_* setting permits publication of that
snapshot. A reviewed request-time delivery path, cache policy and separate owner
approval are still required before graph activation.

The unregistered server contract in `src/lib/blocks/block9/request-delivery.ts`
is tested with `node --test test/compatibility-request-delivery.test.mjs`. It is
disabled by default and requires a trusted server callback to read a currently
authorized graph; request parameters cannot supply approval. Responses and errors
are `no-store`, with no previous-response fallback. A response lease is capped at
60 seconds and the applicable evidence/authorization deadline. This does not
implement authentication, a deployed endpoint or browser retirement of old data.

Pull requests (`Quality Check`, job `quality`) and manual verification use
[the same local composite action](.github/actions/quality/action.yml). It runs the
production dependency audit, diff check, tests, lint, types, editorial structure,
commercial links, build and SEO audit in that order. A failed step stops the gate;
reports are written under the runner temporary directory, not into source data.
Checkout, Node setup and the locked dependency installation remain in each caller.
This does not change branch protection or authorize deployment. Daily browser QA
and protected release preparation retain their separate runners for now.

## Deploy target

Before Lighthouse collects samples, it compares each selected route's HTTP200
response byte-for-byte with its local `dist` HTML and records a SHA256 hash.
Run a compiled preview, not `astro dev`, when selecting `LIGHTHOUSE_BASE_URL`.
A mismatch, redirect, missing build or failed request aborts measurement.
This is an HTML identity check, not a complete asset manifest or proof that
files cannot change during the run. Build/release identity controls still apply.

- Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Domain: `flowhome.dev`

## Notes

Production publication uses the protected **Batched Deploy** workflow with an exact verified SHA, artifact manifest and approved rollback deployment ID. The previous unverified `deploy:cloudflare` shortcut is disabled. See the [release integrity and recovery runbook](docs/operations/release-artifact-runbook.md). The updated workflow has been tested locally, not dispatched remotely by this work.

Affiliate links use Amazon Associates tag `flowhome-20`. Keep platform credentials in GitHub/Cloudflare/n8n secrets only.

## Launch report

See docs/LAUNCH_REPORT.md for production status, verification, and operating cadence.

## Program documents

- [Baseline scorecard](docs/BASELINE_SCORECARD.md)
- [Phases 0–6 roadmap](docs/ROADMAP_PHASES_0_6.md)
- [Analytics event contract](docs/ANALYTICS_EVENT_CONTRACT.md)
- [Commercial link runbook](docs/COMMERCIAL_LINK_RUNBOOK.md)

## V3 review-only daily workflow

`npm run discover:products` now produces an evidence-weighted review report under `reports/discovery/`: zero automatic approvals, explicit missing evidence and no estimated income. The old ROI thresholds/reports and public priority fields are retired. See the [current product review method](docs/INTERNAL_PRODUCT_SELECTION.md).

Run `npm run flowhome:daily -- --dry-run` for local checks and evidence. Add `--weekly` for all seven viewport sizes and Lighthouse median-of-three. No source content or deployment is changed; generated reports live in `reports/daily/` and are not committed. Live Amazon access and the remote scheduler are **not activated**.

- [Setup and authorization boundaries](docs/operations/daily-automation-setup.md)
- [Daily runbook](docs/operations/daily-runbook.md)
- [Amazon data/retention boundary](docs/data/amazon-integration-v3.md)
- [V3 baseline and acceptance register](docs/audit/flowhome-baseline-v3.md)
- [V3 results and remaining activation gates](docs/audit/flowhome-after-v3.md)
- [Editorial claim ledger](docs/content/claim-ledger-v3.md)
- [Current architecture and decisions](docs/audit/flowhome-architecture-v3.md)

`npm run content:generate -- <product-slug>` now creates only a review checklist in `reports/content-drafts/`, outside the published Astro collections. It refuses to overwrite a draft and never fabricates publication dates, commercial values or quality ratings. Human review and separate publication approval are required.
