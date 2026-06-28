# Internal Product Selection System

This document is for FlowHome operators only. Do **not** expose ROI, commission estimates, internal scores, or selection tiers in public-facing pages.

## Purpose

The internal product-selection system helps decide which products are worth researching, testing, drafting, and promoting. Public pages should talk about buyer value: usefulness, compatibility, setup quality, price context, owner feedback, and deal timing.

## Phases

- `seed`: minimum estimated commission `$1`. Used while the site needs early traction and product breadth.
- `growth`: minimum estimated commission `$5`. Used after traffic and conversion data are available.

Set phase with:

```bash
FLOWHOME_ROI_PHASE=seed npm run discover:products
FLOWHOME_ROI_PHASE=growth npm run discover:products
```

## Outputs

```text
data/internal-product-radar.json
```

Contains internal-only fields:

- `estimatedCommission`
- `internalScore`
- `internalTier`
- `reasons`
- `publicFacing: false`

## Public copy rule

Never publish phrases like:

- ROI pick
- commission score
- priority score
- clears the ROI gate
- affiliate ROI
- minimum commission

Use public language instead:

- best starting points
- smart home picks worth your shortlist
- strong owner feedback
- good deal timing
- practical setup value
- ecosystem compatibility
