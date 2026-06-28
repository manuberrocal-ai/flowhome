# FlowHome Launch Report

## Production URLs

- Production domain: https://flowhome.dev
- Cloudflare Pages fallback: https://flowhome-a1b.pages.dev
- GitHub repository: https://github.com/manuberrocal-ai/flowhome
- Latest launch release: https://github.com/manuberrocal-ai/flowhome/releases/tag/v1.0.0

## Launch status

- Cloudflare Pages project: `flowhome`
- Custom domain: `flowhome.dev`
- SSL: enabled
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

## Verification

Verified on 2026-06-28:

- `https://flowhome.dev` responds with the FlowHome homepage.
- `https://flowhome.dev/sitemap-index.xml` responds with sitemap XML.
- Public HTML does not expose ROI, internal score, priority score, or commission language.
- GitHub Actions latest checks are green:
  - Quality Check
  - FlowHome Automation
  - Batched Deploy

## Public copy policy

ROI is an internal product-selection mechanism only. Public pages must focus on buyer value:

- usefulness
- compatibility
- pricing context
- owner feedback
- deal timing
- practical setup value

Do not expose:

- ROI
- commission estimates
- internal score
- priority score
- ROI gates
- minimum commission thresholds

## Internal product-selection files

- `scripts/lib/internal-roi.mjs`
- `scripts/discovery/product-discovery.mjs`
- `data/internal-product-radar.json`
- `docs/INTERNAL_PRODUCT_SELECTION.md`

## Recommended next operating cadence

- 2-3 product reviews per week during seed phase.
- Run product discovery weekly.
- Keep syndication dry-run until platform API credentials are configured.
- Use paid ads only to FlowHome bridge pages, never directly to Amazon.
