# FlowHome Pinterest launch batch 01

Local-only preparation for nine editable vertical pin designs. Nothing in this batch is published, uploaded, or connected to Pinterest.

## Files

- `pins.json`: draft campaign metadata, three boards, canonicals, copy, alt text, and overlay text.
- `generate-pins.mjs`: deterministic local SVG template, PNG renderer, contact-sheet builder, and validation logic.
- `sources/*.svg`: editable 1000x1500 vector sources.
- `png/*.png`: rendered 1000x1500 PNG exports (2:3).
- `contact-sheet.png`: 3x3 review sheet with labels below each thumbnail.

## Regenerate locally

From the FlowHome repository root:

```bash
node assets/pinterest/launch-01/generate-pins.mjs
```

The generator uses the already-installed local `sharp` package. It makes no network calls and uses no external fonts or images. All text uses Arial/system fallback, and the palette derives from FlowHome CSS/assets: navy, cyan, orange, white, and slate. The design system keeps important content inside a central safe zone, uses high-contrast editorial cards, and varies abstract vector motifs by robot vacuum, lighting, and hub cluster.

Copy is grounded in the nine listed FlowHome canonical sources. Titles are checked against Pinterest's 100-character limit; the generator also checks counts, duplicate IDs/canonicals, HTTPS FlowHome URLs, required approval flags, CTAs, generated files, and PNG dimensions. Metadata intentionally contains no credentials. `published` remains `false` and approval is required before any publishing action.

## Pre-publish blockers

`pins.json` records the two source blockers as resolved after the affected destination pages were corrected, deployed, and production-verified in commit `e798068` on `2026-07-18`. The official manufacturer evidence URLs and affected source files remain recorded in `pins.json` for audit. Human approval is still required before publishing; nothing has been published or uploaded.

The revised batch uses kind-aware footers (`EDITORIAL GUIDE` / `EDITORIAL REVIEW`), search-clear guide headlines, and cautious Q5+/j7+ copy. Generated SVG text is checked for the forbidden stale Q5+ mopping and j7+ LiDAR combinations. The contact sheet is generated with 3x3 labeled thumbnails; the headline wrapper keeps guide headlines within the central card without clipping.
