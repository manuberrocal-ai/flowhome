import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');

test('both navigation panels bound their scroll area to the dynamic viewport', () => {
  for (const selector of ['nav-menu', 'mobile-panel']) {
    const rule = header.match(new RegExp(`\\.${selector} \\{([^}]+)\\}`))?.[1];
    assert.ok(rule, selector);
    assert.match(rule, /max-height: calc\(100dvh - 5rem\)/);
    assert.match(rule, /overflow-y: auto/);
    assert.match(rule, /overscroll-behavior-y: contain/);
  }
});

test('desktop navigation exposes disclosure state without claiming application menu roles', () => {
  assert.doesNotMatch(header, /role="menu(?:item)?"/);
  assert.match(header, /aria-controls=\{`desktop-submenu-/);
  assert.match(header, /id=\{`desktop-submenu-/);
  assert.match(header, /menu\.inert = !open/);
  assert.match(header, /link\.setAttribute\('aria-expanded', String\(open\)\)/);
  assert.match(header, /link\.focus\(\);\s*setOpen\(false\)/);
  assert.match(header, /event\.key === 'ArrowDown'/);
  assert.match(header, /\.nav-dropdown:not\(\[data-enhanced\]\):focus-within/);
});

test('mobile submenus are inert initially and synchronize inert with expansion', () => {
  assert.match(header, /class="mobile-submenu"[^>]* inert>/);
  assert.match(header, /aria-controls=\{`mobile-submenu-/);
  assert.match(header, /id=\{`mobile-submenu-/);
  assert.match(header, /submenu\.inert = !isOpen/);
});

test('Escape closes the focused mobile panel and restores its named trigger', () => {
  assert.match(header, /event\.key !== 'Escape'/);
  assert.match(header, /panel\.contains\(document\.activeElement\)/);
  assert.match(header, /button\.setAttribute\('aria-label', willOpen \? 'Close menu' : 'Open menu'\)/);
  assert.match(header, /panel\.hidden = true;[\s\S]*button\.setAttribute\('aria-expanded', 'false'\);[\s\S]*button\.focus\(\)/);
});
