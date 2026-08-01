# Dependency Security and Quality Gates

Date: 2026-07-29

## Resolved dependency advisories

The production audit baseline reported six findings: one moderate and five high.
The package manifest and lockfile now resolve the following versions:

| Package | Previously affected version/range | Resolved version |
| --- | --- | --- |
| `@astrojs/rss` | `< 4.0.19` | `4.0.19` |
| `astro` | `<= 7.0.9` | `7.1.6` |
| `fast-xml-parser` | `5.9.3` through `5.10.0` | `5.10.1` |
| `postcss` | `<= 8.5.17` | `8.5.25` |
| `sharp` | `< 0.35.0` | `0.35.3` |
| `svgo` | `4.0.0` through `4.0.1` | `4.0.2` |
| `@astrojs/mdx` | compatible companion update | `7.0.5` |

The direct dependency constraints are `astro ^7.1.6`, `@astrojs/rss ^4.0.19`,
and `@astrojs/mdx ^7.0.5`. Astro 7.1.6 and the Astro integrations require
Node.js 22.12 or later; the quality workflow uses Node.js 24. The reconciled
`npm.cmd audit --omit=dev` result is zero vulnerabilities.

## CI quality gates

`.github/workflows/quality-check.yml` is the automatic PR/push quality gate.
`.github/workflows/batched-deploy.yml` is hardened with the same dependency and
quality gates before deployment. The additional
`.github/workflows/quality.yml` is manual-only and runs full verification on
`workflow_dispatch`. These workflows grant only `contents: read`, use
`actions/checkout@v7` and `actions/setup-node@v6`, caches npm using
`package-lock.json`, and run in this order:

1. `npm ci`
2. `npm audit --omit=dev --audit-level=moderate`
3. `npm test`
4. `npm run lint`
5. `npm run typecheck`
6. `npm run build`
7. `npm run diff-check` (manual quality workflow)

The quality-only workflow has no deployment step, browser installation, browser
execution, secrets, publishing, commit, or push behavior. No deployment was
executed for this hardening update.

## Required local browser gate

Browser QA remains a required local gate and is intentionally excluded from
CI. Run it only where Brave is installed and explicitly provide its executable
path:

```powershell
$env:BRAVE_PATH = 'C:\Path\To\Brave.exe'
npm.cmd run qa:browser
```

This keeps browser/process control local and preserves the existing
dependency-free Brave/CDP harness.

## Rollback

To roll back this block, restore the prior `package.json`, `package-lock.json`,
`.github/workflows/quality.yml`, `.github/workflows/quality-check.yml`,
`.github/workflows/batched-deploy.yml`, and `docs/DEPENDENCY_SECURITY.md`
revisions together, then run `npm.cmd ci` (or `npm.cmd install` when
regenerating the lockfile), `npm.cmd audit --omit=dev`, test, lint, typecheck,
build, and the required local browser gate with `BRAVE_PATH`. Do not deploy as
part of either the update or rollback.
