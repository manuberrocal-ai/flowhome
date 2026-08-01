import { createClient } from '@supabase/supabase-js';
import { getEmailProvider } from '../_shared/email-provider.js';
import { dispatchClaimedJob } from '../_shared/lifecycle-core.js';
import { constantTimeEqual, hasConfiguredSecret } from '../_shared/lifecycle-security.js';
import { environment, serve } from '../_shared/runtime.ts';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const service = () => {
  const url = environment('SUPABASE_URL') || ''; const key = environment('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !hasConfiguredSecret(key)) throw new Error('Worker configuration unavailable.');
  return createClient(url, key);
};

serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const secret = environment('LIFECYCLE_WORKER_SECRET') || '';
  if (!hasConfiguredSecret(secret) || !constantTimeEqual(request.headers.get('x-lifecycle-worker-secret') || '', secret)) return json({ error: 'unauthorized' }, 401);
  let db; let provider;
  try { db = service(); provider = getEmailProvider(); } catch { return json({ error: 'unavailable' }, 503); }
  const stale = await db.rpc('expire_stale_lifecycle_claims', { p_max_age_seconds: 900 });
  if (stale.error) return json({ error: 'unavailable' }, 503);
  const { data: jobs, error } = await db.rpc('claim_lifecycle_jobs', { p_limit: 25 });
  if (error) return json({ error: 'unavailable' }, 503);
  for (const job of jobs || []) {
    let outcome;
    try { outcome = await dispatchClaimedJob({ job, db, provider }); } catch { return json({ error: 'unavailable' }, 503); }
    const finished = await db.rpc('finish_lifecycle_job', { p_job_id: job.id, p_state: outcome.state, p_next_attempt_at: outcome.nextAttemptAt });
    if (finished.error) return json({ error: 'unavailable' }, 503);
  }
  return json({ processed: (jobs || []).length, provider: 'mock' });
});
