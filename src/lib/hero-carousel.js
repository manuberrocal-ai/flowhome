const instances = new WeakMap();

export function normalizeProduct(product) {
  return {
    id: String(product.id ?? product.slug),
    slug: String(product.slug),
    title: String(product.title ?? product.name ?? ''),
    image: String(product.image ?? ''),
    alt: String(product.alt ?? product.title ?? product.name ?? ''),
    price: product.price,
    priceLabel: String(product.priceLabel ?? `$${product.price}`),
    originalPrice: product.originalPrice ?? null,
    rating: product.ownerRating ?? 0,
    ratingCount: product.ownerRatingCount ?? 0,
    ratingSource: String(product.ratingSource ?? 'Amazon customer rating'),
    priceContext: String(product.priceContext ?? 'Historical price snapshot'),
    badges: Array.isArray(product.badges) ? product.badges : [],
    detailsUrl: String(product.detailsUrl ?? `/product/${product.slug}/`),
    amazonUrl: String(product.amazonUrl ?? ''),
    affiliateDisclosure: String(product.affiliateDisclosure ?? ''),
    category: String(product.category ?? ''),
    discountPct: product.discountPct ?? 0,
    quote: String(product.quote ?? ''),
  };
}

function setText(root, name, value) {
  const node = root.querySelector(`[data-hero-field="${name}"]`);
  if (node) node.textContent = value == null ? '' : String(value);
  return node;
}

export function applyProduct(root, product, index = 0) {
  const item = normalizeProduct(product);
  const image = root.querySelector('[data-hero-image]');
  if (image) {
    image.src = item.image;
    image.alt = item.alt;
  }
  const photoLink = root.querySelector('[data-hero-photo-link]');
  if (photoLink) { photoLink.href = item.detailsUrl; photoLink.setAttribute('aria-label', `View ${item.title}`); }
  setText(root, 'title', item.title);
  setText(root, 'category', item.category);
  setText(root, 'price', item.priceLabel);
  setText(root, 'price-context', item.priceContext);
  const original = setText(root, 'original-price', item.originalPrice == null ? '' : `$${item.originalPrice}`);
  original?.toggleAttribute('hidden', item.originalPrice == null);
  setText(root, 'rating', item.rating);
  setText(root, 'rating-count', item.ratingCount.toLocaleString?.() ?? item.ratingCount);
  setText(root, 'rating-source', item.ratingSource);
  const stars = Array.from(root.querySelectorAll?.('[data-hero-star]') ?? []);
  root.querySelector('[data-hero-rating-stars]')?.setAttribute('aria-label', `Amazon customer rating ${item.rating} out of 5 stars`);
  stars.forEach((star, starIndex) => {
    const active = starIndex < Math.round(item.rating);
    star.classList.toggle('text-amber-300', active);
    star.classList.toggle('text-slate-600', !active);
  });
  const discount = setText(root, 'discount', item.discountPct > 0 ? `Save ${item.discountPct}%` : '');
  discount?.toggleAttribute('hidden', item.discountPct <= 0);
  setText(root, 'quote', `"${item.quote}"`);

  const badges = root.querySelector('[data-hero-field="badges"]');
  if (badges) {
    while (badges.firstChild) badges.removeChild(badges.firstChild);
    item.badges.forEach((badge) => {
      const node = root.ownerDocument.createElement('span');
      node.textContent = String(badge);
      badges.append(node);
    });
  }

  const details = root.querySelector('[data-hero-details]');
  if (details) details.href = item.detailsUrl;
  const amazon = root.querySelector('[data-hero-amazon]');
  if (amazon) {
    amazon.href = item.amazonUrl;
    amazon.setAttribute('aria-label', `Check ${item.title} price on Amazon`);
    amazon.dataset.productSlug = item.slug;
    amazon.dataset.category = item.category;
    amazon.dataset.discount = String(item.discountPct);
    amazon.dataset.affiliateDisclosure = item.affiliateDisclosure;
  }
  const indicator = root.querySelector('[data-hero-indicator]');
  if (indicator) indicator.textContent = `${index + 1}`;
  return item;
}

export function setupHeroCarousel({ root, products, windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  if (!root || !products?.length) return () => {};
  instances.get(root)?.();
  const items = products.map(normalizeProduct);
  const article = root.querySelector('[data-hero-slide]');
  const dots = Array.from(documentRef.querySelectorAll('[data-hero-dot]'));
  const prev = documentRef.querySelector('.hero-prev');
  const next = documentRef.querySelector('.hero-next');
  const media = windowRef.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = null;
  let interacted = false;

  const stop = () => {
    interacted = true;
    if (timer) windowRef.clearInterval(timer);
    timer = null;
  };
  const render = (index, announce = false) => {
    active = (index + items.length) % items.length;
    applyProduct(root, items[active], active);
    dots.forEach((dot, dotIndex) => {
      const selected = dotIndex === active;
      dot.setAttribute('aria-pressed', String(selected));
      dot.setAttribute('aria-current', String(selected));
      const indicator = dot.firstElementChild;
      indicator?.classList.toggle('w-8', selected);
      indicator?.classList.toggle('w-2.5', !selected);
      indicator?.classList.toggle('bg-orange-500', selected);
      indicator?.classList.toggle('bg-slate-300', !selected);
    });
    if (announce) {
      const live = root.querySelector('[data-hero-live]');
      if (live) live.textContent = `Selected ${items[active].title}`;
    }
  };
  const start = () => {
    if (!interacted && !media.matches && documentRef.visibilityState !== 'hidden' && items.length > 1 && !timer) {
      timer = windowRef.setInterval(() => render(active + 1), 4300);
    }
  };
  const onManual = (callback) => { stop(); callback(); };
  const listeners = [];
  const listen = (target, event, handler, options) => { target?.addEventListener(event, handler, options); listeners.push(() => target?.removeEventListener(event, handler, options)); };

  render(0);
  dots.forEach((dot, index) => listen(dot, 'click', () => onManual(() => render(index, true))));
  listen(prev, 'click', () => onManual(() => render(active - 1, true)));
  listen(next, 'click', () => onManual(() => render(active + 1, true)));
  listen(article, 'keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); onManual(() => render(active - 1, true)); }
    if (event.key === 'ArrowRight') { event.preventDefault(); onManual(() => render(active + 1, true)); }
    if (event.key === 'Home') { event.preventDefault(); onManual(() => render(0, true)); }
    if (event.key === 'End') { event.preventDefault(); onManual(() => render(items.length - 1, true)); }
  });
  listen(article, 'pointerdown', stop);
  listen(article, 'focusin', stop);
  listen(documentRef, 'visibilitychange', () => { if (documentRef.visibilityState === 'hidden') { if (timer) windowRef.clearInterval(timer); timer = null; } else start(); });
  listen(media, 'change', () => { root.dataset.reducedMotion = String(media.matches); if (media.matches && timer) { windowRef.clearInterval(timer); timer = null; } else start(); });
  root.dataset.reducedMotion = String(media.matches);
  start();

  const cleanup = () => { if (timer) windowRef.clearInterval(timer); listeners.splice(0).forEach((remove) => remove()); instances.delete(root); };
  instances.set(root, cleanup);
  return cleanup;
}
