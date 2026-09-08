# Commercial freshness and retention policy

Local policy reconciled on 2026-09-05 (FH-05). This is not live API, storage, monitoring or production validation.

Update 2026-09-06 (FH16B): Astro fixes a static-delivery invariant in all server/client bundles. The shared projection omits commercial fields even when fresh at compilation; static HTML, schema and catalog payloads cannot enforce future expiry. Unbundled policy evaluation remains available for tests, not as serving authorization. See [local implementation and verification](../project/FH16B_PROYECCION_ESTATICA_2026-09-06.md) and [proposed connected boundary](../project/FH16A_DISENO_CADUCIDAD_2026-09-06.md). No live offer service was enabled.

## One ceiling, independent observations

`src/lib/commercial-policy.ts` defines the immutable policy consumed by Block8, the public commerce projection and Block12. Price, availability and public ratings must each have a valid capture with age **strictly less than 24h** (86,400,000 ms). At exactly 24h they are unusable; there is no grace period. Missing, invalid or future captures do not become fresh. Product identity, source and reviewed rights remain separate requirements.

An earlier explicit expiry, shorter source TTL or permission expiry narrows eligibility. A revoked permission cannot promote an offer. Neither editorial updates, approvals, a daily job, a historical observation nor a successful rollback renews a capture. A deal's calendar window can be longer than 24h; it does not extend the commercial observations inside it.

The public projection publishes each field's own expiry for existing client-side removal. It clamps an excessive expiry to its capture ceiling; Block8 rejects excessive supplied expiry as invalid. Both refuse data at or beyond the ceiling. Browser removal alone does not expire static HTML or a CDN cache. Until serving and permission-aware persistence are proven in FH-16/FH-18, the editorial release withholds unverified commercial data.

## Retention is not a reporting window

Default historical retention permission is **0**. Block8 historical use needs a separate reviewed permission ID, permitted purpose, explicit retention duration, source/merchant/market/currency and valid grant dates. A revoked or expired grant cannot support history. The Amazon path additionally rejects history periods longer than its 24h ceiling, even if a local fixture declares otherwise. Synthetic licensed-feed examples with 90-day history are not real permissions and cannot justify storing Amazon responses.

Trend age (<14d) and D30/D60/D90 reporting windows are separate concepts; neither grants advertising-content storage rights. Audit records must minimize retained content and follow the source's actual permissions, including anomalous/rejected data. Preservation for debugging is not a retention exemption. Durable expiry, purge, cache invalidation and failure handling remain FH-16/FH-18 work.

## Source and operation boundary

The [Amazon Associates policies, Creators API license](https://affiliate-program.amazon.com/help/operating/policies) were checked on 2026-09-05. They distinguish short-lived advertising-content caching from image storage, ASIN retention and uses requiring separate permission. Account-specific rights must be reviewed before connection; a provider marker or successful request is not sufficient. See the [Amazon integration boundary](amazon-integration-v3.md) for existing restrictions and access evidence.

When handling stale data, hide the commercial fields and retain the ordinary retailer CTA. A simulated restore must recheck capture, identity and permission at the current instant; never restore expired commercial values. The daily review cadence is an inspection schedule, not an expiry guarantee. No monitor, source or purge service was activated by FH-05.

Verification: `node --test test/commercial-policy.test.mjs test/commerce-data.test.mjs test/block8-*.test.mjs test/block12-*.test.mjs test/deal-client-expiry.test.mjs`. These tests use synthetic observations and permissions, not live account data.
