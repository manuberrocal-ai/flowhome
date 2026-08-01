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
