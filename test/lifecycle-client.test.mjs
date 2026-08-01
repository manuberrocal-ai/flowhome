import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteLifecycleData,
  exportLifecycleData,
  getLifecyclePreferences,
  saveLifecyclePreferences,
  unsubscribeLifecyclePreferences,
  unsubscribeLifecycleToken,
  consumeUnsubscribeFragment,
} from '../src/lib/lifecycle-client.js';

const mockClient = (responses = {}) => {
  const calls = [];
  const client = {
    calls,
    rpc: async (name, payload) => {
      calls.push({ type: 'rpc', name, payload });
      return responses[name] || { data: null, error: null };
    },
    functions: {
      invoke: async (name, options) => {
        calls.push({ type: 'invoke', name, options });
        return responses.invoke || { data: null, error: null };
      },
    },
  };
  return client;
};

test('lifecycle client requires an explicit client and enforces the consent gate', async () => {
  await assert.rejects(() => getLifecyclePreferences(null), /client is required/);
  await assert.rejects(() => saveLifecyclePreferences({ consent: true }, null), /client is required/);
  const client = mockClient({ get_lifecycle_preferences: { data: { market: 'CA', consented: true, types: ['digest'] }, error: null } });
  assert.deepEqual(await getLifecyclePreferences(client), {
    version: 1, categories: [], market: 'US', frequency: 'weekly', types: ['digest'], consented: true, status: 'active', suppressed: false, suppressionReason: null,
  });
  await assert.rejects(() => saveLifecyclePreferences({ consent: false }, client), /Explicit lifecycle consent/);
  assert.equal(client.calls.length, 1);
});

test('save sends normalized consent payload and returns it', async () => {
  const client = mockClient();
  const result = await saveLifecyclePreferences({ consent: true, market: 'CA', types: ['digest', 'invalid'] }, client);
  assert.deepEqual(client.calls[0], { type: 'rpc', name: 'save_lifecycle_preferences', payload: { p_preferences: result, p_consent_version: 1 } });
  assert.equal(result.consented, true);
  assert.equal(result.market, 'US');
});

test('unsubscribe RPC reports immediate and idempotent results, but propagates errors', async () => {
  const immediate = mockClient({ unsubscribe_lifecycle_preferences: { data: { status: 'unsubscribed' }, error: null } });
  assert.equal(await unsubscribeLifecyclePreferences('account', immediate), true);
  assert.deepEqual(immediate.calls[0], { type: 'rpc', name: 'unsubscribe_lifecycle_preferences', payload: { p_reason: 'account' } });
  const idempotent = mockClient({ unsubscribe_lifecycle_preferences: { data: { status: 'already_unsubscribed' }, error: null } });
  assert.equal(await unsubscribeLifecyclePreferences('privacy-request', idempotent), true);
  const failed = mockClient({ unsubscribe_lifecycle_preferences: { data: null, error: { message: 'RPC unavailable' } } });
  await assert.rejects(() => unsubscribeLifecyclePreferences('account', failed), /RPC unavailable/);
});

test('token unsubscribe invokes the function and fails closed', async () => {
  const client = mockClient();
  assert.equal(await unsubscribeLifecycleToken('token-123', client), true);
  assert.deepEqual(client.calls[0], { type: 'invoke', name: 'lifecycle-unsubscribe', options: { body: { token: 'token-123' } } });
  const before = client.calls.length;
  await assert.rejects(() => unsubscribeLifecycleToken('', client), /token is required/);
  await assert.rejects(() => unsubscribeLifecycleToken('token-123', null), /client is required/);
  assert.equal(client.calls.length, before);
  const failed = mockClient({ invoke: { data: null, error: { message: 'invalid token' } } });
  await assert.rejects(() => unsubscribeLifecycleToken('bad-token', failed), /invalid token/);
});

test('export and delete preserve results and reject failed calls', async () => {
  const exported = { preferences: { market: 'US' }, consent_history: [] };
  const client = mockClient({ export_lifecycle_data: { data: exported, error: null } });
  assert.deepEqual(await exportLifecycleData(client), exported);
  assert.equal(await deleteLifecycleData(client), true);
  assert.deepEqual(client.calls.map(({ name, payload }) => ({ name, payload })), [
    { name: 'export_lifecycle_data', payload: undefined },
    { name: 'delete_lifecycle_data', payload: undefined },
  ]);
  const failed = mockClient({ delete_lifecycle_data: { data: null, error: { message: 'delete failed' } } });
  await assert.rejects(() => deleteLifecycleData(failed), /delete failed/);
});

test('unsubscribe fragment is consumed and cleaned without touching unrelated URL data', () => {
  const location = { hash: '#u=token-123', pathname: '/preferences/', search: '?from=quiz' };
  const history = { state: { page: 1 }, calls: [], replaceState(...args) { this.calls.push(args); } };
  assert.equal(consumeUnsubscribeFragment(location, history), 'token-123');
  assert.deepEqual(history.calls, [[{ page: 1 }, '', '/preferences/?from=quiz']]);
  const untouched = { hash: '#other=value', pathname: '/preferences/', search: '' };
  const untouchedHistory = { replaceState() { throw new Error('fragment should not be cleaned'); } };
  assert.equal(consumeUnsubscribeFragment(untouched, untouchedHistory), null);
});
