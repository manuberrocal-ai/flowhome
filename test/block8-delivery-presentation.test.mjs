import assert from 'node:assert/strict';
import test from 'node:test';
import { mountCommercePresentation } from '../src/lib/blocks/block8/delivery-presentation.ts';
import { mountProductCommerce } from '../src/lib/blocks/block8/product-presentation.ts';
import { mountCatalogCommerce } from '../src/lib/blocks/block8/catalog-presentation.ts';

test('commerce presentation stays inert without explicit enablement', async () => {
  for (const enabled of [undefined, false, 'true', 1]) {
    const mounted = mountCommercePresentation(null, null, { enabled });
    assert.equal(await mounted.refresh(), false);
    assert.doesNotThrow(() => mounted.dispose());
    assert.equal(await mountProductCommerce(null, null, { enabled }).refresh(), false);
    assert.equal(await mountCatalogCommerce(null, { enabled }).refresh(), false);
  }
});

test('product integration rejects invalid, missing and mixed identities before touching DOM', () => {
  const options = { enabled: true };
  assert.throws(() => mountProductCommerce(null, 'invalid', options), /Invalid commerce identity/);
  for (const panels of [[], [{ dataset: { commerceObservation: 'B000000000' } }]]) {
    assert.throws(() => mountProductCommerce({ querySelectorAll: () => panels }, 'B0FIXTUR01', options), /Mismatched commerce presentation identity/);
  }
});

test('all bound text is withdrawn on lifecycle invalidation and cleanup', async () => {
  const win = new EventTarget(); win.navigator = { onLine: true };
  const doc = new EventTarget(); doc.defaultView = win; doc.visibilityState = 'visible';
  const element = () => Object.assign(new EventTarget(), { ownerDocument: doc, textContent: '', setAttribute() {} });
  const slots = Array.from({ length: 2 }, () => ({ price: element(), source: element(), availability: element() }));
  const elements = { slots, status: element(), refresh: element() };
  let calls = 0;
  let release;
  let held = false;
  const mounted = mountCommercePresentation(elements, 'B0FIXTUR01', { enabled: true, endpoint: '/test', pageUrl: 'https://flowhome.dev/', fetch: async () => {
    calls++;
    if (held) await new Promise(resolve => { release = resolve; });
    return Response.json({ status: 'available', asin: 'B0FIXTUR01', market: 'US', currency: 'USD', serverTime: '2026-09-08T00:00:00Z', validUntil: '2026-09-08T00:01:00Z', price: { value: 123.45, capturedAt: '2026-09-08T00:00:00Z', expiresAt: '2026-09-08T00:01:00Z' } }, { headers: { 'cache-control': 'no-store' } });
  } });
  const empty = () => { for (const slot of slots) for (const node of Object.values(slot)) assert.equal(node.textContent, ''); };
  try {
    empty(); assert.equal(calls, 0);
    assert.equal(await mounted.refresh(), true);
    for (const slot of slots) { assert.equal(slot.price.textContent, '$123.45'); assert.match(slot.source.textContent, /Captured/); assert.equal(slot.availability.textContent, ''); }
    win.dispatchEvent(new Event('pagehide')); empty();
    win.dispatchEvent(new Event('pageshow')); empty(); assert.equal(calls, 1);
    held = true;
    const pending = mounted.refresh();
    assert.equal(elements.refresh.disabled, false);
    assert.equal(await mounted.refresh(), false);
    assert.equal(calls, 2);
    release(); assert.equal(await pending, true);
    mounted.dispose(); empty(); assert.equal(elements.refresh.disabled, true);
    assert.equal(await mounted.refresh(), false); assert.equal(calls, 2);
  } finally { mounted.dispose(); }
});
