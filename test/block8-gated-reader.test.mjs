import assert from 'node:assert/strict';
import test from 'node:test';
import { createGatedCommerceReader } from '../src/lib/blocks/block8/gated-reader.ts';
import { serveCommerceRequest } from '../src/lib/blocks/block8/request-delivery.ts';
import { createSupabaseAttemptReserver } from '../src/lib/blocks/block8/supabase-budget.ts';
import { offerFixture, evidenceFixture, NOW } from './helpers/block8-fixtures.mjs';

const context = { asin: 'B0FIXTUR01', market: 'US' };
const signal = () => new AbortController().signal;
const grant = () => ({ ...context, accountRef: 'test-account', revision: 'revision-1', expiresAt: '2026-07-30T12:00:30Z' });
function snapshot() {
  const offer = offerFixture({ source: 'amazon-creators-api', affiliateUrl: `https://www.amazon.com/dp/${context.asin}?tag=flowhome-20` });
  const evidence = evidenceFixture(offer); evidence.knownVariants[0].marketplaceId = context.asin;
  return { offer, evidence, authorizationExpiresAt: '2026-07-30T12:10:00Z' };
}
const settings = (extra = {}) => ({ enabled: true, authorize: async () => grant(), reserveAttempt: async () => true,
  acquireReviewedSnapshot: async () => snapshot(), clock: () => new Date(NOW), ...extra });

test('disabled, cancelled and malformed reader contexts cannot invoke dependencies', async () => {
  const never = () => { throw Error('Unexpected dependency call'); };
  const deps = settings({ authorize: never, reserveAttempt: never, acquireReviewedSnapshot: never });
  for (const enabled of [undefined, false, 'true']) assert.equal(await createGatedCommerceReader({ ...deps, enabled })(context, signal()), null);
  const aborted = new AbortController(); aborted.abort();
  assert.equal(await createGatedCommerceReader(deps)(context, aborted.signal), null);
  for (const input of [null, { ...context, market: 'CA' }, { ...context, asin: 'bad' }, { ...context, asin: [context.asin] }]) assert.equal(await createGatedCommerceReader(deps)(input, signal()), null);
});

test('missing, mismatched or expired authority prevents quota and acquisition', async () => {
  let attempts = 0;
  for (const value of [null, { ...grant(), asin: 'B000000000' }, { ...grant(), market: 'CA' }, { ...grant(), accountRef: '' }, { ...grant(), revision: '' }, { ...grant(), expiresAt: NOW }]) {
    const read = createGatedCommerceReader(settings({ authorize: async () => value, reserveAttempt: async () => { attempts++; return true; } }));
    assert.equal(await read(context, signal()), null);
  }
  assert.equal(attempts, 0);
});

test('quota refusal and errors fail closed before acquisition', async () => {
  let acquisitions = 0;
  for (const reserveAttempt of [async () => false, async () => 'true', async () => { throw Error('private quota backend'); }]) {
    assert.equal(await createGatedCommerceReader(settings({ reserveAttempt, acquireReviewedSnapshot: async () => { acquisitions++; return snapshot(); } }))(context, signal()), null);
  }
  assert.equal(acquisitions, 0);
});

test('revocation, account switches and revision changes during acquisition discard the result', async () => {
  for (const next of [null, { ...grant(), revision: 'revision-2' }, { ...grant(), accountRef: 'other-account' }, { ...grant(), expiresAt: NOW }]) {
    let reads = 0;
    const read = createGatedCommerceReader(settings({ authorize: async () => reads++ ? next : grant() }));
    assert.equal(await read(context, signal()), null);
    assert.equal(reads, 2);
  }
});

test('integration preserves the earliest authorization and reprojects each response', async () => {
  const order = []; const stored = snapshot();
  const read = createGatedCommerceReader(settings({ authorize: async () => { order.push('authorize'); return grant(); },
    reserveAttempt: async value => { order.push('reserve'); value.expiresAt = '2099-01-01T00:00:00Z'; return true; },
    acquireReviewedSnapshot: async (identity, authority, signal) => {
      order.push('acquire'); assert.deepEqual(identity, context); assert.equal(authority.accountRef, 'test-account');
      assert.equal(authority.expiresAt, grant().expiresAt); assert.equal(signal.aborted, false); return stored;
    } }));
  const response = await serveCommerceRequest(new Request(`https://flowhome.dev/test?asin=${context.asin}&market=US`), { enabled: true, readAuthorizedSnapshot: read, clock: () => new Date(NOW) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).validUntil, '2026-07-30T12:00:30.000Z');
  assert.deepEqual(order, ['authorize', 'reserve', 'acquire', 'authorize']);
  assert.equal(stored.authorizationExpiresAt, '2026-07-30T12:10:00Z');
});

test('cancellation after consuming a quota attempt never starts acquisition or refunds', async () => {
  const controller = new AbortController(); let acquired = false;
  const read = createGatedCommerceReader(settings({ reserveAttempt: async () => { controller.abort(); return true; }, acquireReviewedSnapshot: async () => { acquired = true; return snapshot(); } }));
  assert.equal(await read(context, controller.signal), null); assert.equal(acquired, false);
});

test('expired or backwards clocks after quota reservation prevent acquisition', async () => {
  for (const finalTime of ['2026-07-30T12:00:30Z', '2026-07-30T11:59:59Z', 'invalid']) {
    let tick = 0; let acquired = false;
    const read = createGatedCommerceReader(settings({ clock: () => new Date(tick++ < 2 ? NOW : finalTime), acquireReviewedSnapshot: async () => { acquired = true; return snapshot(); } }));
    assert.equal(await read(context, signal()), null); assert.equal(acquired, false);
  }
});

test('each read consumes its own attempt and errors never reuse an earlier snapshot', async () => {
  let attempts = 0; let acquired = 0;
  const read = createGatedCommerceReader(settings({ reserveAttempt: async () => { attempts++; return true; }, acquireReviewedSnapshot: async () => {
    if (acquired++) throw Error('private provider response');
    return snapshot();
  } }));
  assert.ok(await read(context, signal()));
  assert.equal(await read(context, signal()), null);
  assert.equal(attempts, 2); assert.equal(acquired, 2);
});

test('concurrent reads obey a shared synthetic quota decision, not a per-reader counter', async () => {
  let remaining = 1; let acquired = 0;
  const deps = settings({ reserveAttempt: async () => remaining-- > 0, acquireReviewedSnapshot: async () => { acquired++; return snapshot(); } });
  const results = await Promise.all([createGatedCommerceReader(deps)(context, signal()), createGatedCommerceReader(deps)(context, signal())]);
  assert.equal(results.filter(Boolean).length, 1); assert.equal(acquired, 1);
});

test('reader acquires only after the quota transport confirms its commit policy', async () => {
  for (const preference of [undefined, 'tx=rollback', 'tx=commit']) {
    let acquisitions = 0;
    const reserveAttempt = createSupabaseAttemptReserver({ enabled: true, projectUrl: 'https://test.supabase.co/', transactionPolicy: 'commit-allow-override',
      credentials: async () => ({ apiKey: 'synthetic-key', accessToken: 'synthetic-token' }),
      fetch: async () => new Response('true', { headers: { 'content-type': 'application/json', ...(preference ? { 'preference-applied': preference } : {}) } }),
    });
    const read = createGatedCommerceReader(settings({ reserveAttempt, acquireReviewedSnapshot: async () => { acquisitions++; return snapshot(); } }));
    assert.equal(Boolean(await read(context, signal())), preference === 'tx=commit');
    assert.equal(acquisitions, preference === 'tx=commit' ? 1 : 0);
  }
});
