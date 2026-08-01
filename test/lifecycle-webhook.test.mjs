import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createUnsubscribeToken, hmac, verifyHmac, verifyUnsubscribeToken } from '../supabase/functions/_shared/lifecycle-security.js';
import { getEmailProvider } from '../supabase/functions/_shared/email-provider.js';

test('HMAC rejects stale and tampered webhooks and signed one-click tokens expose only user UUID', async () => {
  const timestamp = '1000'; const value = '{"providerEventId":"evt-1"}'; const signature = await hmac('a'.repeat(32), `${timestamp}.${value}`);
  assert.equal(await verifyHmac({ secret: 'a'.repeat(32), value, signature, timestamp, now: 1_000_000 }), true);
  assert.equal(await verifyHmac({ secret: 'a'.repeat(32), value, signature: `${signature}x`, timestamp, now: 1_000_000 }), false);
  assert.equal(await verifyHmac({ secret: 'a'.repeat(32), value, signature, timestamp, now: 2_000_000 }), false);
  assert.equal(await verifyHmac({ secret: 'short', value, signature, timestamp, now: 1_000_000 }), false);
  const token = await createUnsubscribeToken({ userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', exp: 2000 }, 'b'.repeat(32));
  assert.equal((await verifyUnsubscribeToken(token, 'b'.repeat(32), 1_000_000)).userId, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  assert.equal(await verifyUnsubscribeToken(`${token}x`, 'b'.repeat(32), 1_000_000), null);
  assert.equal(await verifyUnsubscribeToken(token, 'short', 1_000_000), null);
});

test('mock provider has no network/recipient result and webhook storage remains inactive until a provider is approved', async () => {
  const result = await getEmailProvider('mock').send({ recipient: 'not-retained@example.test', idempotencyKey: 'abcdefghijklmnop' });
  assert.deepEqual(Object.keys(result).sort(), ['confirmed', 'providerMessageId', 'state']); assert.throws(() => getEmailProvider('real'));
  const webhook = await readFile(new URL('../supabase/functions/lifecycle-webhook/index.ts', import.meta.url), 'utf8');
  assert.match(webhook, /LIFECYCLE_WEBHOOK_SECRET/); assert.match(webhook, /=== 'mock'\) return response\(204\)/);
});
