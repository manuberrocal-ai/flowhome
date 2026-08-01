import { verifyHmac } from '../_shared/lifecycle-security.js';
import { environment, serve } from '../_shared/runtime.ts';

const response = (status: number) => new Response(null, { status });
serve(async (request) => {
  if (request.method !== 'POST') return response(405);
  const raw = await request.text();
  const valid = await verifyHmac({ secret: environment('LIFECYCLE_WEBHOOK_SECRET') || '', value: raw, signature: request.headers.get('x-lifecycle-signature') || '', timestamp: request.headers.get('x-lifecycle-timestamp') || '' });
  if (!valid) return response(401);
  if ((environment('EMAIL_PROVIDER') || 'mock') === 'mock') return response(204);
  // A non-mock provider is intentionally unsupported until an approved adapter is added.
  return response(503);
});
