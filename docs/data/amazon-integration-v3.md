# Amazon integration — review-only, not live-validated

As of 2026-09-04 the site had manual catalog data and disabled/mock integration metadata. V3 adds a real configurable OAuth/catalog HTTP client with tests against isolated responses, **not** evidence of authenticated API access. No usable Amazon credentials were found or transmitted during development. A subsequent owner-authorized search covered FlowHome configuration, OpenCode configuration/history/backups and the accessible n8n metadata. An authenticated Associates browser session for `flowhome-20` was found, but both API pages displayed unmet access requirements. This does not disprove access under another account/store; see `../audit/credential-location-audit-v3.md` for the precise scope and owner handoff. No application or credential was created, revealed or rotated.

The client implements SearchItems, GetItems, GetVariations and GetBrowseNodes for the existing US/USD catalog. Search can specify a browse node and an explicit page; variations accept an explicit page. This adapter caps paging at ten pages and never paginates automatically. Browse-node IDs are positive 64-bit decimal strings, batches contain at most ten IDs, and results must be matched by ID, not order. Variants are not assumed interchangeable. The daily collector currently uses only SearchItems/GetItems; the other operations are available for bounded reviewer-controlled enrichment, not automatic traversal.

OAuth endpoint is allowlisted by credential version (3.1/3.2/3.3), request endpoint fixed, redirects rejected, timeouts bounded, token held in memory, refresh on 401, request budget and interval enforced even for concurrent callers. Retry-After applies across operations; long delays defer the batch. GetItems accepts at most ten ASINs; returned IDs are checked independently of order. Error bodies are never logged. Documentation examples currently differ between `itemResults` and `itemsResult`, so both are explicitly handled; live contract validation remains required.

The daily collector persists only ASINs and its own review metadata, not price/title/image/rating/availability responses. Block8 identity, permission, freshness, history and idempotency gates have now been repaired and regression-tested locally; see `../audit/flowhome-block8-gaps-v3.md`. The collector deliberately remains disconnected from that snapshot pipeline pending an approved live provenance/retention design. It does not create historical price datasets or expose public live offers.

## Policy boundary

Standard access is not assumed to grant indefinite content retention or arbitrary aggregation/analysis. Current policies limit cached non-image product advertising content and image URLs to 24 hours, prohibit storing images, and require appropriate freshness/disclosure handling. Some analysis/repurposing requires prior written approval. ASIN retention has a distinct allowance. Before live use, the owner must verify enrollment, marketplace/tag access, application registration, credentials and applicable permissions.

The central UI gate accepts only the exact supported provider marker and current valid timestamps, not manual/feed labels as proof. That marker is a data contract, **not cryptographic authentication**; the upstream provider must enforce provenance. Catalog commercial data remains unverified and withheld; the separate M2 Matter bridge correction has a primary documentary source and explicit firmware/accessory limits. Public static HTML cannot guarantee hourly refresh/24-hour removal without an approved serving/cache design; no live offer feed should be wired into a static deployment until that end-to-end expiry gate is tested.

Official references checked during implementation:

- [Introduction and access requirements](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction)
- [OAuth/cURL contract](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/get-started/using-curl)
- [GetItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items) and [SearchItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/search-items)
- [GetVariations](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-variations) and [GetBrowseNodes](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-browse-nodes)
- [OffersV2 resource](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/resources/offersV2)
- [Program policies](https://affiliate-program.amazon.com/help/operating/policies)
