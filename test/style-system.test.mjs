import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cssPath = new URL('../src/styles/global.css', import.meta.url);
const homePath = new URL('../src/pages/index.astro', import.meta.url);
const headerPath = new URL('../src/components/Header.astro', import.meta.url);
const accountPath = new URL('../src/pages/account.astro', import.meta.url);
const cartClientPath = new URL('../src/lib/cart-client.js', import.meta.url);

async function stylesheet() {
  return readFile(cssPath, 'utf8');
}

async function source(path) {
  return readFile(path, 'utf8');
}

test('global stylesheet keeps the FlowHome token system and valid comments', async () => {
  const css = await stylesheet();
  assert.match(css, /--fh-color-teal:/);
  assert.match(css, /--fh-focus-ring:/);
  assert.match(css, /--fh-z-modal:/);
  assert.equal((css.match(/\/\*/g) || []).length, (css.match(/\*\//g) || []).length);
  assert.doesNotMatch(css, /FINAL\s+(?:FIX|BUTTON|TEXT)|REPAIR|â€”/i);
});

test('global stylesheet has a bounded override budget and critical component touch targets', async () => {
  const css = await stylesheet();
  assert.ok((css.match(/!important/g) || []).length <= 30, 'third-party CSS exceptions must remain bounded');
  for (const selector of ['.product-card-amazon-action', '.flow-cart-dock__review', '.flow-cart-page-qty']) {
    assert.match(css, new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[^}]*min-(?:height|width): 2\\.75rem`, 's'));
  }
  assert.match(css, /:where\(a, button, input, select, textarea\):focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('cart dock reserves content space only while the dock is visible', async () => {
  const [css, cartClient] = await Promise.all([stylesheet(), source(cartClientPath)]);
  assert.match(css, /body\[data-flow-cart-dock-visible="true"\] main\s*\{[^}]*padding-bottom: calc\(2rem \+ 6\.5rem \+ env\(safe-area-inset-bottom\)\)/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*body\[data-flow-cart-dock-visible="true"\] main\s*\{[^}]*padding-bottom: calc\(2rem \+ 9\.5rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(cartClient, /flowCartDockVisible = String\(Boolean\(dock && quantity > 0\)\)/);
  assert.doesNotMatch(css, /body\s*\{[^}]*padding-bottom:/s);
});

test('hero carousel and mobile menu retain 44px interaction targets', async () => {
  const [home, header] = await Promise.all([source(homePath), source(headerPath)]);
  assert.match(home, /hero-dot group grid h-11 w-11[\s\S]*?<span class:list=\{\["block h-2\.5 rounded-full transition-all group-focus-visible:opacity-80"/);
  assert.match(home, /hero-prev grid h-11 w-11/);
  assert.match(home, /hero-next grid h-11 w-11/);
  assert.match(home, /hero-details-link inline-flex h-11/);
  assert.match(home, /aria-pressed=\{index === 0 \? 'true' : 'false'\}/);
  assert.match(home, /dot\.setAttribute\('aria-pressed', isActive \? 'true' : 'false'\)/);
  assert.match(header, /mobile-menu-btn grid h-11 w-11/);
});

test('hot-deal cards use a gold hover and focus treatment without override debt', async () => {
  const css = await stylesheet();
  const hotDealRules = css.match(/\.product-card--hot-deal:hover[\s\S]*?\.product-card-action-row\.is-details-open/)?.[0] || '';
  assert.match(hotDealRules, /product-card-amazon-action/);
  assert.match(hotDealRules, /product-card-side-action/);
  assert.match(hotDealRules, /#edc24a/);
  assert.match(hotDealRules, /product-card-amazon-action::after/);
  assert.match(hotDealRules, /focus-within/);
  assert.doesNotMatch(hotDealRules, /!important/);
  assert.match(css, /transition: opacity var\(--fh-motion-fast\) ease, transform var\(--fh-motion-slow\) var\(--fh-ease\)/);
});

test('signed-out account flow exposes the existing email mode in the same tab', async () => {
  const account = await source(accountPath);
  assert.match(account, /data-account-google-flow[\s\S]*?href="\/account\/\?mode=email&return=%2Faccount%2F"/);
  assert.match(account, /href="\/account\/\?mode=email&return=%2Faccount%2F"[^>]*min-h-11/);
  assert.match(account, /Continue with email/);
  assert.match(account, /aria-hidden="true">[\s\S]*?or/);
});
