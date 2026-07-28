import assert from 'node:assert/strict';
import test from 'node:test';
import { setupCartDock, syncProductButtons, escapeHtml } from '../src/lib/cart-client.js';

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

class FakeDocument extends EventTarget {
  constructor(buttons) {
    super();
    this.buttons = buttons;
    this.body = { dataset: {} };
  }
  querySelectorAll(selector) { return selector === '[data-flow-cart-add]' ? this.buttons : []; }
  querySelector(selector) {
    if (selector === '[data-flow-cart-dock]') return { hidden: true };
    if (selector === '[data-flow-cart-count]') return { textContent: '0' };
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

  const cleanup = setupCartDock();
  assert.equal(setupCartDock(), cleanup);
  buttons[0].click();
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['true', 'true']);
  assert.deepEqual(buttons.map((button) => button.label.textContent), ['Saved', 'Saved']);
  buttons[1].click();
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['false', 'false']);
  syncProductButtons([{ asin: '', slug: 'same-product', quantity: 1 }], document);
  assert.deepEqual(buttons.map((button) => button.getAttribute('aria-pressed')), ['true', 'true']);
  cleanup();
  delete globalThis.document;
  delete globalThis.window;
});
