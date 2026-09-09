// Serialized into the isolated browser by browser-smoke; keep dependencies explicit.
export function inspectSearchContract(doc, EventConstructor) {
  const input = doc.querySelector('#site-search');
  const grid = doc.querySelector('#search-results');
  const status = doc.querySelector('#search-status');
  const empty = doc.querySelector('#search-empty');
  const clear = doc.querySelector('#search-clear');
  if (!input || !grid || !status || !empty || !clear) throw new Error('Search controls are missing');
  const products = JSON.parse(grid.dataset.searchProducts);
  if (!Array.isArray(products) || !products.length) throw new Error('Search dataset is empty');
  const cards = () => [...grid.querySelectorAll('article')];
  const change = value => {
    input.value = value;
    input.dispatchEvent(new EventConstructor('input', { bubbles: true }));
  };
  const failures = [];
  change('');
  if (cards().length !== products.length) failures.push('Search truncates the catalog');
  const names = cards().map(card => card.querySelector('h2')?.textContent);
  if (new Set(names).size !== products.length || products.some(product => !names.includes(product.name))) failures.push('Search product identities differ from its dataset');
  if (status.textContent !== `Showing all ${products.length} products.` || status.getAttribute('role') !== 'status') failures.push('Search total is not announced');
  // Exercise the final record: the former 24-result cap must not hide it.
  const last = products.at(-1);
  change(`  ${last.name.toUpperCase()}  `);
  if (!cards().some(card => card.querySelector('h2')?.textContent === last.name) || !empty.hidden) failures.push('Search cannot find the final product');
  change('__flowhome_no_matching_product_qa__');
  if (cards().length || empty.hidden || status.textContent !== '0 products found.') failures.push('Search empty state is incorrect');
  if (grid.querySelector('script')) failures.push('Unexpected executable search result');
  clear.click();
  if (input.value !== '' || cards().length !== products.length || !empty.hidden || doc.activeElement !== input) failures.push('Search clear does not restore results and focus');
  return { products: products.length, failures };
}
