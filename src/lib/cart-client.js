import { buildAmazonCartUrl, getCartQuantity, getUniqueItemCount, getCartStore, getCartSubtotal } from './cart-store.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

const SAVED_LABEL = 'Saved';
const REMOVE_LABEL = 'Remove';
const ADD_LABEL = 'Add to list';
const cartDockSetups = new WeakMap();
const cartPageSetups = new WeakMap();

export function syncProductButtons(items, root = document) {
  const savedIds = new Set(items.filter((item) => item.quantity > 0).flatMap((item) => [item.asin, item.slug].filter(Boolean)));
  root.querySelectorAll('[data-flow-cart-add]').forEach((button) => {
    const asin = button.dataset.asin?.toUpperCase();
    const isSaved = Boolean((asin && savedIds.has(asin)) || (button.dataset.slug && savedIds.has(button.dataset.slug)));
    button.classList.toggle('is-added', isSaved);
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute('aria-label', isSaved
      ? `Remove ${button.dataset.name ?? 'this product'} from your FlowHome list`
      : `Add ${button.dataset.name ?? 'this product'} to your FlowHome list`);
    button.setAttribute('title', isSaved ? REMOVE_LABEL : ADD_LABEL);
    // Update visible label when the button exposes a text label next to the icon.
    const label = button.querySelector('.product-card-side-action-label');
    if (label) {
      label.textContent = isSaved ? SAVED_LABEL : ADD_LABEL;
      // On compact ProductCard buttons the "Saved" copy is short, so render
      // the state visually without changing layout under small viewports.
      const countBadge = button.querySelector('.flow-cart-button-count');
      if (countBadge) {
        countBadge.textContent = isSaved ? '1' : '0';
        countBadge.hidden = !isSaved;
      }
    }
  });
}

export function setupCartDock() {
  const existingSetup = cartDockSetups.get(document);
  if (existingSetup) return existingSetup.cleanup;
  const store = getCartStore();
  const dock = document.querySelector('[data-flow-cart-dock]');
  const count = document.querySelector('[data-flow-cart-count]');
  const clearButton = document.querySelector('[data-flow-cart-clear]');
  const sync = (items) => {
    const quantity = getUniqueItemCount(items);
    if (count) count.textContent = String(quantity);
    if (dock) dock.hidden = quantity === 0;
    document.body.dataset.flowCartDockVisible = String(Boolean(dock && quantity > 0));
    document.dispatchEvent(new CustomEvent('flowhome:cart-dock-visibility', { detail: { visible: Boolean(dock && quantity > 0) } }));
    syncProductButtons(items);
  };

  // Toggle is the single state transition for shortlist buttons.
  const onAdd = (event) => {
    const button = event.currentTarget;
    store.toggle({
      asin: button.dataset.asin,
      slug: button.dataset.slug,
      name: button.dataset.name,
      price: button.dataset.price,
      image: button.dataset.image,
      url: button.dataset.url,
    });
  };
  const addButtons = [...document.querySelectorAll('[data-flow-cart-add]')];
  addButtons.forEach((button) => button.addEventListener('click', onAdd));
  const onClear = () => store.clear();
  clearButton?.addEventListener('click', onClear);
  sync(store.initialize());
  const unsubscribe = store.subscribe(sync);
  const cleanup = () => {
    addButtons.forEach((button) => button.removeEventListener('click', onAdd));
    clearButton?.removeEventListener('click', onClear);
    unsubscribe();
    cartDockSetups.delete(document);
  };
  cartDockSetups.set(document, { cleanup });
  return cleanup;
}

export function setupCartPage() {
  const existingSetup = cartPageSetups.get(document);
  if (existingSetup) return existingSetup.cleanup;
  const store = getCartStore();
  const list = document.querySelector('[data-cart-page-items]');
  const empty = document.querySelector('[data-cart-page-empty]');
  const count = document.querySelector('[data-cart-page-count]');
  const total = document.querySelector('[data-cart-page-total]');
  const buy = document.querySelector('[data-cart-page-buy]');
  const clear = document.querySelector('[data-cart-page-clear]');
  const feedback = document.querySelector('[data-cart-page-feedback]');
  const recovery = document.querySelector('[data-cart-page-recovery]');
  const resetSavedList = document.querySelector('[data-cart-page-reset-saved-list]');

  const render = (items) => {
    const totalQuantity = getCartQuantity(items);
    const uniqueCount = getUniqueItemCount(items);
    if (count) count.textContent = String(uniqueCount);
    if (total) total.textContent = formatMoney(getCartSubtotal(items));
    if (empty) empty.hidden = items.length > 0;
    if (recovery) recovery.hidden = !store.getRecoveryState().hasCorruptSavedList;
    if (feedback) feedback.textContent = items.length
      ? `${uniqueCount} product${uniqueCount === 1 ? '' : 's'}${totalQuantity > uniqueCount ? ` (${totalQuantity} units)` : ''} ready to open on Amazon.`
      : 'Your list is empty. Add products before opening Amazon.';
    if (buy instanceof HTMLAnchorElement) {
      const destination = buildAmazonCartUrl(items);
      if (destination) {
        buy.href = destination;
        buy.removeAttribute('aria-disabled');
        buy.removeAttribute('tabindex');
        buy.classList.remove('is-disabled');
      } else {
        buy.removeAttribute('href');
        buy.setAttribute('aria-disabled', 'true');
        buy.setAttribute('tabindex', '-1');
        buy.classList.add('is-disabled');
      }
    }
    if (!list) return;
    list.innerHTML = items.map((item) => {
      const productUrl = item.url || `/product/${item.slug}/`;
      return `<article class="flow-cart-page-item" data-asin="${escapeHtml(item.asin || item.slug)}">
        <a href="${escapeHtml(productUrl)}" class="flow-cart-page-item__image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async"></a>
        <div class="min-w-0">
          <a href="${escapeHtml(productUrl)}" class="flow-cart-page-item__name">${escapeHtml(item.name)}</a>
          <p class="mt-1 text-sm font-bold text-slate-500">${formatMoney(item.price)} each</p>
          <div class="flow-cart-page-item__controls mt-3">
            <button type="button" class="flow-cart-page-qty" data-cart-page-decrease aria-label="Decrease quantity">&minus;</button>
            <span class="flow-cart-page-qty-value" aria-label="Quantity ${item.quantity}">${item.quantity}</span>
            <button type="button" class="flow-cart-page-qty" data-cart-page-increase aria-label="Increase quantity">+</button>
            <button type="button" class="flow-cart-page-remove" data-cart-page-remove>Remove</button>
          </div>
        </div>
        <strong class="flow-cart-page-item__line">${formatMoney(item.price * item.quantity)}</strong>
      </article>`;
    }).join('');
  };

  const onListClick = (event) => {
    const target = event.target.closest('button');
    const asin = target?.closest('[data-asin]')?.dataset.asin;
    if (!target || !asin) return;
    if (target.matches('[data-cart-page-increase]')) store.increment(asin);
    else if (target.matches('[data-cart-page-decrease]')) store.decrement(asin);
    else if (target.matches('[data-cart-page-remove]')) store.remove(asin);
  };
  list?.addEventListener('click', onListClick);
  const onClear = () => store.clear();
  clear?.addEventListener('click', onClear);
  const onReset = () => {
    const reset = store.resetCorruptSavedList();
    render(store.getItems());
    if (!reset && feedback) feedback.textContent = 'We could not reset the saved list. Please check your browser storage and try again.';
  };
  resetSavedList?.addEventListener('click', onReset);
  render(store.initialize());
  const unsubscribe = store.subscribe(render);
  const cleanup = () => {
    list?.removeEventListener('click', onListClick);
    clear?.removeEventListener('click', onClear);
    resetSavedList?.removeEventListener('click', onReset);
    unsubscribe();
    cartPageSetups.delete(document);
  };
  cartPageSetups.set(document, { cleanup });
  return cleanup;
}
