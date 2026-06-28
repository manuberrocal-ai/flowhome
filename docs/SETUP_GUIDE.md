# FlowHome Setup Guide

## Local setup
```bash
npm install
npm run build
npm run preview
```

## Required environment variables
Create `.env` locally if analytics IDs are available:

```env
PUBLIC_GA4_ID=G-XXXXXXXXXX
PUBLIC_GTM_ID=GTM-XXXXXXX
PUBLIC_CLARITY_ID=xxxxxxxxxx
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
