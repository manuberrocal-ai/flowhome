# FlowHome P2 Completion Report

Date: 2026-07-29

## Scope

This milestone completed only P2: motion, controls, progressive rendering, responsive behavior, intrusive overlays, shortlist dock safety, production checks, and reproducible browser QA. P0 and P1 behavior, public URLs, SEO data, and the navy/teal/orange identity were preserved. Annex sections 1–26 were explicitly deferred.

## Root causes resolved

- Continuous visual noise came from parallax scroll handlers, fixed animated backgrounds, infinite decorative keyframes, and long 260–1150 ms transitions.
- The mobile hero expanded beyond the viewport because six 44 px dots and navigation controls shared one minimum-content row.
- The consent control was a fixed overlay, so it covered page content.
- The shortlist dock reserved space only in main; the footer could still sit behind it.
- The exit-intent component used a full-screen fixed overlay triggered by mouseleave.
- Some critical images lacked explicit eager priority, dimensions, or fallbacks; content-visibility could also produce blank full-page captures.
- The repository had no real lint or Astro typecheck gate; the first strict check exposed 177 hidden errors.

## Implemented

- Removed parallax, fixed decorative layers, infinite CTA/decorative motion, and obsolete motion tokens.
- Limited interaction transitions to 120–240 ms and preserved prefers-reduced-motion.
- Paused hero autoplay on interaction, hidden tabs, reduced motion, and viewport exit.
- Standardized focus, active, disabled, loading, selected, and error states with 44x44 minimum button targets.
- Made essential content visible by default; added critical-image preload/eager priority, dimensions, lazy loading below the fold, and failure fallbacks.
- Made the hero grid shrink safely and wrapped navigation dots on small screens.
- Moved the consent control into document flow.
- Disabled the exit-intent without deleting its file.
- Reserved document-level space for the visible shortlist dock: 104 px desktop and 152 px mobile.
- Added a dependency-free Brave/CDP harness at scripts/qa/browser-smoke.mjs.
- Added real ESLint and Astro typecheck scripts and fixed the strict typing debt without relaxing tsconfig strict.

## Verification evidence

- npm.cmd test: 182/182 passing.
- npm.cmd run lint: passing with zero errors.
- npm.cmd run typecheck: 0 errors, 0 warnings, 155 non-failing hints.
- npm.cmd run build: 86 pages built successfully.
- npm.cmd run qa:browser: 13/13 passing.
- Browser widths: 320, 375, 768, 1024, and 1440 px.
- Browser routes: home, quiz, comparison, product, and shortlist.
- Active-dock browser case: 116.4 px dock, 152 px mobile reservation, no footer overlap.
- Browser checks: runtime/console/log errors, JSON-LD parse failures, controls below 44 px, uncontained horizontal overflow, dock overlap, screenshots, and process cleanup.
- Preview cleanup: verified offline after the harness exits.
- git diff --check: no whitespace errors; only Windows LF/CRLF notices.
- Independent verifier: PASS with no blocking defects.

Latest local browser evidence:

- Report: C:\Users\manub\AppData\Local\Temp\opencode\flowhome-browser-qa-final\report.json
- Screenshots: C:\Users\manub\AppData\Local\Temp\opencode\flowhome-browser-qa-final

The evidence is reproducible with npm.cmd run qa:browser; temporary paths are not required for future runs.

## Significant files

- src/layouts/BaseLayout.astro: document flow, dock integration, motion cleanup, typed runtime setup.
- src/pages/index.astro: responsive hero, preload, fallbacks, finite motion.
- src/lib/hero-carousel.js: atomic state and autoplay pause contracts.
- src/styles/global.css: motion budget, control states, dock reservation.
- src/components/ConsentBanner.astro: non-overlay consent.
- src/components/ExitIntentPopup.astro: intrusive behavior disabled.
- scripts/qa/browser-smoke.mjs: isolated local Brave/CDP QA.
- eslint.config.js, package.json, package-lock.json: lint/typecheck toolchain.
- test/*: updated P0–P2 behavioral and static contracts.

## Residual, non-blocking risks

1. The former six production dependency vulnerabilities were resolved in the dedicated dependency-security block: `npm.cmd audit --omit=dev` reports zero vulnerabilities after updating Astro, RSS, MDX, fast-xml-parser, postcss, sharp, and svgo. See `docs/DEPENDENCY_SECURITY.md` for the affected ranges, resolved versions, CI gate, and rollback procedure.
2. Astro check emits 155 non-failing hints, mainly Astro content-Zod deprecations and explicit is:inline suggestions for generated JSON scripts.
3. The active shortlist dock is browser-tested at 375 px; all requested widths are tested in normal state.
4. No deployment, commit, or push was performed.

## Rollback

No irreversible migration was introduced. Revert by concern: motion/global CSS, consent/language/exit components, hero runtime, browser QA/tooling, or strict typing changes. Re-run test, lint, typecheck, build, and qa:browser after any rollback.

## Post-audit verification (2026-08-01)

The Blocks 0–9 adversarial audit, including isolated-preview Browser QA stability and preserved historical evidence, is documented in [`BLOCKS_0_9_AUDIT_REPORT.md`](BLOCKS_0_9_AUDIT_REPORT.md).
