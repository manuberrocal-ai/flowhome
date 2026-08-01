# FlowHome Analytics Event Contract

## Consent and provider boundary

FlowHome uses **Basic Consent Mode**. Until a visitor explicitly chooses `accepted`, it loads no optional GTM/Clarity script, creates no analytics session or attribution identifier, and dispatches no measurement event. `rejected` and `unset` are equally non-measuring states. Revocation removes session attribution/ID and optional script state, then reloads once when an optional runtime had loaded. Cookieless pings are not implemented.

The runtime only loads an adapter when `PUBLIC_GTM_ID` is non-empty and consent is accepted. The adapter is a synchronous, best-effort `dataLayer.push`; provider failure returns false and never delays a click or navigation. A local `dataLayer` array is the supported memory/mock boundary for tests. GTM/GA4 mapping, provider configuration, dashboards, revenue, conversion, and current provider data are **Unknown/external**.

## Taxonomy

| Event | Allowlisted event-specific fields |
| --- | --- |
| `affiliate_click` | `page_type`, `cta_position`, `product_slug`, `category`, `discount` |
| `list_add` | `page_type`, `cta_position`, `product_slug`, `category` |
| `quiz_start` | `page_type` |
| `quiz_complete` | `page_type`, `goal`, `ecosystem`, `budget`, `installation`, `extra`, `result_count` |
| `calculator_used` | `page_type`, `device_type`, `estimated_savings` |
| `compare_open` | `page_type`, `cta_position` |
| `feed_follow` | `page_type`, `cta_position` |
| `experiment_exposure` | `page_type`, `experiment_id`, `variant_id`, `assignment_version`, `mutual_exclusion_group`, `assignment_bucket` |

Every accepted dispatched event also contains a generated `event_id`, `consent_state=accepted`, privacy-safe session ID, a pathname without query/fragment, device class, market, and first-touch UTM fields when present. Pathnames are decoded for inspection and become `/redacted` when they contain unsafe encoding, URL-like content, PII, secrets, phone/email patterns, or unsafe characters. `campaign` and `experiment` are optional, bounded identifiers. Unknown event names, unknown fields, URL-like values (including arbitrary URI schemes such as `data:`/`javascript:`, protocol-relative, `www.`, mailto, and tel forms), unsafe strings, obvious PII/secrets, query fragments, and unbounded values are rejected rather than emitted. The boundary is intentionally conservative: any dotted value ending in an alphabetic label of two or more characters is treated as a bare domain and rejected; numeric technical version endings such as `zigbee.3.0` remain valid.

## Deduplication and attribution

`setupAnalytics()` and delegated CTA binding are idempotent. An explicit `event_id` or `dedupe_key` is accepted once per event name; distinct clicks without either remain distinct. Dispatch is synchronous and never calls `preventDefault`, awaits a provider, or changes an Amazon URL.

`experiment_exposure` is the only experiment event. Its assignment bucket is an integer from 0 through 9999; the listed fields plus the existing `event_id` and optional `dedupe_key` are the complete event payload. Exposure is consent-gated, session-scoped, emitted after variant application, and rolled back when a first provider push fails. The experiment uses the allowlisted identifier form `exposure-<experiment>-<version>-<variant>` for `dedupe_key`; colon-delimited URI-like values are rejected by the privacy boundary. No assignment or storage occurs before consent.

After accepted consent only, FlowHome reads and normalizes first-touch `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` from the inbound URL. Values are lowercase, limited to 80 safe characters, stored in `sessionStorage`, and preserved for that session unless storage is explicitly cleared. Session storage is untrusted input on every read: malformed JSON, non-string values, or any key outside this exact UTM allowlist is cleared and never merged into an event. Click IDs, referrers, raw query strings, and arbitrary URL values are never stored or forwarded. Amazon URLs never receive UTMs.

## Manual activation, verification, and rollback

1. Obtain privacy approval and GTM/GA4 access outside this repository.
2. Set `PUBLIC_GTM_ID` in the deployment environment; never commit credentials.
3. Map only this taxonomy in GTM/GA4 and verify one accepted event in DebugView.
4. Verify rejected/unset emit zero events and revocation clears optional runtime state.
5. Roll back by removing `PUBLIC_GTM_ID`; consent revocation independently stops the runtime.

## Lifecycle boundary (Block 7)

Lifecycle email consent is a separate, explicit preference and is never an analytics event or analytics-consent signal. Lifecycle addresses, unsubscribe tokens, and preference payloads are excluded from analytics, logs, and URLs; one-click tokens live only in a URL fragment and the browser removes it before the request. Delivery, open, click, and conversion values are **Unknown** until an approved provider supplies lawful source evidence.
