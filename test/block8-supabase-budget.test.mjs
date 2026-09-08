import assert from 'node:assert/strict';
import test from 'node:test';
import { createSupabaseAttemptReserver } from '../src/lib/blocks/block8/supabase-budget.ts';

const grant = { accountRef: 'test-account', revision: 'r1' };
const freshSignal = () => new AbortController().signal;
const credentials = async () => ({ apiKey: 'synthetic-key', accessToken: 'synthetic-token' });
const options = extra => ({ enabled: true, projectUrl: 'https://test.supabase.co/', transactionPolicy: 'commit', credentials, ...extra });
const response = (body = 'true', preference) => new Response(body, { headers: { 'content-type': 'application/json', ...(preference ? { 'preference-applied': preference } : {}) } });

test('disabled transport is inert and enabled configuration rejects unsafe or unknown targets/policy', async () => {
  for (const enabled of [undefined, false, 'true']) assert.equal(await createSupabaseAttemptReserver({ enabled })(null, null), false);
  for (const projectUrl of ['http://external.invalid/', 'https://user:pass@test.supabase.co/', 'https://test.supabase.co/path', 'https://test.supabase.co/?key=value']) assert.throws(() => createSupabaseAttemptReserver(options({ projectUrl })));
  for (const transactionPolicy of [undefined, 'rollback', 'unknown']) assert.throws(() => createSupabaseAttemptReserver(options({ transactionPolicy })));
});

test('request uses fixed RPC, explicit commit and only account/revision payload', async () => {
  const reserve = createSupabaseAttemptReserver(options({ fetch: async (url, init) => {
    assert.equal(String(url), 'https://test.supabase.co/rest/v1/rpc/block10_reserve_commerce_attempt');
    assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store'); assert.equal(init.credentials, 'omit');
    assert.equal(init.headers.Prefer, 'tx=commit, handling=strict'); assert.equal(init.headers.Authorization, 'Bearer synthetic-token');
    assert.deepEqual(JSON.parse(init.body), { p_account_ref: 'test-account', p_revision: 'r1' });
    return response();
  } }));
  assert.equal(await reserve({ ...grant, injected: 'not forwarded' }, freshSignal()), true);
});

test('override modes require confirmed commit; rollback and conflicting preferences always deny', async () => {
  for (const transactionPolicy of ['commit', 'commit-allow-override', 'rollback-allow-override']) {
    for (const preference of [undefined, 'tx=commit', 'tx=rollback', 'tx=commit, tx=rollback', 'tx=commit, tx=commit', 'tx=unknown', 'tx = rollback']) {
      const reserve = createSupabaseAttemptReserver(options({ transactionPolicy, fetch: async () => response('true', preference) }));
      assert.equal(await reserve(grant, freshSignal()), preference === 'tx=commit' || (preference === undefined && transactionPolicy === 'commit'), `${transactionPolicy}/${preference}`);
    }
  }
});

test('nonboolean, oversized and error responses deny without retries', async () => {
  for (const createResponse of [() => response('false'), () => response('"true"'), () => response('{"result":true}'), () => response(' '.repeat(129)+'true'), () => new Response('true', { status: 503 }), () => new Response('true', { headers: { 'content-type': 'text/html' } })]) {
    let calls = 0;
    const reserve = createSupabaseAttemptReserver(options({ fetch: async () => { calls++; return createResponse(); } }));
    assert.equal(await reserve(grant, freshSignal()), false); assert.equal(calls, 1);
  }
});

test('missing credentials and cancellation prevent requests; in-flight loss is conservative', async () => {
  let calls = 0;
  const never = async () => { calls++; throw Error('private transport detail'); };
  const aborted = new AbortController(); aborted.abort();
  assert.equal(await createSupabaseAttemptReserver(options({ fetch: never }))(grant, aborted.signal), false);
  assert.equal(await createSupabaseAttemptReserver(options({ credentials: async () => null, fetch: never }))(grant, freshSignal()), false);
  assert.equal(calls, 0);
  const live = new AbortController();
  const reserve = createSupabaseAttemptReserver(options({ fetch: async (_, init) => { live.abort(); assert.equal(init.signal.aborted, true); return response(); } }));
  assert.equal(await reserve(grant, live.signal), false);
});

test('a stalled credential/backend cannot block the reservation indefinitely', async () => {
  const reserve = createSupabaseAttemptReserver(options({ credentials: () => new Promise(() => {}) }));
  assert.equal(await reserve(grant, freshSignal()), false);
});
