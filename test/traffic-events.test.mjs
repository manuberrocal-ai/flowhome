import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('BaseLayout emits no analytics loader, queue, or noscript fallback before consent', async () => {
  const layout = await read('src/layouts/BaseLayout.astro');
  assert.doesNotMatch(layout, /gtag\/js|googletagmanager\.com\/ns\.html|gtm\.js\}\);/);
  assert.match(layout, /setupAnalytics/);
  assert.match(layout, /data-gtm-id/);
});

test('optional analytics IDs are conditionally injected only after an accepted preference', async () => {
  const analytics = await read('src/lib/analytics.ts');
  assert.match(analytics, /if \(!hasAnalyticsConsent\(\)\) return;/);
  assert.match(analytics, /googletagmanager\.com\/gtm\.js/);
  assert.match(analytics, /clarity\.ms\/tag/);
  assert.match(analytics, /flowhome:consent-change/);
});

test('accept then revoke reloads once, while rejected boot neither loads nor dispatches', async () => {
  const [analytics, banner] = await Promise.all([
    read('src/lib/analytics.ts'),
    read('src/components/ConsentBanner.astro'),
  ]);
  assert.match(analytics, /RUNTIME_LOADED_FLAG/);
  assert.match(analytics, /analyticsWindow\[RUNTIME_LOADED_FLAG\] = true/);
  assert.match(analytics, /shouldReloadOptionalAnalytics\(/);
  assert.match(analytics, /RELOAD_PENDING_FLAG/);
  assert.match(analytics, /window\.location\.reload\(\)/);
  assert.match(analytics, /if \(typeof window === 'undefined' \|\| !hasAnalyticsConsent\(\)\) return false;/);
  assert.match(analytics, /if \(!hasAnalyticsConsent\(\)\) return;/);
  assert.ok(banner.indexOf('setConsentPreference(action)') < banner.indexOf("dispatchEvent(new CustomEvent('flowhome:consent-change'))"));
  assert.ok(banner.indexOf('revokeConsent()') < banner.lastIndexOf("dispatchEvent(new CustomEvent('flowhome:consent-change'))"));
});

test('acquisition events use the central dispatcher and CTA contract', async () => {
  const analytics = await read('src/lib/analytics.ts');
  assert.match(analytics, /data-fh-amazon-cta/);
  assert.match(analytics, /affiliate_click/);
  assert.match(analytics, /product_slug/);
  assert.match(analytics, /page_type/);
  assert.match(analytics, /cta_position/);
  for (const path of ['src/components/ProductCard.astro', 'src/components/DealCard.astro', 'src/components/StickyCTA.astro', 'src/components/CompareTable.astro', 'src/layouts/ProductLayout.astro', 'src/layouts/ReviewLayout.astro', 'src/pages/index.astro', 'src/pages/cart.astro', 'src/pages/product/[slug].astro']) {
    assert.match(await read(path), /data-fh-amazon-cta/);
  }
  assert.match(await read('src/pages/index.astro'), /data-fh-track="compare_open"/);
  assert.match(await read('src/pages/quiz.astro'), /trackEvent\('quiz_complete'/);
  assert.match(await read('src/pages/calculator.astro'), /trackEvent\('calculator_used'/);
});

test('cart client has no direct window.gtag acquisition tracking', async () => {
  const cartClient = await read('src/lib/cart-client.js');
  assert.doesNotMatch(cartClient, /window\.gtag/);
});

test('newsletter is an honest RSS follow CTA with no local email capture', async () => {
  const newsletter = await read('src/components/Newsletter.astro');
  assert.match(newsletter, /Follow via RSS/);
  assert.doesNotMatch(newsletter, /email_address|localStorage|newsletter_signup|<form/);
});
