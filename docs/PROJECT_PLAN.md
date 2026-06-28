# FlowHome Project Plan

FlowHome is an automated smart-home affiliate website for the US/Canada market.

## Stack
- Astro 7 static site
- Tailwind CSS v4 through `@tailwindcss/vite`
- Content collections for products, reviews, deals, categories, and best-of lists
- GitHub Actions for automation and batched builds
- Cloudflare Pages target: `flowhome.dev`

## Operating model
1. Products enter `src/content/products` with Amazon ASIN, price snapshot, compatibility fields, and internal product-selection metadata. ROI scoring is internal only and must not be presented as public-facing copy.
2. Reviews and best-of pages are generated conservatively and checked by `npm run quality:check`.
3. Deals are tracked in `src/content/deals` and summarized by `npm run deals:detect`.
4. Syndication remains dry-run until platform API secrets are added.
5. Cloudflare deployment is prepared but secrets must be configured outside the repository.

## Content frequency
Start with 2-3 useful reviews per week. Do not publish thin scaled content.
