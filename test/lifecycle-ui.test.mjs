import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('lifecycle UI is post-result, consent-explicit, fragment-only, and does not capture PII', async () => {
  const [quiz, capture, preferences, client, worker, privacy, qa, astroConfig, marketMigration] = await Promise.all([read('src/pages/quiz.astro'), read('src/components/LifecycleCapture.astro'), read('src/pages/preferences.astro'), read('src/lib/lifecycle-client.js'), read('supabase/functions/lifecycle-worker/index.ts'), read('src/pages/privacy.astro'), read('scripts/qa/browser-smoke.mjs'), read('astro.config.mjs'), read('supabase/migrations/004_restrict_lifecycle_market_us.sql')]);
  assert.ok(quiz.indexOf('<LifecycleCapture />') > quiz.indexOf('id="quiz-results"'));
  assert.match(capture, /href="\/preferences\/"/); assert.doesNotMatch(capture, /<input|<form|captureLifecyclePreference|worker/i);
  assert.match(astroConfig, /sitemapExcludedPaths = new Set\(\[.*'\/preferences'.*\]\)/s);
  assert.match(preferences, /noindex/); assert.match(preferences, /name="consent" type="checkbox" required/); assert.match(preferences, /checked = false/); assert.match(preferences, /setBusy/); assert.match(preferences, /future provider authorization/); assert.match(preferences, /60-second lease window/); assert.match(preferences, /<option value="US">United States<\/option>/); assert.doesNotMatch(preferences, /<option value="CA">Canada<\/option>/);
  assert.match(client, /location\.hash/); assert.match(client, /history\.replaceState/); assert.doesNotMatch(client, /captureLifecyclePreference|isValidLifecycleEmail|email/i);
  assert.match(worker, /constantTimeEqual/); assert.doesNotMatch(worker, /request\.json|request\.text/);
  assert.match(worker, /expire_stale_lifecycle_claims/); assert.match(worker, /if \(finished\.error\) return json\(\{ error: 'unavailable' \}, 503\)/); assert.match(privacy, /data-consent-action="accepted"/); assert.match(privacy, /data-consent-action="rejected"/); assert.doesNotMatch(privacy, /data-consent-action="accept"|data-consent-action="reject"/);
  assert.doesNotMatch(`${capture}\n${client}\n${worker}`, /console\.|dataLayer|trackEvent/); assert.match(qa, /preferences-\$\{width\}/);
  assert.match(marketMigration, /check \(market = 'US'\)/); assert.doesNotMatch(marketMigration, /\('US','CA'\)|\('US', 'CA'\)/);
});
