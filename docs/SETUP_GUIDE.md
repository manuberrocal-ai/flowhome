# FlowHome Setup Guide

## Local setup
```bash
npm ci
npm run build
npm run preview
```

## Optional public analytics variables

No analytics variable is required for a local build. Configure only approved public identifiers in the deployment environment; never add credentials to `.env` or the repository.

```env
PUBLIC_APP_ENV=local
PUBLIC_AUTH_ENABLED=false
PUBLIC_ANALYTICS_ENABLED=false
```

## Cloudflare Pages
Build command:
```bash
npm run build
```
Output directory:
```bash
dist
```

Custom domain:
```text
flowhome.dev
```

## Automation commands
```bash
npm run discover:products
npm run quality:check
npm run deals:detect
npm run links:check
npm run syndicate
npm run maintenance:weekly
```

## Commercial analytics activation

The repository runs in Basic Consent Mode: no optional provider script or measurement event is loaded before an explicit `accepted` choice. The build must also select `PUBLIC_APP_ENV=production`, `PUBLIC_ANALYTICS_ENABLED=true`, and a valid, reviewed `PUBLIC_GTM_ID`. Local and staging builds reject enabled analytics. These are build-time settings, not runtime switches: changing a Pages variable cannot enable or disable an already-built artifact. See the [environment runbook](operations/environment-runbook.md). `PUBLIC_CLARITY_ID` is optional, and `PUBLIC_GA4_ID` is not consumed by the runtime.

Before enabling GTM/GA4, review [the event contract](ANALYTICS_EVENT_CONTRACT.md), inspect every tag inside the selected container (including tags that load other providers), and map the allowlisted events in GTM/GA4. An empty `PUBLIC_CLARITY_ID` does not disable a Clarity tag loaded by GTM. Do not add credentials to this repository. Verify one consented `affiliate_click` in GA4 DebugView, then reject/revoke and verify that measurement stops. A successful local dataLayer enqueue does not prove provider receipt. To disable analytics site-wide, restore the verified disabled release, or rebuild and publish with `PUBLIC_ANALYTICS_ENABLED=false`; merely removing the GTM ID while leaving analytics enabled fails configuration validation. Revenue and conversions require their own actual evidence.

Run `npm run links:check` locally before releases. Its monitor uses repository metadata only; it never probes Amazon or any remote provider. See [the commercial link runbook](COMMERCIAL_LINK_RUNBOOK.md) for stale and broken handling.
