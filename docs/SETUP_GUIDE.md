# FlowHome Setup Guide

## Local setup
```bash
npm install
npm run build
npm run preview
```

## Optional public analytics variables

No analytics variable is required for a local build. Configure only approved public identifiers in the deployment environment; never add credentials to `.env` or the repository.

```env
PUBLIC_GTM_ID=GTM-XXXXXXX       # Used optional GTM container ID
PUBLIC_CLARITY_ID=xxxxxxxxxx    # Used optional Clarity project ID
PUBLIC_GA4_ID=G-XXXXXXXXXX      # Legacy/unused by the current runtime
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

The repository runs in Basic Consent Mode: no optional provider script or measurement event is loaded before an explicit `accepted` choice. The exact GTM measurement gate is accepted consent plus a non-empty `PUBLIC_GTM_ID`; there is no separate analytics feature flag. `PUBLIC_CLARITY_ID` remains optional, and `PUBLIC_GA4_ID` is not consumed by the current runtime.

Before a human enables GTM/GA4, review [the event contract](ANALYTICS_EVENT_CONTRACT.md), configure the public GTM container ID in the deployment environment, and manually map the allowlisted events in GTM/GA4. Do not add credentials to this repository. In GA4 DebugView, verify one consented `affiliate_click` with only the documented fields, then revoke consent and confirm that the optional runtime reloads without identifiers. Provider dashboards, revenue, conversions, and current provider data are **Unknown/external** until account access and manual verification exist.

Run `npm run links:check` locally before releases. Its monitor uses repository metadata only; it never probes Amazon or any remote provider. See [the commercial link runbook](COMMERCIAL_LINK_RUNBOOK.md) for stale and broken handling.
