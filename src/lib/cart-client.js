import { buildAmazonCartUrl, getCartQuantity, getCartStore, getCartSubtotal } from './cart-store.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function formatMoney(value) {
  return `$${Number(value).toFixed(2)}`;
}

function syncProductButtons(items) {
  document.querySelectorAll('[data-flow-cart-add]').forEach((button) => {
    const item = items.find((entry) => entry.asin === button.dataset.asin?.toUpperCase());
    const quantity = item?.quantity ?? 0;
    const badge = button.querySelector('[data-flow-cart-item-count]');
    button.classList.toggle('is-added', quantity > 0);
    button.setAttribute('aria-pressed', String(quantity > 0));
    button.setAttribute('title', quantity > 0 ? `Add another (${quantity} selected)` : 'Add to list');
    if (badge) {
      badge.textContent = String(quantity);
      badge.hidden = quantity === 0;
    }
  });
}

export function setupCartDock() {
  const store = getCartStore();
  const dock = document.querySelector('[data-flow-cart-dock]');
  const count = document.querySelector('[data-flow-cart-count]');
  const clearButton = document.querySelector('[data-flow-cart-clear]');
  const sync = (items) => {
    const quantity = getCartQuantity(items);
    if (count) count.textContent = String(quantity);
    if (dock) dock.hidden = quantity === 0;
    document.body.dataset.flowCartDockVisible = String(Boolean(dock && quantity > 0));
    document.dispatchEvent(new CustomEvent('flowhome:cart-dock-visibility', { detail: { visible: Boolean(dock && quantity > 0) } }));
    syncProductButtons(items);
  };

  document.querySelectorAll('[data-flow-cart-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const items = store.add({
        asin: button.dataset.asin,
        slug: button.dataset.slug,
        name: button.dataset.name,
        price: button.dataset.price,
        image: button.dataset.image,
        url: button.dataset.url,
      });
      if (items.some((item) => item.asin === button.dataset.asin?.toUpperCase())) {
        window.gtag?.('event', 'flowhome_list_add', { asin: button.dataset.asin, product_slug: button.dataset.slug || '' });
      }
    });
  });
  clearButton?.addEventListener('click', () => store.clear());
  sync(store.initialize());
  return store.subscribe(sync);
}

export function setupCartPage() {
  const store = getCartStore();
  const list = document.querySelector('[data-cart-page-items]');
  const empty = document.querySelector('[data-cart-page-empty]');
  const count = document.querySelector('[data-cart-page-count]');
  const total = document.querySelector('[data-cart-page-total]');
  const buy = document.querySelector('[data-cart-page-buy]');
  const clear = document.querySelector('[data-cart-page-clear]');
  const feedback = document.querySelector('[data-cart-page-feedback]');

  const render = (items) => {
    const totalQuantity = getCartQuantity(items);
    if (count) count.textContent = String(totalQuantity);
    if (total) total.textContent = formatMoney(getCartSubtotal(items));
    if (empty) empty.hidden = items.length > 0;
    if (feedback) feedback.textContent = items.length ? `${totalQuantity} item${totalQuantity === 1 ? '' : 's'} ready to open on Amazon.` : 'Your list is empty. Add products before opening Amazon.';
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
      return `<article class="flow-cart-page-item" data-asin="${escapeHtml(item.asin)}">
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

  list?.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    const asin = target?.closest('[data-asin]')?.dataset.asin;
    if (!target || !asin) return;
    if (target.matches('[data-cart-page-increase]')) store.increment(asin);
    else if (target.matches('[data-cart-page-decrease]')) store.decrement(asin);
    else if (target.matches('[data-cart-page-remove]')) store.remove(asin);
  });
  clear?.addEventListener('click', () => store.clear());
  render(store.initialize());
  return store.subscribe(render);
}
