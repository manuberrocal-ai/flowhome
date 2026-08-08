# Block 7 Lifecycle Runbook

## Operating boundary

This implementation is disabled by default and `EMAIL_PROVIDER=mock` is the only accepted provider. The mock never makes a network request and never retains or logs a recipient. Do not set a real provider in source or environment without all activation gates below.

## Required server-only configuration

Set `SUPABASE_SERVICE_ROLE_KEY`, `LIFECYCLE_WORKER_SECRET`, `LIFECYCLE_TOKEN_SECRET`, and `LIFECYCLE_WEBHOOK_SECRET` only as Supabase Edge Function secrets. Never use `PUBLIC_*`, client code, URLs, logs, or analytics for them. `EMAIL_PROVIDER=mock` remains mandatory until activation is explicitly authorized.

## Permissions and configuration checklist

- `anon`: no table access and no lifecycle RPC execution.
- `authenticated`: only `get_lifecycle_preferences`, `save_lifecycle_preferences`, `unsubscribe_lifecycle_preferences`, `export_lifecycle_data`, and `delete_lifecycle_data`.
- `service_role`: only internal queue, stale-claim recovery, finish, one-click unsubscribe, and webhook RPCs; it never reaches the browser.
- Edge Functions use `verify_jwt = false` only where a server secret (worker), signed fragment token (unsubscribe), or HMAC (webhook) supplies the endpoint-specific authorization.
- Required environment values: `EMAIL_PROVIDER=mock`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LIFECYCLE_WORKER_SECRET`, `LIFECYCLE_TOKEN_SECRET`, and `LIFECYCLE_WEBHOOK_SECRET`. All secrets must be 32+ characters. `LIFECYCLE_PUBLIC_ORIGIN` is optional and, when set, must be the single exact browser origin allowed to invoke one-click unsubscribe; it defaults to `https://flowhome.dev`.
- Supabase Vault, a scheduler, real provider credentials, provider adapter, sending domain, and provider webhooks are **not configured**.

### One-click unsubscribe browser boundary

`lifecycle-unsubscribe` accepts only `POST` and a preflight `OPTIONS` request from the configured exact origin. Its CORS response allows only `content-type`, never credentials, and varies by `Origin`; all other origins receive no allow-origin header. This is a local implementation contract only: the Edge Function has not been deployed or exercised against Supabase.

## Activation gate

1. Obtain explicit product and privacy approval.
2. Obtain a vetted provider credential and an approved sending domain.
3. Publish and independently verify SPF, DKIM, and DMARC for that domain.
4. Review suppression, export/deletion, frequency caps, unsubscribe, incident ownership, and recipient-safe logs.
5. Receive explicit authorization for a staged deployment and test only with approved recipients.

Without every gate, provider activation is blocked. Delivery, open, click, and conversion metrics are **Unknown**, not zero.

### DNS checklist before activation

1. Publish SPF limited to the approved sender infrastructure; verify alignment.
2. Publish provider-generated DKIM selectors and verify valid signatures.
3. Publish DMARC with an approved reporting/rollout policy and verify alignment.
4. Record DNS verification evidence outside this repository; do not place recipient or credential data in it.

## Worker and webhook operation

Invoke `lifecycle-worker` only with a configured 32+-character server-only `x-lifecycle-worker-secret`. Claiming does not authorize delivery: immediately before provider invocation, a database transaction locks the recipient preference, verifies active consent, reserves global/type frequency capacity, then consumes a one-time 60-second dispatch lease. Unsubscribe immediately prevents future authorization by deleting unconsumed leases and suppressing jobs; a concurrent unsubscribe that commits before lease consumption prevents the invocation. The database cannot atomically include an external provider call: an invocation already authorized after final lease consumption can still complete and cannot be recalled. Retry backoff is exponential only for explicitly safe failures; uncertain send results are dead, never replayed. Jobs use a unique idempotency key. Webhooks require a timestamped HMAC checked in constant time and, in mock mode, record no provider metrics.

The prepared follow-up migration associates every webhook event with both its lifecycle job and subscriber through cascading foreign keys. Authenticated export includes preferences, consent history, jobs, and webhook events. Deleting the subscriber root is transactional and cascades all of that lifecycle activity. This migration is prepared only and has not been applied.

### Append-only staging migration revalidation (2026-08-08)

The historical prepared-only statement above describes the earlier local-only evidence. Later, migrations `001`–`008` were applied to a separate Supabase Free staging environment in `us-east-1`, not to the original paused production environment. Staging lint had 0 findings, dry-run was up-to-date, 28/28 target tables had RLS, and it contained 0 rows. `008` applied after a prior seven-migration query and transactionally asserted zero direct write grants. Runtime corrections covered the `003` PL/pgSQL `CASE`, `006` extension-qualified `gen_random_bytes`, `007` seven-column `sync_cart`, and `008` grant revocation.

This staging evidence does not deploy Edge Functions, configure Vault or a scheduler, select a lifecycle provider, configure email DNS, or authorize sending. Delivery, open, click, and conversion remain **Unknown**.

## Rollback and incident response

Rollback by retaining `EMAIL_PROVIDER=mock`, disabling scheduled worker invocation, and immediately suppressing affected subscribers; suppression cancels pending/claimed/retry jobs and invalidates unconsumed dispatch leases. Preserve non-PII operational evidence, rotate the affected server-only secret outside the repository, and do not retry an uncertain provider send. Export and deletion remain available to authenticated users.

## Rotation, retention, and privacy

Rotate one server-only secret at a time, update the deployed function secret, verify the mock path, then retire the old value. A provider incident rolls back to `EMAIL_PROVIDER=mock` first; do not replay uncertain sends. Retention periods, legal basis, data-processing agreement, deletion verification, and privacy approval are **Pending** human decisions. No provider adapter exists to activate until those decisions and the activation gate are complete.
