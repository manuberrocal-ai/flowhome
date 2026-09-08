import { enqueueJob } from '../../src/lib/blocks/block10/operations.ts';

const PAYLOAD_KEYS = ['schemaVersion', 'intent', 'asin', 'market', 'productSlug', 'revision'];

/** Durable review metadata only. Never accept a provider response as payload. */
export function validateReviewPayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).length !== PAYLOAD_KEYS.length
    || Object.keys(value).some((key) => !PAYLOAD_KEYS.includes(key))) throw new Error('invalid_review_payload');
  if (value.schemaVersion !== 1 || value.intent !== 'catalog-review' || value.market !== 'US'
    || typeof value.asin !== 'string' || !/^[A-Z0-9]{10}$/.test(value.asin)
    || typeof value.revision !== 'string' || !/^[a-f0-9]{64}$/.test(value.revision)
    || (value.productSlug !== null && (typeof value.productSlug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.productSlug) || value.productSlug.length > 160))) {
    throw new Error('invalid_review_payload');
  }
  return Object.freeze(Object.fromEntries(PAYLOAD_KEYS.map((key) => [key, value[key]])));
}

export function prepareReviewJob({ asin, productSlug = null, revision, now }, existing = []) {
  const payload = validateReviewPayload({ schemaVersion: 1, intent: 'catalog-review', asin, market: 'US', productSlug, revision });
  // Reuse the established conflict check; same revision must never overwrite
  // a claimed/completed review or silently change its exact identity.
  return enqueueJob(existing, {
    source: 'catalog-review', partition: `US:${asin}`, payload,
    idempotencyParts: [asin, revision], correlationId: `review:${revision}`, now,
  });
}
