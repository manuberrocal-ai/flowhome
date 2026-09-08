# Read-only site health sentinel

Prepared locally; no recurring schedule or alert destination is activated.
Use the installed Node runtime from the project directory:

```text
node scripts/qa/site-health.mjs https://flowhome.dev
```

For an explicitly started local preview, pass its numeric loopback HTTP origin
instead. Other hosts, credentials, query strings and paths are rejected. The
tool makes three GET requests: home, Amazon Smart Thermostat and cart. It never
follows redirects or retailer links, signs in, modifies a shortlist, loads page
resources, sends analytics events or calls an Amazon API.

Each request is limited to five seconds and a 512,000-byte HTML body. Status,
page identity, canonical/indexing policy and literal product retailer CTAs are
checked using the existing SEO and commercial-link rules. Manufacturer PDF
references are not retailer CTAs. This is a sentinel for known FlowHome HTML,
not a general DOM parser, visibility check, test of JavaScript, proof of the
entire catalog or purchase availability. Keep browser QA for interaction.

The JSON printed to stdout contains fixed issue codes and timings, not response
bodies or transport error messages. Exit 0 means the three checks passed at that
observation; exit 1 requires attention. A caller may preserve the JSON in its
approved evidence store. No secret or recipient configuration is required.

## Incident procedure

1. Preserve the report and observation time. A failed sentinel is evidence to
   investigate, not permission to deploy, change DNS, send alerts or roll back.
2. For HTTP status or timeout failures, inspect the exact deployment and relevant
   service status through authorized read-only access. A redirect is intentionally
   not followed; inspect its destination before changing this boundary.
3. For content/CTA failures, compare the observed release with the reviewed source.
   Do not alter content merely to make the sentinel pass. Check for a false positive
   using local HTML and the browser contract.
4. Recovery requires the release runbook and specific approval. Recheck after the
   authorized change; retain both failure and recovery observations.

Current owner and alert destination are not assigned/approved. The five-second
request bound is an execution limit, not an incident response commitment or an
uptime SLO. A public successful observation does not verify the deployed source
SHA, release integrity, permissions, conversions or the ability to restore Pages.

The local incident helper in the FH21B report exercises HTTP 503, timeout and
recovery on a private loopback server. It does not perform a production rollback.
