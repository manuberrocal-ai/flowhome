import { prepareReviewJob, validateReviewPayload } from './review-queue.mjs';

/** Inject an explicitly authorized server client. No account discovery or retry. */
export function createReviewQueueStore(client) {
  if (!client || typeof client.rpc !== 'function') throw new Error('review_store_client_required');
  async function request(input, lookup) {
      const { job } = prepareReviewJob(input);
      const payload = validateReviewPayload(job.payload);
      let response;
      try { response = await client.rpc(lookup ? 'block10_lookup_catalog_review' : 'block10_enqueue_catalog_review', { p_payload: payload, ...(lookup ? { p_idempotency_key: job.idempotencyKey } : {}) }); }
      catch { return { status: 'unconfirmed', reason: 'transport_failure' }; }
      if (response?.error) return { status: 'unconfirmed', reason: 'store_failure' };
      const data = response?.data;
      if (lookup && data?.status === 'missing') return { status: 'missing' };
      if (['conflict', 'invalid_payload', 'retry_required'].includes(data?.status)) return { status: data.status };
      if (!['inserted', 'duplicate'].includes(data?.status) || data.id !== job.id || data.idempotencyKey !== job.idempotencyKey
        || !['pending', 'claimed', 'retry', 'dead', 'completed'].includes(data.state)) return { status: 'unconfirmed', reason: 'invalid_store_response' };
      return { status: data.status, id: data.id, idempotencyKey: data.idempotencyKey, state: data.state };
  }
  return Object.freeze({
    enqueue: (input) => request(input, false),
    lookup: (input) => request(input, true),
  });
}
