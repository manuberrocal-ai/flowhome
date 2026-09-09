import assert from 'node:assert/strict';
import test from 'node:test';
import { setupCartDock, setupCartPage, syncProductButtons, escapeHtml } from '../src/lib/cart-client.js';
import { createCartStore } from '../src/lib/cart-store.js';

class FakeButton {
  constructor(asin, slug, name) {
    this.dataset = { asin, slug, name };
    this.listeners = new Map();
    this.attributes = new Map();
    this.classList = { values: new Set(), toggle: (name, enabled) => enabled ? this.classList.values.add(name) : this.classList.values.delete(name) };
    this.label = { textContent: '' };
    this.badge = { textContent: '0', hidden: true };
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  removeEventListener(type, listener) { if (this.listeners.get(type) === listener) this.listeners.delete(type); }
  dispatchEvent(event) { this.listeners.get(event.type)?.({ currentTarget: this, target: this }); }
  click() { this.dispatchEvent({ type: 'click' }); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  querySelector(selector) { return selector === '.product-card-side-action-label' ? this.label : this.badge; }
}

test('shortlist accessible names contain visible labels in both toggle states', () => {
  const button = new FakeButton('B012345678', 'sample', 'Sample device');
  const root = { querySelectorAll: () => [button] };
  for (const saved of [false, true, false]) {
    syncProductButtons(saved ? [{ asin: 'B012345678', slug: 'sample' }] : [], root);
    assert.equal(button.label.textContent, saved ? 'Saved' : 'Add to list');
    assert.ok(button.getAttribute('aria-label').startsWith(button.label.textContent + ':'));
    assert.ok(button.getAttribute('aria-label').includes('Sample device'));
    assert.equal(button.getAttribute('aria-pressed'), String(saved));
    if (saved) assert.match(button.getAttribute('aria-label'), /Remove from your FlowHome list/);
  }
});

class FakeDocument extends EventTarget {
  constructor(buttons) {
    super();
    this.buttons = buttons;
    this.datasetMutations = 0;
    this.body = { dataset: new Proxy({}, {
      set: (target, key, value) => { this.datasetMutations += 1; target[key] = value; return true; },
      deleteProperty: (target, key) => { this.datasetMutations += 1; return delete target[key]; },
    }) };
    this.dock = { hidden: true };
    this.count = { textContent: '0' };
  }
  querySelectorAll(selector) { return selector === '[data-flow-cart-add]' ? this.buttons : []; }
  querySelector(selector) {
    if (selector === '[data-flow-cart-dock]') return this.dock;
    if (selector === '[data-flow-cart-count]') return this.count;
    return null;
  }
}

test('sanitizes HTML and synchronizes shortlist buttons through setup once', () => {
  assert.equal(escapeHtml(`<&>"'`), '&lt;&amp;&gt;&quot;&#39;');
  const buttons = [new FakeButton('B012345678', 'same-product', 'Product'), new FakeButton('B012345678', 'same-product', 'Product')];
  const document = new FakeDocument(buttons);
  const storage = { value: null, getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
  const window = new EventTarget();
  window.localStorage = storage;
  window.__flowhomeCartStore = undefined;
  globalThis.document = document;
  globalThis.window = window;
  let visibilityEvents = 0;
  document.addEventListener('flowhome:cart-dock-visibility', () => { visibilityEvents += 1; });

  const cleanup = setupCartDock();
  assert.equal(setupCartDock(), cleanup);
  assert.equal(visibilityEvents, 0);
  assert.equal(document.datasetMutations, 0);
  assert.equal(document.body.dataset.flowCartDockVisible, undefined);
  assert.equal(document.dock.hidden, true);
  assert.equal(document.count.textContent, '0');
  assert.deepEqual(buttons.map((button) => button.attributes.size), [0, 0]);
  buttons[0].click();
  assert.equal(visibilityEvents, 1);
  assert.equal(document.body.dataset.flowCartDockVisible, 'true');
  assert.equal(document.dock.hidden, false);
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['true', 'true']);
  assert.deepEqual(buttons.map((button) => button.label.textContent), ['Saved', 'Saved']);
  buttons[1].click();
  assert.equal(visibilityEvents, 2);
  assert.equal(document.body.dataset.flowCartDockVisible, undefined);
  assert.equal(document.dock.hidden, true);
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['false', 'false']);
  syncProductButtons([{ asin: '', slug: 'same-product', quantity: 1 }], document);
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['true', 'true']);
  cleanup();
  delete globalThis.document;
  delete globalThis.window;
});

test('saved legacy prices never become a current subtotal while selected ASINs still transfer', () => {
  const window = new EventTarget();
  const store = createCartStore({ eventTarget: window });
  window.__flowhomeCartStore = store;
  store.add({ asin: 'B012345678', slug: 'legacy', name: 'Legacy <product>', price: 1234.56, image: '/legacy.png', url: '/product/legacy/' });
  class Anchor {
    constructor() { this.attrs = new Map(); this.classList = { add() {}, remove() {} }; }
    setAttribute(name, value) { this.attrs.set(name, value); }
    removeAttribute(name) { this.attrs.delete(name); }
  }
  const list = { innerHTML: '', addEventListener() {}, removeEventListener() {} };
  const total = { textContent: '' };
  const count = { textContent: '' };
  const buy = new Anchor();
  const document = { querySelector: (selector) => ({
    '[data-cart-page-items]': list, '[data-cart-page-total]': total,
    '[data-cart-page-count]': count, '[data-cart-page-buy]': buy,
  })[selector] ?? null };
  const previous = { document: globalThis.document, window: globalThis.window, HTMLAnchorElement: globalThis.HTMLAnchorElement };
  Object.assign(globalThis, { document, window, HTMLAnchorElement: Anchor });
  let cleanup;
  try {
    cleanup = setupCartPage();
    assert.equal(count.textContent, '1');
    assert.equal(total.textContent, 'Check on Amazon');
    assert.match(list.innerHTML, /Legacy &lt;product&gt;/);
    assert.doesNotMatch(list.innerHTML, /legacy\.png/);
    assert.match(list.innerHTML, /illustrations-v1\/smart-home-device\.webp/);
    assert.match(list.innerHTML, /Category illustration — not a product photo/);
    assert.match(list.innerHTML, /Check current price on Amazon/);
    assert.doesNotMatch(list.innerHTML, /1234\.56|\$|subtotal/i);
    assert.equal(new URL(buy.href).searchParams.get('ASIN.1'), 'B012345678');
    assert.equal(new URL(buy.href).searchParams.get('Quantity.1'), '1');
  } finally {
    cleanup?.();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  }
});
