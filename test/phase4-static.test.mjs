import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const source = (path) => readFile(new URL(path, root), 'utf8');

test('keeps private utility pages out of sitemap indexing and fixes schema claims', async () => {
  const [astroConfig, search, seo] = await Promise.all([
    source('astro.config.mjs'),
    source('src/pages/search.astro'),
    source('src/lib/seo.ts'),
  ]);

  assert.match(astroConfig, /sitemapExcludedPaths/);
  for (const path of ['/account', '/cart', '/search']) assert.match(astroConfig, new RegExp(`['"]${path}['"]`));
  assert.match(astroConfig, /pathname\.replace\(/);
  assert.match(search, /<BaseLayout[\s\S]*\bnoindex\b/);
  assert.match(seo, /https:\/\/flowhome\.dev\/images\/flowhome-logo\.svg/);
  assert.doesNotMatch(seo, /shippingDetails|hasMerchantReturnPolicy/);
});

test('uses honest account copy, lazy GIS setup, and explicit cart corruption recovery', async () => {
  const [account, modal, cart, cartClient, cartStore] = await Promise.all([
    source('src/pages/account.astro'),
    source('src/components/AuthGuardModal.astro'),
    source('src/pages/cart.astro'),
    source('src/lib/cart-client.js'),
    source('src/lib/cart-store.js'),
  ]);

  assert.doesNotMatch(`${account}\n${modal}`, /sync (your )?picks across devices|favorites|quiz results|deal notes|Supabase database/i);
  assert.match(modal, /const ensureGoogleSignIn = async/);
  assert.match(modal, /void ensureGoogleSignIn\(\)/);
  assert.doesNotMatch(modal, /googleSignIn = await registerGoogleCredentialHandler/);
  assert.match(cart, /data-cart-page-recovery/);
  assert.match(cart, /Reset saved list/);
  assert.match(cart, /min-h-11/);
  assert.match(cartClient, /resetCorruptSavedList/);
  assert.match(cartStore, /getRecoveryState/);
  assert.match(cartStore, /hasCorruptSavedList: true/);
});
