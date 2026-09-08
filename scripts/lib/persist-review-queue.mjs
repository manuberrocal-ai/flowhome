const confirmed = (result, job) => ['inserted', 'duplicate'].includes(result?.status)
  && result.id === job.id && result.idempotencyKey === job.idempotencyKey
  && ['pending', 'claimed', 'retry', 'dead', 'completed'].includes(result.state);

/** One read then at most one idempotent write; never persist provider payloads. */
export async function persistReviewQueue(entries, store, { dryRun, qualityPassed, now }) {
  if (!store || dryRun) return { status: dryRun ? 'dry_run' : 'disabled', entries: [] };
  if (!qualityPassed) return { status: 'skipped_quality', targetId: store.targetId, entries: [] };
  const results = [];
  for (const entry of entries) {
    const job = entry.preparedJob;
    const input = { asin: job.payload.asin, productSlug: job.payload.productSlug, revision: job.payload.revision, now };
    let result;
    try {
      result = await store.lookup(input);
      if (result?.status === 'missing') result = await store.enqueue(input);
    } catch { result = { status: 'unconfirmed' }; }
    if (!confirmed(result, job)) {
      results.push({ id: job.id, status: ['conflict', 'invalid_payload', 'retry_required'].includes(result?.status) ? result.status : 'unconfirmed' });
      return { status: 'needs_attention', targetId: store.targetId, entries: results, notAttempted: entries.length - results.length };
    }
    results.push({ id: job.id, status: result.status, state: result.state });
  }
  return { status: 'confirmed', targetId: store.targetId, entries: results, notAttempted: 0 };
}
