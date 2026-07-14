import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTH_CHANGE_MESSAGE_TYPE,
  buildEmailCompleteUrl,
  buildEmailSignInUrl,
  createAuthChangeMessage,
  getSafeReturnPath,
  getUserInitials,
} from '../src/lib/auth-helpers.js';

test('keeps safe relative return paths including queries and hashes', () => {
  assert.equal(getSafeReturnPath('/best/picks/?room=kitchen#top'), '/best/picks/?room=kitchen#top');
  assert.equal(getSafeReturnPath('/'), '/');
});

test('rejects external and malformed return destinations', () => {
  assert.equal(getSafeReturnPath('https://attacker.example/path'), '/');
  assert.equal(getSafeReturnPath('//attacker.example/path'), '/');
  assert.equal(getSafeReturnPath('javascript:alert(1)'), '/');
  assert.equal(getSafeReturnPath('/\\attacker.example/path'), '/');
});

test('builds same-origin email URLs with a safe return path', () => {
  const complete = new URL(buildEmailCompleteUrl('https://flowhome.dev', '/deals/?sort=top#offers'));
  assert.equal(complete.origin, 'https://flowhome.dev');
  assert.equal(complete.pathname, '/account/');
  assert.equal(complete.searchParams.get('mode'), 'email-complete');
  assert.equal(complete.searchParams.get('return'), '/deals/?sort=top#offers');

  const signIn = new URL(buildEmailSignInUrl('https://flowhome.dev', 'https://attacker.example'));
  assert.equal(signIn.searchParams.get('mode'), 'email');
  assert.equal(signIn.searchParams.get('return'), '/');
});

test('keeps the email sign-in flow on the current origin for unsafe return input', () => {
  const origin = 'https://flowhome.dev';
  const emailRedirect = new URL(buildEmailCompleteUrl(origin, '//attacker.example/redirect'));
  const emailEntry = new URL(buildEmailSignInUrl(origin, 'javascript:alert(1)'));

  assert.equal(emailRedirect.origin, origin);
  assert.equal(emailRedirect.pathname, '/account/');
  assert.equal(emailRedirect.searchParams.get('return'), '/');
  assert.equal(emailEntry.origin, origin);
  assert.equal(emailEntry.pathname, '/account/');
  assert.equal(emailEntry.searchParams.get('return'), '/');
});

test('auth channel messages carry no tokens or personal data', () => {
  assert.deepEqual(createAuthChangeMessage(), { type: AUTH_CHANGE_MESSAGE_TYPE });
  assert.deepEqual(Object.keys(createAuthChangeMessage()), ['type']);
});

test('creates accessible initials for an email-only account', () => {
  assert.equal(getUserInitials({ email: 'jane.doe@example.com' }), 'JD');
  assert.equal(getUserInitials({ user_metadata: { full_name: 'Ada Lovelace' } }), 'AL');
});
