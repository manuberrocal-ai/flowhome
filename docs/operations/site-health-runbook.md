# Read-only site health sentinel

The sentinel can run locally or through the independent **FlowHome public site
health** workflow. Repository variables control remote scheduling; the workflow
file alone does not prove activation or a successful observation. Use the
installed Node runtime from the project directory:

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

## Remote operation

The owner's 2026-09-12 authorization covers activation within the existing
FlowHome project. The operational destination is the workflow's run history and
artifacts in `manuberrocal-ai/flowhome`; the project owner is the escalation
contact. No new email recipient, chat channel, public issue, third-party service
or response-time promise is created. GitHub's optional email/web notifications
depend on the owner's settings and are not verified delivery evidence.

- `FLOWHOME_HEALTH_SCHEDULE_ENABLED=true` opts into one daily observation at
  13:17 UTC (10:17 Buenos Aires). Other values disable scheduled observations.
- `FLOWHOME_HEALTH_KILL_SWITCH=true` stops both manual and scheduled observation
  jobs. Disabling the workflow also prevents future runs. Neither setting cancels
  an already running observation; it can finish its three read-only requests.
- Manual dispatch is restricted to main and the canonical repository; it can
  test operation before scheduling is enabled. There is no arbitrary target input.
- The workflow needs only contents:read, Node and three already pinned Actions.
  It installs no project dependencies, calls no provider API and never builds,
  publishes, rolls back, modifies content or touches the durable review queue.
- An unhealthy observation fails the job. The sanitized JSON is uploaded on
  success and failure, retained for 14 days and associated with run ID/attempt.
  A setup error or timeout may prevent a report; missing evidence is not healthy.
- This is separate from the daily editorial review workflow and the Codex goal.
  It does not enable `FLOWHOME_DAILY_SCHEDULE_ENABLED` or an agent heartbeat.

The initial objective is one recorded observation per scheduled day, not an
uptime percentage or detection/response SLA. Measure actual scheduled coverage
and acknowledgeability before defining a service-level commitment. GitHub
[documents schedule delays and inactivity restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
(consulted 2026-09-12); scheduled configuration is not proof of execution.
The five-second request bound is only an execution limit. Public successful
observations do not verify deployed SHA, release integrity, conversions, browser
interaction, notification receipt or the ability to restore Pages.

The local incident helper in the FH21B report exercises HTTP 503, timeout and
recovery on a private loopback server. It does not perform a production rollback.
