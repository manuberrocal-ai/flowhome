import { createClient } from '@supabase/supabase-js';
import { lifecycleUnsubscribeCorsHeaders } from '../_shared/lifecycle-core.js';
import { hasConfiguredSecret, verifyUnsubscribeToken } from '../_shared/lifecycle-security.js';
import { environment, serve } from '../_shared/runtime.ts';

serve(async (request) => {
  const cors = lifecycleUnsubscribeCorsHeaders(request.headers.get('origin'), environment('LIFECYCLE_PUBLIC_ORIGIN') || 'https://flowhome.dev');
  if (!cors) return new Response(null, { status: 403, headers: { vary: 'Origin' } });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: cors });
  const url = environment('SUPABASE_URL') || ''; const serviceKey = environment('SUPABASE_SERVICE_ROLE_KEY') || ''; const tokenSecret = environment('LIFECYCLE_TOKEN_SECRET') || '';
  if (!url || !hasConfiguredSecret(serviceKey) || !hasConfiguredSecret(tokenSecret)) return new Response(null, { status: 503, headers: cors });
  const declaredLength = request.headers.get('content-length'); const contentLength = declaredLength === null ? null : Number(declaredLength);
  if (contentLength !== null && (!Number.isFinite(contentLength) || contentLength < 1 || contentLength > 4096)) return new Response(null, { status: 413, headers: cors });
  let raw = ''; try { raw = await request.text(); } catch { return new Response(null, { status: 400, headers: cors }); }
  if (raw.length > 4096) return new Response(null, { status: 413, headers: cors });
  let token = ''; try { token = String(JSON.parse(raw).token || ''); } catch { return new Response(null, { status: 400, headers: cors }); }
  const payload = await verifyUnsubscribeToken(token, tokenSecret);
  if (!payload) return new Response(null, { status: 400, headers: cors });
  const db = createClient(url, serviceKey);
  const { error } = await db.rpc('unsubscribe_lifecycle_one_click', { p_user_id: payload.userId });
  if (error) return new Response(null, { status: 503, headers: cors });
  return new Response(JSON.stringify({ unsubscribed: true }), { status: 200, headers: { ...cors, 'content-type': 'application/json' } });
});
