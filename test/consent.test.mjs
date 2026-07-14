import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const consentSource = await readFile(new URL('../src/lib/consent.ts', import.meta.url), 'utf8');
const executableConsent = consentSource
  .replace(/(storage)\?: Storage \| null/g, '$1')
  .replace(/choice: 'accepted' \| 'rejected'/g, 'choice')
  .replace(/wasLoaded: boolean/g, 'wasLoaded');
const consent = await import(`data:text/javascript;base64,${Buffer.from(executableConsent).toString('base64')}`);

function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('consent is unset until an explicit, current-version choice is saved', () => {
  const local = storage();
  assert.equal(consent.getConsentPreference(local), 'unset');
  local.setItem(consent.CONSENT_STORAGE_KEY, JSON.stringify({ version: 0, choice: 'accepted' }));
  assert.equal(consent.getConsentPreference(local), 'unset');
});

test('accept, reject, and revoke have durable opt-in semantics', () => {
  const local = storage();
  assert.equal(consent.setConsentPreference('accepted', local), 'accepted');
  assert.equal(consent.hasAnalyticsConsent(local), true);
  assert.equal(consent.setConsentPreference('rejected', local), 'rejected');
  assert.equal(consent.hasAnalyticsConsent(local), false);
  consent.setConsentPreference('accepted', local);
  assert.equal(consent.revokeConsent(local), 'rejected');
  assert.equal(consent.getConsentPreference(local), 'rejected');
});

test('a preference is not reported as saved when persistent storage is unavailable', () => {
  const unavailable = { getItem: () => null, setItem: () => { throw new Error('storage unavailable'); } };
  assert.equal(consent.setConsentPreference('rejected', unavailable), 'unset');
  assert.equal(consent.getConsentPreference(unavailable), 'unset');
});

test('reload is required only once when an accepted optional runtime was loaded', () => {
  assert.equal(consent.shouldReloadOptionalAnalytics(true), true);
  assert.equal(consent.shouldReloadOptionalAnalytics(false), false);
  assert.equal(consent.shouldReloadOptionalAnalytics(true, true), false);
});
