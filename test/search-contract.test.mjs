import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSearchContract } from '../scripts/qa/search-contract.mjs';
import { viewportCases } from '../scripts/qa/viewport-cases.mjs';

function fixture(defect) {
  const products = Array.from({ length: 28 }, (_, i) => ({ name: `Product ${String(i).padStart(2, '0')}` }));
  let visible = [];
  const empty = { hidden: true };
  const status = { textContent: '', getAttribute: () => defect === 'status' ? null : 'status' };
  const input = { value: '', dispatchEvent: render };
  const grid = { dataset: { searchProducts: JSON.stringify(products) }, querySelector: () => null,
    querySelectorAll: () => visible.map(product => ({ querySelector: () => ({ textContent: product.name }) })) };
  const clear = { click: () => { if (defect === 'clear') return; input.value = ''; render(); doc.activeElement = input; } };
  const nodes = { '#site-search': input, '#search-results': grid, '#search-status': status, '#search-empty': empty, '#search-clear': clear };
  const doc = { querySelector: selector => nodes[selector], activeElement: null };
  function render() {
    const query = input.value.trim().toLowerCase();
    visible = products.filter(product => product.name.toLowerCase().includes(query));
    if (defect === 'cap') visible = visible.slice(0, 24);
    if (defect === 'identity' && visible.length > 1) visible[1] = visible[0];
    if (defect === 'last' && query === 'product 27') visible = [];
    empty.hidden = defect === 'empty' || visible.length > 0;
    status.textContent = query ? `${visible.length} products found.` : `Showing all ${visible.length} products.`;
  }
  return doc;
}

test('search contract accepts complete results and recovery', () => {
  assert.deepEqual(inspectSearchContract(fixture(), Event), { products: 28, failures: [] });
});
for (const defect of ['cap', 'identity', 'last', 'empty', 'clear', 'status']) {
  test(`search contract detects ${defect} regression`, () => {
    assert.ok(inspectSearchContract(fixture(defect), Event).failures.length > 0);
  });
}
test('search contracts run at all seven full widths and both daily widths', () => {
  for (const [profile, count] of [['full', 7], ['weekly', 7], ['daily', 2]]) {
    const cases = viewportCases(profile).filter(item => item.path === '/search/');
    assert.equal(cases.length, count);
    assert.ok(cases.every(item => item.setup === 'search'));
  }
});
