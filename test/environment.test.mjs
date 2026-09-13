import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { environmentEvidence, environmentHeaders, resolveEnvironment } from '../scripts/config/environment.mjs';
import { flowhomeEnvironment } from '../scripts/config/astro-environment.mjs';
import { verifyProductionEnvironment } from '../scripts/deploy/release-artifact.mjs';

const stagingRef = 'a'.repeat(20);
const productionRef = 'b'.repeat(20);
const jwt = (claims) => ['eyJhbGciOiJIUzI1NiJ9', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'testsignature'].join('.');
const anon = (ref = stagingRef) => jwt({ role: 'anon', ref });
const staging = () => ({ PUBLIC_APP_ENV: 'staging', PUBLIC_AUTH_ENABLED: 'true', PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co`, PUBLIC_SUPABASE_ANON_KEY: anon(), FLOWHOME_SUPABASE_STAGING_REF: stagingRef, FLOWHOME_SUPABASE_PRODUCTION_REF: productionRef });
const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('no configuration means local, no account, no Google, no analytics and no project selection', () => {
  assert.deepEqual(resolveEnvironment({}), { environment: 'local', authEnabled: false, analyticsEnabled: false, supabaseUrl: '', supabaseAnonKey: '', supabaseProjectRef: '', googleClientId: '', gtmId: '', ga4Id: '', clarityId: '' });
});

test('disabled services do not project leftover URL, public keys or measurement IDs', () => {
  const config = resolveEnvironment({ ...staging(), PUBLIC_AUTH_ENABLED: 'false', PUBLIC_GTM_ID: 'GTM-TEST12', PUBLIC_GA4_ID: 'G-TEST123456', PUBLIC_CLARITY_ID: 'testid', PUBLIC_GOOGLE_CLIENT_ID: '123-test.apps.googleusercontent.com' });
  for (const field of ['supabaseUrl', 'supabaseAnonKey', 'supabaseProjectRef', 'googleClientId', 'gtmId', 'ga4Id', 'clarityId']) assert.equal(config[field], '');
});

test('environment and feature flags are explicit and a production dispatch rejects local defaults', () => {
  for (const [name, value] of [['PUBLIC_APP_ENV', 'preview'], ['PUBLIC_AUTH_ENABLED', 'on'], ['PUBLIC_ANALYTICS_ENABLED', '1'], ['PUBLIC_AUTH_ENABLED', 'TRUE']]) assert.throws(() => resolveEnvironment({ [name]: value }), /configuration/);
  assert.throws(() => resolveEnvironment({ RELEASE_DEPLOY_PRODUCTION: 'true' }), /must be production/);
  for (const environment of ['local', 'staging']) assert.throws(() => resolveEnvironment({ PUBLIC_APP_ENV: environment, PUBLIC_ANALYTICS_ENABLED: 'true' }), /only permitted in production/);
});

test('hosted auth requires a complete configuration and separately reviewed project identities', () => {
  const config = resolveEnvironment(staging());
  assert.equal(config.supabaseProjectRef, stagingRef);
  assert.equal(config.supabaseUrl, `https://${stagingRef}.supabase.co`);
  for (const name of ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'FLOWHOME_SUPABASE_STAGING_REF']) assert.throws(() => resolveEnvironment({ ...staging(), [name]: '' }), /configuration/);
  assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_APP_ENV: 'production' }), /does not match/);
  assert.throws(() => resolveEnvironment({ ...staging(), FLOWHOME_SUPABASE_PRODUCTION_REF: stagingRef }), /must differ/);
  assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_SUPABASE_ANON_KEY: anon(productionRef) }), /does not match/);
  const production = resolveEnvironment({ ...staging(), PUBLIC_APP_ENV: 'production', PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co`, PUBLIC_SUPABASE_ANON_KEY: anon(productionRef) });
  assert.equal(production.supabaseProjectRef, productionRef);
});

test('public publishable keys and legacy anon keys are supported without pretending to authenticate them', () => {
  const publishable = `sb_publishable_${'x'.repeat(24)}`;
  const config = resolveEnvironment({ ...staging(), PUBLIC_SUPABASE_ANON_KEY: '', PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable });
  assert.equal(config.supabaseAnonKey, publishable);
  assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable }), /cannot be combined/);
  for (const key of ['YOUR_ANON_PUBLIC_KEY', 'sb_publishable_short', 'eyJ.invalid.token', jwt(null)]) assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_SUPABASE_ANON_KEY: key }), /configuration/);
});

test('privileged keys and user JWTs fail closed even when auth is off, without including values in errors', () => {
  for (const [name, value] of [['PUBLIC_SUPABASE_ANON_KEY', jwt({ role: 'service_role' })], ['PUBLIC_SUPABASE_ANON_KEY', jwt({ role: 'authenticated' })], ['PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_do-not-log'], ['PUBLIC_SERVICE_ROLE_KEY', 'do-not-log'], ['PUBLIC_ACCESS_TOKEN', 'do-not-log']]) {
    assert.throws(() => resolveEnvironment({ [name]: value }), (error) => {
      assert.ok(!error.message.includes(value));
      assert.match(error.message, /configuration/);
      return true;
    });
  }
  assert.equal(resolveEnvironment({ SUPABASE_SERVICE_ROLE_KEY: 'server-only-not-projected' }).supabaseAnonKey, '');
});

test('unsafe, misleading and cross-environment origins are rejected', () => {
  for (const url of [`http://${stagingRef}.supabase.co`, `https://${stagingRef}.supabase.co.attacker.invalid`, `https://${stagingRef}.supabase.co:8443`, `https://user:pass@${stagingRef}.supabase.co`, `https://${stagingRef}.supabase.co/rest/v1`, `https://${stagingRef}.supabase.co/?token=private`, `https://${stagingRef}.supabase.co/#private`, 'javascript:alert(1)']) assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_SUPABASE_URL: url }), /configuration/);
  assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_APP_ENV: 'local' }), /loopback/);
  for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321']) assert.equal(resolveEnvironment({ ...staging(), PUBLIC_APP_ENV: 'local', PUBLIC_SUPABASE_URL: url }).supabaseUrl, url);
});

test('Google is optional and measurement requires explicit production enablement', () => {
  assert.equal(resolveEnvironment(staging()).googleClientId, '');
  assert.throws(() => resolveEnvironment({ ...staging(), PUBLIC_GOOGLE_CLIENT_ID: 'fake' }), /Google client ID/);
  const enabled = { PUBLIC_APP_ENV: 'production', PUBLIC_ANALYTICS_ENABLED: 'true', PUBLIC_GTM_ID: 'GTM-TEST12', PUBLIC_GA4_ID: 'G-TEST123456' };
  assert.equal(resolveEnvironment(enabled).gtmId, 'GTM-TEST12');
  assert.equal(resolveEnvironment(enabled).ga4Id, 'G-TEST123456');
  for (const id of ['', 'G-XXXXXXXXXX', 'G-123456', 'GTM-TEST12', 'G-TEST123456?private', 'G-test123456']) assert.throws(() => resolveEnvironment({ ...enabled, PUBLIC_GA4_ID: id }), /reviewed measurement ID/);
  for (const id of ['', 'GTM-XXXXXXX', 'G-123456', 'GTM-<script>']) assert.throws(() => resolveEnvironment({ ...enabled, PUBLIC_GTM_ID: id }), /container ID/);
});

test('CSP is generated from the selected origin and staging receives noindex without widening defaults', () => {
  const source = read('public/_headers');
  const local = environmentHeaders(source, resolveEnvironment({}));
  assert.doesNotMatch(local, /supabase\.co/);
  const hosted = environmentHeaders(source, resolveEnvironment(staging()));
  assert.ok(hosted.includes(`connect-src 'self' https://${stagingRef}.supabase.co`));
  assert.match(hosted, /X-Robots-Tag: noindex, nofollow/);
  assert.doesNotMatch(hosted, /https:\/\/\*\.supabase/);
  assert.throws(() => environmentHeaders(hosted, resolveEnvironment(staging())), /static CSP/);
  assert.throws(() => environmentHeaders('no policy', resolveEnvironment({})), /missing CSP/);
});

test('public environment evidence excludes keys and the release gate refuses absent or non-production builds', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'flowhome-environment-record-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  assert.throws(() => verifyProductionEnvironment(root), /requires a build environment record/);
  const evidence = environmentEvidence(resolveEnvironment(staging()));
  assert.deepEqual(Object.keys(evidence), ['schemaVersion', 'environment', 'authEnabled', 'analyticsEnabled', 'supabaseProjectRef']);
  for (const environment of ['local', 'staging']) {
    writeFileSync(path.join(root, 'release-environment.json'), JSON.stringify({ ...evidence, environment }));
    assert.throws(() => verifyProductionEnvironment(root), /Only a production build/);
  }
  const production = environmentEvidence(resolveEnvironment({ PUBLIC_APP_ENV: 'production' }));
  writeFileSync(path.join(root, 'release-environment.json'), JSON.stringify(production));
  assert.deepEqual(verifyProductionEnvironment(root), production);
});

test('the build uses Vite mode-specific dotenv precedence and only injects validated public fields', (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'flowhome-environment-mode-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, '.env'), 'PUBLIC_APP_ENV=local\nPRIVATE_TOKEN=must-not-be-projected\n');
  writeFileSync(path.join(root, '.env.staging'), 'PUBLIC_APP_ENV=staging\n');
  let plugin;
  flowhomeEnvironment().hooks['astro:config:setup']({ updateConfig: (config) => { plugin = config.vite.plugins[0]; } });
  const load = () => JSON.parse(plugin.config({ root }, { mode: 'staging' }).define.__FLOWHOME_PUBLIC_CONFIG__);
  const previous = process.env.PUBLIC_APP_ENV;
  const previousRelease = process.env.RELEASE_DEPLOY_PRODUCTION;
  delete process.env.PUBLIC_APP_ENV;
  delete process.env.RELEASE_DEPLOY_PRODUCTION;
  t.after(() => {
    if (previous === undefined) delete process.env.PUBLIC_APP_ENV; else process.env.PUBLIC_APP_ENV = previous;
    if (previousRelease === undefined) delete process.env.RELEASE_DEPLOY_PRODUCTION; else process.env.RELEASE_DEPLOY_PRODUCTION = previousRelease;
  });
  assert.equal(load().environment, 'staging');
  process.env.RELEASE_DEPLOY_PRODUCTION = 'true';
  assert.throws(load, /must be production for a production release/);
  process.env.PUBLIC_APP_ENV = 'production';
  assert.equal(load().environment, 'production');
  assert.ok(!JSON.stringify(load()).includes('must-not-be-projected'));
});

test('browser client creates nothing when disabled, uses only the build configuration when enabled and caches one client', () => {
  const source = ts.transpileModule(read('src/lib/supabase-client.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const run = (config, browser = true) => {
    const calls = [];
    const context = { exports: {}, document: { querySelector: () => { throw new Error('DOM must not select account configuration'); } }, require: (name) => name === '@supabase/supabase-js' ? { createClient: (...args) => { calls.push(args); return { from: 'fixture' }; } } : { publicConfig: config } };
    if (browser) context.window = {};
    vm.runInNewContext(source, context);
    return { get: context.exports.getSupabaseClient, calls };
  };
  const disabled = run(resolveEnvironment({}));
  assert.equal(disabled.get(), null);
  assert.equal(disabled.calls.length, 0);
  const config = resolveEnvironment(staging());
  assert.equal(run(config, false).get(), null);
  const enabled = run(config);
  assert.equal(enabled.get(), enabled.get());
  assert.deepEqual(enabled.calls, [[config.supabaseUrl, config.supabaseAnonKey]]);
});

test('Google loader is not reached without a client ID and disabled account returns before loading session UI', async () => {
  const source = ts.transpileModule(read('src/lib/google-identity.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, require: () => ({ googleClientId: '' }), window: {}, document: { createElement: () => { throw new Error('Unexpected Google request'); } } };
  vm.runInNewContext(source, context);
  await assert.rejects(context.exports.registerGoogleCredentialHandler('account', () => {}), /Google sign-in is unavailable/);
  assert.deepEqual(context.window, {});
  const account = read('src/pages/account.astro');
  assert.ok(account.indexOf('if (!isSupabaseConfigured) return;') < account.indexOf('const requiredElement'));
  assert.match(account, /data-account-unavailable/);
  assert.match(account, /href="\/cart\/"/);
  assert.doesNotMatch(read('src/components/Header.astro'), /data-supabase|supabaseAnonKey/);
});
