import { validateReviewPayload } from './review-queue.mjs';

const KEYS = ['jobId', 'revision', 'evidenceDigest', 'expectedVersion', 'decision', 'reason'];
const REASONS = Object.freeze({
  approve: ['evidence-reviewed'],
  reject: ['identity-mismatch', 'insufficient-evidence', 'editorial-correction-required'],
});

/** Untrusted decision intent only. This does not authenticate, persist, or approve. */
export function prepareReviewDecision(input, job, evidence) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || Object.keys(input).length !== KEYS.length || Object.keys(input).some(key => !KEYS.includes(key))) throw Error('invalid_decision_intent');
  const intent = Object.fromEntries(KEYS.map(key => [key, input[key]]));
  const payload = validateReviewPayload(job?.payload);
  if (typeof job.id !== 'string' || !job.id || intent.jobId !== job.id
    || job.source !== 'catalog-review' || intent.revision !== payload.revision) throw Error('stale_decision_revision');
  if (typeof intent.evidenceDigest !== 'string' || !/^[a-f0-9]{64}$/.test(intent.evidenceDigest)
    || evidence?.jobId !== job.id || evidence?.revision !== payload.revision
    || evidence?.digest !== intent.evidenceDigest) throw Error('stale_decision_evidence');
  if (!Number.isSafeInteger(intent.expectedVersion) || intent.expectedVersion < 0
    || !Object.hasOwn(REASONS, intent.decision) || !REASONS[intent.decision].includes(intent.reason)) throw Error('invalid_decision_intent');
  // State completed is execution evidence, never a grant of editorial authority.
  return Object.freeze({ ...intent, status: 'pending-authenticated-persistence', publicationAuthorized: false });
}
