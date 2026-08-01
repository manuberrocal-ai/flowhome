export const JOB_STATES = Object.freeze(['pending', 'claimed', 'retry', 'dead', 'suppressed', 'mock']);
export const MAX_ATTEMPTS = 5;
export const DELIVERY_POLICY = Object.freeze({
  onboarding: { limit: 1, windowMs: Infinity },
  digest: { weekly: { limit: 1, windowMs: 7 * 86_400_000 }, monthly: { limit: 1, windowMs: 28 * 86_400_000 } },
  'price-drop': { limit: 3, windowMs: 24 * 3_600_000 }, restock: { limit: 2, windowMs: 24 * 3_600_000 },
  'comparison-follow-up': { limit: 1, windowMs: 7 * 86_400_000 }, recommendation: { limit: 2, windowMs: 7 * 86_400_000 }, reactivation: { limit: 1, windowMs: 30 * 86_400_000 },
  global: { limit: 4, windowMs: 24 * 3_600_000 },
});

export const LIFECYCLE_UNSUBSCRIBE_ALLOWED_ORIGIN = 'https://flowhome.dev';

export function lifecycleUnsubscribeCorsHeaders(origin, allowedOrigin = LIFECYCLE_UNSUBSCRIBE_ALLOWED_ORIGIN) {
  if (origin !== allowedOrigin) return null;
  return Object.freeze({
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'Origin',
  });
}

export function retryDelaySeconds(attempt) { return Math.min(86_400, 60 * (2 ** Math.min(Math.max(Number(attempt) || 0, 0), 10))); }
export function nextRetryAt(attempt, now = Date.now()) { return new Date(now + retryDelaySeconds(attempt) * 1000).toISOString(); }
const inWindow = (items, windowMs, now) => items.filter((item) => Number.isFinite(new Date(item.completedAt).getTime()) && now - new Date(item.completedAt).getTime() < windowMs);

export function evaluateDeliveryPolicy({ type, preferences, recentCompletions = [], now = Date.now() }) {
  if (!preferences?.consented || preferences?.status !== 'active' || preferences?.suppressed || !preferences?.types?.includes(type)) return { allowed: false, reason: 'suppressed_or_unconsented' };
  if (type === 'digest' && preferences.frequency === 'important-only') return { allowed: false, reason: 'frequency' };
  const policy = type === 'digest' ? DELIVERY_POLICY.digest[preferences.frequency] : DELIVERY_POLICY[type];
  if (!policy) return { allowed: false, reason: 'unknown_type' };
  if (inWindow(recentCompletions, DELIVERY_POLICY.global.windowMs, now).length >= DELIVERY_POLICY.global.limit) return { allowed: false, reason: 'global_cap' };
  if (inWindow(recentCompletions.filter((item) => item.type === type), policy.windowMs, now).length >= policy.limit) return { allowed: false, reason: 'type_cap' };
  return { allowed: true, reason: 'allowed' };
}

export async function processClaimedJob({ job, provider, now = Date.now() }) {
  if ((job.attempts || 0) > MAX_ATTEMPTS) return { state: 'dead', nextAttemptAt: null };
  try {
    const result = await provider.send({ recipient: job.recipient_email, idempotencyKey: job.idempotency_key, type: job.type });
    return result?.state === 'mock' && result.confirmed === true ? { state: 'mock', nextAttemptAt: null } : { state: 'dead', nextAttemptAt: null };
  } catch (error) {
    if (error?.safeToRetry === true && (job.attempts || 0) < MAX_ATTEMPTS) return { state: 'retry', nextAttemptAt: nextRetryAt(job.attempts, now) };
    return { state: 'dead', nextAttemptAt: null };
  }
}

export async function dispatchClaimedJob({ job, db, provider, now = Date.now() }) {
  const authorization = await db.rpc('authorize_lifecycle_dispatch', { p_job_id: job.id });
  if (authorization.error) throw authorization.error;
  const leaseToken = typeof authorization.data === 'string' ? authorization.data : null;
  if (!leaseToken) return { state: 'suppressed', nextAttemptAt: null };
  const consumed = await db.rpc('consume_lifecycle_dispatch_lease', { p_job_id: job.id, p_lease_token: leaseToken });
  if (consumed.error) throw consumed.error;
  if (consumed.data !== true) return { state: 'suppressed', nextAttemptAt: null };
  return processClaimedJob({ job, provider, now });
}

const copy = (value) => JSON.parse(JSON.stringify(value));

// Deterministic local contract for lifecycle behavior. It is intentionally not
// a Supabase integration test or a substitute for applying the migration.
export function createLifecycleDataContract({ preferences = {}, consentHistory = [], jobs = [], webhookEvents = [], now = Date.now() } = {}) {
  const preferenceByUser = new Map(Object.entries(copy(preferences)));
  const jobsById = new Map(copy(jobs).map((job) => [job.id, job]));
  let history = copy(consentHistory);
  let events = copy(webhookEvents);
  const leases = new Map();
  let leaseSequence = 0;

  const completedOrReserved = (userId) => [
    ...[...jobsById.values()].filter((job) => job.userId === userId && job.state === 'mock').map((job) => ({ type: job.type, completedAt: job.completedAt })),
    ...[...leases.values()].filter((lease) => lease.userId === userId).map((lease) => ({ type: lease.type, completedAt: new Date(now).toISOString() })),
  ];
  const reserve = (jobId) => {
    const job = jobsById.get(jobId); const preference = job && preferenceByUser.get(job.userId);
    if (!job || job.state !== 'claimed' || leases.has(jobId)) return null;
    const decision = evaluateDeliveryPolicy({ type: job.type, preferences: preference, recentCompletions: completedOrReserved(job.userId), now });
    if (!decision.allowed) return null;
    const token = `lease-${++leaseSequence}-${jobId}`;
    leases.set(jobId, { token, userId: job.userId, type: job.type, preferenceVersion: preference.dispatchVersion || 0, consumed: false });
    return token;
  };
  const consume = (jobId, token) => {
    const job = jobsById.get(jobId); const preference = job && preferenceByUser.get(job.userId); const lease = leases.get(jobId);
    if (!job || job.state !== 'claimed' || !preference?.consented || preference.status !== 'active' || !lease || lease.token !== token || lease.consumed || lease.preferenceVersion !== (preference.dispatchVersion || 0)) return false;
    lease.consumed = true;
    return true;
  };
  const unsubscribe = (userId, reason = 'account') => {
    const preference = preferenceByUser.get(userId); if (!preference) return false;
    if (preference.status !== 'unsubscribed') {
      preference.status = 'unsubscribed'; preference.consented = false; preference.suppressed = true; preference.suppressionReason = reason; preference.dispatchVersion = (preference.dispatchVersion || 0) + 1;
      history.push({ userId, action: 'unsubscribed', suppressionReason: reason });
    }
    for (const job of jobsById.values()) if (job.userId === userId && ['pending', 'claimed', 'retry'].includes(job.state)) job.state = 'suppressed';
    for (const [jobId, lease] of leases) if (lease.userId === userId) leases.delete(jobId);
    return true;
  };
  const exportData = (userId) => ({
    preferences: copy(preferenceByUser.get(userId) || {}),
    consent_history: copy(history.filter((entry) => entry.userId === userId)),
    jobs: copy([...jobsById.values()].filter((job) => job.userId === userId)),
    webhook_events: copy(events.filter((event) => event.userId === userId)),
  });
  const deleteData = (userId) => {
    // Mirrors the migration's cascade boundary as one local state transition.
    const jobIds = new Set([...jobsById.values()].filter((job) => job.userId === userId).map((job) => job.id));
    for (const jobId of jobIds) { jobsById.delete(jobId); leases.delete(jobId); }
    preferenceByUser.delete(userId);
    history = history.filter((entry) => entry.userId !== userId);
    events = events.filter((event) => event.userId !== userId && !jobIds.has(event.jobId));
    return true;
  };
  return {
    reserve, consume, unsubscribe, exportData, deleteData,
    async rpc(name, args) {
      if (name === 'authorize_lifecycle_dispatch') return { data: reserve(args.p_job_id), error: null };
      if (name === 'consume_lifecycle_dispatch_lease') return { data: consume(args.p_job_id, args.p_lease_token), error: null };
      throw new Error(`Unexpected RPC: ${name}`);
    },
  };
}

export function safeLifecycleWebhookEvent(input = {}) {
  const allowed = ['delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed']; const occurred = new Date(input.occurredAt || Date.now());
  return { providerEventId: String(input.providerEventId || '').slice(0, 128), jobId: String(input.jobId || '').slice(0, 128), eventType: allowed.includes(input.eventType) ? input.eventType : 'failed', occurredAt: Number.isNaN(occurred.getTime()) ? new Date(0).toISOString() : occurred.toISOString() };
}
