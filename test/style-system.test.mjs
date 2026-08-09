import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cssPath = new URL('../src/styles/global.css', import.meta.url);
const homePath = new URL('../src/pages/index.astro', import.meta.url);
const heroCarouselPath = new URL('../src/lib/hero-carousel.js', import.meta.url);
const headerPath = new URL('../src/components/Header.astro', import.meta.url);
const accountPath = new URL('../src/pages/account.astro', import.meta.url);
const cartClientPath = new URL('../src/lib/cart-client.js', import.meta.url);
const baseLayoutPath = new URL('../src/layouts/BaseLayout.astro', import.meta.url);
const footerPath = new URL('../src/components/Footer.astro', import.meta.url);
const responsiveLogoPath = new URL('../public/images/flowhome-logo-430.png', import.meta.url);
const seoPath = new URL('../src/lib/seo.ts', import.meta.url);
const packagePath = new URL('../package.json', import.meta.url);

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

test('brand restoration uses optional Latin-only self-hosted fonts and preserves the approved wordmark geometry', async () => {
  const [css, layout, header, footer, seo, pkg] = await Promise.all([
    stylesheet(), source(baseLayoutPath), source(headerPath), source(footerPath), source(seoPath), source(packagePath),
  ]);
  assert.match(layout, /import ['"]\.\.\/styles\/global\.css['"]/);
  assert.doesNotMatch(layout, /@fontsource-variable|fonts\.googleapis\.com/);
  assert.match(pkg, /"@fontsource-variable\/inter": "\^5\.3\.0"/);
  assert.match(pkg, /"@fontsource-variable\/plus-jakarta-sans": "\^5\.3\.0"/);
  assert.match(css, /@font-face\s*\{[\s\S]*font-family:\s*"Inter Variable"[\s\S]*font-display:\s*optional[\s\S]*font-weight:\s*100 900[\s\S]*url\(@fontsource-variable\/inter\/files\/inter-latin-wght-normal\.woff2\)[\s\S]*unicode-range:\s*U\+0000-00FF/);
  assert.match(css, /@font-face\s*\{[\s\S]*font-family:\s*"Plus Jakarta Sans Variable"[\s\S]*font-display:\s*optional[\s\S]*font-weight:\s*200 800[\s\S]*url\(@fontsource-variable\/plus-jakarta-sans\/files\/plus-jakarta-sans-latin-wght-normal\.woff2\)[\s\S]*unicode-range:\s*U\+0000-00FF/);
  assert.match(css, /--font-sans:\s*"Inter Variable"/);
  assert.match(css, /--font-heading:\s*"Plus Jakarta Sans Variable"/);
  for (const sourceText of [css, layout, header, footer, seo]) assert.doesNotMatch(sourceText, /fonts\.googleapis\.com/);
  for (const sourceText of [header, footer]) {
    assert.match(sourceText, /src="\/images\/flowhome-logo\.png"/);
    assert.match(sourceText, /width="1076" height="250"/);
  }
  assert.match(header, /srcset="\/images\/flowhome-logo-430\.png 430w, \/images\/flowhome-logo\.png 1076w" sizes="\(max-width: 404px\) 170px, 195px"/);
  assert.match(footer, /srcset="\/images\/flowhome-logo-430\.png 430w, \/images\/flowhome-logo\.png 1076w" sizes="190px"/);
  assert.match(seo, /logo:\s*'https:\/\/flowhome\.dev\/images\/flowhome-logo\.png'/);
});

test('responsive header logo derivative is an exact 430x100 PNG', async () => {
  const logo = await readFile(responsiveLogoPath);
  assert.equal(logo.toString('ascii', 1, 4), 'PNG');
  assert.equal(logo.readUInt32BE(16), 430);
  assert.equal(logo.readUInt32BE(20), 100);
  assert.ok(logo.length < 41572, 'responsive derivative must be materially smaller than the master');
});

test('global stylesheet has a bounded override budget and critical component touch targets', async () => {
  const css = await stylesheet();
  assert.ok((css.match(/!important/g) || []).length <= 30, 'third-party CSS exceptions must remain bounded');
  for (const selector of ['.product-card-amazon-action', '.flow-cart-dock__review', '.flow-cart-page-remove']) {
    assert.match(css, new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{]*\\{[^}]*min-(?:height|width): 2\\.75rem`, 's'));
  }
  assert.match(css, /:where\(a, button, input, select, textarea\):focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});

test('global control states distinguish enabled, disabled, loading, selected, and error feedback', async () => {
  const css = await stylesheet();
  assert.match(css, /button, \[role="button"\]\) \{ min-width: 2\.75rem; min-height: 2\.75rem/);
  assert.match(css, /:not\(:disabled\):not\(\[aria-disabled="true"\]\) \{ cursor: pointer/);
  assert.match(css, /aria-disabled="true"\] \{ cursor: not-allowed/);
  assert.match(css, /aria-busy="true"\] \{ cursor: progress/);
  assert.match(css, /data-quiz-save\]\)\[aria-pressed="true"\]/);
  assert.match(css, /aria-invalid="true"/);
});

test('keyboard users can bypass repeated navigation and focus the main landmark', async () => {
  const [css, layout] = await Promise.all([stylesheet(), source(baseLayoutPath)]);
  assert.match(layout, /<a class="skip-link" href="#main-content">Skip to main content<\/a>/);
  assert.match(layout, /<main id="main-content" tabindex="-1"/);
  assert.match(css, /\.skip-link \{[\s\S]*transform: translateY\(-150%\)/);
  assert.match(css, /\.skip-link:focus-visible \{ transform: translateY\(0\); \}/);
});

test('cart dock reserves content space only while the dock is visible', async () => {
  const [css, cartClient] = await Promise.all([stylesheet(), source(cartClientPath)]);
  assert.match(css, /body\[data-flow-cart-dock-visible="true"\]\s*\{[^}]*padding-bottom: calc\(6\.5rem \+ env\(safe-area-inset-bottom\)\)/s);
  assert.match(css, /@media \(max-width: 640px\)\s*\{[\s\S]*body\[data-flow-cart-dock-visible="true"\]\s*\{[^}]*padding-bottom: calc\(9\.5rem \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(cartClient, /if \(visible\) document\.body\.dataset\.flowCartDockVisible = 'true';/);
  assert.match(cartClient, /else delete document\.body\.dataset\.flowCartDockVisible;/);
  assert.doesNotMatch(css, /body\[data-flow-cart-dock-visible="true"\] main/);
});

test('hero carousel and mobile menu retain 44px interaction targets', async () => {
  const [home, header, heroCarousel] = await Promise.all([source(homePath), source(headerPath), source(heroCarouselPath)]);
  assert.match(home, /hero-dot group grid h-11 w-11[\s\S]*?<span class:list=\{\["block h-2\.5 rounded-full transition-all group-focus-visible:opacity-80"/);
  assert.match(home, /hero-prev grid h-11 w-11/);
  assert.match(home, /hero-next grid h-11 w-11/);
  assert.match(home, /hero-details-link inline-flex h-11/);
  assert.match(home, /aria-pressed=\{index === 0 \? 'true' : 'false'\}/);
  assert.match(heroCarousel, /setAttribute\('aria-pressed', String\(selected\)\)/);
  assert.doesNotMatch(home, /data-hero-slide=\{index\}/);
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
