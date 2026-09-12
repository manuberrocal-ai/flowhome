import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const header = read('src/components/Header.astro');
const profile = read('src/pages/product/[slug].astro');
const layout = read('src/layouts/ProductLayout.astro');
const deals = read('src/pages/deals/index.astro');

test('mobile submenus change layout immediately while panel and chevron motion remain reduced-motion aware', () => {
  const submenu = header.match(/\.mobile-submenu\s*\{([^}]+)\}/)?.[1];
  assert.ok(submenu);
  assert.match(submenu, /transition:\s*none;/);
  assert.doesNotMatch(header, /transition:[^;]*(?:max-height|padding-bottom)/);
  assert.match(header, /\.mobile-nav-group\.is-open \.mobile-submenu\s*\{ max-height: 42rem; padding-bottom: 0\.55rem; \}/);
  assert.match(header, /\.mobile-chevron \{ transition: transform 180ms ease; \}/);
  assert.match(header, /@keyframes mobileMenuDown \{ from \{ opacity: 0; transform: translateY\(-8px\); \}/);
  assert.match(header, /if \(submenu\) submenu\.inert = !isOpen/);
  assert.match(read('src/styles/global.css'), /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: \.01ms !important;[\s\S]*transition-duration: \.01ms !important;/);
});

test('conditional avatar placeholders stay hidden without a source and recover after an image error', () => {
  const placeholders = header.match(/<img\b[^>]*class="data-header-avatar-img[^>]*>/g) ?? [];
  assert.equal(placeholders.length, 2);
  for (const tag of placeholders) {
    assert.match(tag, /\bhidden\b/);
    assert.doesNotMatch(tag, /\bsrc=/);
  }
  const code = header.match(/const renderAvatar = [\s\S]*?(?=\s+const syncAvatar =)/)?.[0];
  assert.ok(code);
  const images = Array.from({ length: 2 }, () => ({
    hidden: true,
    removeAttribute(name) { delete this[name]; },
    addEventListener(name, callback) { assert.equal(name, 'error'); this.onError = callback; },
  }));
  const initials = Array.from({ length: 2 }, () => ({ hidden: true, textContent: '' }));
  const defaults = Array.from({ length: 2 }, () => ({ classList: { toggle() {}, add() {} } }));
  const context = {
    state: { getUserInitials: () => 'FH' },
    document: { querySelectorAll: selector => ({ '.data-header-avatar-img': images, '.data-header-avatar-default': defaults, '.data-header-avatar-initials': initials })[selector] },
  };
  runInNewContext(stripTypeScriptTypes(code) + '\nthis.renderAvatar = renderAvatar;', context);
  context.renderAvatar(null);
  assert.ok(images.every(image => image.hidden && image.src === undefined));
  context.renderAvatar({ user_metadata: {} });
  assert.ok(images.every(image => image.hidden && image.src === undefined));
  assert.ok(initials.every(initial => !initial.hidden && initial.textContent === 'FH'));
  context.renderAvatar({ user_metadata: { avatar_url: 'https://example.test/avatar.png' } });
  assert.ok(images.every(image => !image.hidden && image.src === 'https://example.test/avatar.png'));
  images[0].onError();
  assert.ok(images.every(image => image.hidden && image.src === undefined));
  assert.ok(initials.every(initial => !initial.hidden && initial.textContent === 'FH'));
});

test('saved-list header count follows local store updates without taking the dock count hook', () => {
  const counterCode = header.match(/const listStore = getCartStore\(\);[\s\S]*?document\.addEventListener\('astro:page-load', renderListCount\);/)?.[0];
  assert.ok(counterCode);
  let items = [];
  let update;
  let onNavigation;
  const count = { textContent: '0', hidden: true };
  const dockCount = { textContent: 'unchanged' };
  runInNewContext(stripTypeScriptTypes(counterCode), {
    getCartStore: () => ({ getItems: () => items, subscribe: (callback) => { update = callback; } }),
    getUniqueItemCount: (values) => new Set(values.map(item => item.asin)).size,
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '[data-header-list-count]');
        return [count];
      },
      addEventListener(name, callback) {
        assert.equal(name, 'astro:page-load');
        onNavigation = callback;
      },
    },
  });
  assert.equal(count.hidden, true);
  items = [{ asin: 'B08J4C8871' }, { asin: 'B09XXTQP3B' }];
  update();
  assert.equal(count.textContent, '2');
  assert.equal(count.hidden, false);
  items = [];
  onNavigation();
  assert.equal(count.textContent, '0');
  assert.equal(count.hidden, true);
  assert.equal(dockCount.textContent, 'unchanged');
  assert.doesNotMatch(header, /<[^>]+\bdata-flow-cart-count\b/);
});

test('profile can save the actual main product and only links to available curated comparisons', () => {
  const save = profile.match(/<button\b[^>]*data-flow-cart-add[\s\S]*?<\/button>/)?.[0];
  assert.ok(save);
  for (const field of ['asin', 'slug', 'name']) assert.ok(save.includes(`data-${field}={data.${field}}`));
  assert.match(save, /data-image=\{productImage\}/);
  assert.ok(save.includes('data-url={`/product/${data.slug}/`}'));
  assert.match(save, /aria-pressed="false"/);
  assert.match(save, /product-card-side-action-label">Add to list/);
  assert.match(profile, /comparisonConfigs\.filter\(\(comparison\) => comparison\.slugs\.includes\(data\.slug\)/);
  assert.match(profile, /comparison\.slugs\.every\([\s\S]*entry\.data\.catalogActive/);
  assert.ok(profile.includes('href={`/compare/${comparison.slugs.join(\'-vs-\')}/`}'));
  assert.match(profile, /data-fh-track="compare_open"/);
});

test('profile prioritizes documentary buying context while keeping its complete conditions and source dates', () => {
  assert.ok(profile.indexOf('id="buying-context"') < profile.indexOf('data-product-setup-preview'));
  assert.ok(profile.indexOf('id="buying-context"') < profile.indexOf('data-product-feature'));
  assert.equal((profile.match(/id="buying-context"/g) || []).length, 1);
  for (const expression of ['decision.useCase', 'decision.reconsiderIf', 'decision.sources.map', 'source.accessedAt']) assert.ok(profile.includes(expression));
  assert.match(profile, /<ProductLayout product=\{data\} compactPurchasePanel>/);
  assert.match(layout, /compactPurchasePanel = false/);
  assert.match(layout, /!compactPurchasePanel && <div/);
});

test('empty deals recover to research and the saved list without changing promotion gates', () => {
  assert.match(deals, /data-deals-empty/);
  assert.match(deals, /href="\/products\/"/);
  assert.match(deals, /href="\/cart\/"/);
  assert.match(deals, /href="\/compare\/"/);
  assert.match(deals, /entry\.status === 'active'/);
  assert.match(deals, /getCommerceData\(product\.data, now\)\.showPromotion/);
  assert.doesNotMatch(header, /today-deals-link|Today's deals|See today's deals/);
  assert.match(header, /label: 'Deals', href: '\/deals\/'/);
});
