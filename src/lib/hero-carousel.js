const instances = new WeakMap();
const imageTransitions = new WeakMap();

// Browsers may keep painting the previous bitmap while a new src/srcset loads.
// Preserve its layout box, but never pair that old bitmap with new product data.
function prepareProductImage(image, root) {
  imageTransitions.get(image)?.();
  let cancelled = false;
  image.style.visibility = 'hidden';
  image.setAttribute('aria-busy', 'true');
  const reveal = async () => {
    if (!image.complete || !image.naturalWidth) return;
    const source = image.src;
    const candidates = image.srcset;
    try {
      if (typeof image.decode === 'function') await image.decode();
      if (cancelled || image.src !== source || image.srcset !== candidates || !image.complete || !image.naturalWidth) return;
      image.style.visibility = '';
      image.removeAttribute('aria-busy');
    } catch {
      // Keep an undecodable bitmap hidden. The shared fallback owns recovery.
      if (!cancelled && image.src === source && image.srcset === candidates) unavailable();
    }
  };
  const unavailable = () => {
    if (cancelled) return;
    image.style.visibility = 'hidden';
    image.removeAttribute('aria-busy');
    setText(root, 'image-caption', 'Product image unavailable');
  };
  image.addEventListener('load', reveal);
  image.addEventListener('error', unavailable);
  const cleanup = () => {
    cancelled = true;
    image.removeEventListener('load', reveal);
    image.removeEventListener('error', unavailable);
  };
  imageTransitions.set(image, cleanup);
  return reveal;
}

export function normalizeProduct(product) {
  return {
    id: String(product.id ?? product.slug),
    slug: String(product.slug),
    title: String(product.title ?? product.name ?? ''),
    image: String(product.image ?? ''),
    imageSrcset: String(product.imageSrcset ?? ''),
    imageSizes: String(product.imageSizes ?? ''),
    fallbackImage: String(product.fallbackImage ?? '/images/product-placeholder.svg'),
    alt: String(product.alt ?? product.title ?? product.name ?? ''),
    imageCaption: String(product.imageCaption ?? 'Category illustration — not a product photo'),
    price: product.price,
    priceLabel: String(product.priceLabel ?? `$${product.price}`),
    originalPrice: product.originalPrice ?? null,
    ownerRating: product.ownerRating ?? 0,
    ownerRatingCount: product.ownerRatingCount ?? 0,
    ratingSource: String(product.ratingSource ?? 'Amazon customer rating'),
    hasRating: product.hasRating ?? Number(product.ownerRating ?? 0) > 0,
    priceContext: String(product.priceContext ?? 'Historical price snapshot'),
    badges: Array.isArray(product.badges) ? product.badges : [],
    detailsUrl: String(product.detailsUrl ?? `/product/${product.slug}/`),
    amazonUrl: String(product.amazonUrl ?? ''),
    affiliateDisclosure: String(product.affiliateDisclosure ?? ''),
    category: String(product.category ?? ''),
    categorySlug: typeof product.categorySlug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.categorySlug)
      ? product.categorySlug : undefined,
    discountPct: typeof product.discountPct === 'number' && Number.isFinite(product.discountPct)
      && product.discountPct >= 0 && product.discountPct <= 100 ? product.discountPct : undefined,
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
  let revealImage;
  if (image) {
    revealImage = prepareProductImage(image, root);
    image.sizes = item.imageSizes;
    image.srcset = item.imageSrcset;
    image.src = item.image;
    image.alt = item.alt;
    image.dataset.fallbackSrc = item.fallbackImage;
  }
  const photoLink = root.querySelector('[data-hero-photo-link]');
  if (photoLink) { photoLink.href = item.detailsUrl; photoLink.setAttribute('aria-label', `View ${item.title}`); }
  setText(root, 'title', item.title);
  setText(root, 'image-caption', item.imageCaption);
  setText(root, 'category', item.category);
  setText(root, 'price', item.priceLabel);
  setText(root, 'price-context', item.priceContext);
  const original = setText(root, 'original-price', item.originalPrice == null ? '' : `$${item.originalPrice}`);
  original?.toggleAttribute('hidden', item.originalPrice == null);
  setText(root, 'rating', item.hasRating ? item.ownerRating : '');
  setText(root, 'rating-count', item.hasRating ? (item.ownerRatingCount.toLocaleString?.() ?? item.ownerRatingCount) : '');
  setText(root, 'rating-source', item.ratingSource);
  const stars = Array.from(root.querySelectorAll?.('[data-hero-star]') ?? []);
  root.querySelector('[data-hero-rating-stars]')?.setAttribute('aria-label', item.hasRating ? `Amazon customer rating ${item.ownerRating} out of 5 stars` : 'Current rating not verified');
  root.querySelector('[data-hero-rating-stars]')?.toggleAttribute('hidden', !item.hasRating);
  stars.forEach((star, starIndex) => {
    const active = item.hasRating && starIndex < Math.round(item.ownerRating);
    star.classList.toggle('text-amber-300', active);
    star.classList.toggle('text-slate-600', !active);
  });
  const discount = setText(root, 'discount', item.discountPct > 0 ? `Save ${item.discountPct}%` : '');
  discount?.toggleAttribute('hidden', !(item.discountPct > 0));
  setText(root, 'quote', item.quote);

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
  const checks = root.querySelector('[data-hero-checks]');
  if (checks) {
    checks.href = `${item.detailsUrl}#installation-checks`;
    checks.setAttribute('aria-label', `Setup checks and sources for ${item.title}`);
  }
  const amazon = root.querySelector('[data-hero-amazon]');
  if (amazon) {
    amazon.href = item.amazonUrl;
    amazon.setAttribute('aria-label', `Check ${item.title} price on Amazon`);
    amazon.dataset.productSlug = item.slug;
    if (item.categorySlug === undefined) delete amazon.dataset.category;
    else amazon.dataset.category = item.categorySlug;
    if (item.discountPct === undefined) delete amazon.dataset.discount;
    else amazon.dataset.discount = String(item.discountPct);
    amazon.dataset.affiliateDisclosure = item.affiliateDisclosure;
  }
  const indicator = root.querySelector('[data-hero-indicator]');
  if (indicator) indicator.textContent = `${index + 1}`;
  // Cached images may not emit another load event after assigning the same URL.
  revealImage?.();
  return item;
}

/**
 * @param {{ root?: HTMLElement | null, products?: Array<Record<string, unknown>>, windowRef?: Window, documentRef?: Document }} options
 */
export function setupHeroCarousel({ root, products, windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  if (!root || !products?.length) return () => {};
  instances.get(root)?.();
  const items = products.map(normalizeProduct);
  const article = root.querySelector('[data-hero-slide]');
  const dots = Array.from(documentRef.querySelectorAll('[data-hero-dot]'));
  const prev = documentRef.querySelector('.hero-prev');
  const next = documentRef.querySelector('.hero-next');
  const playback = root.querySelector('[data-hero-playback]');
  const media = windowRef.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = null;
  let interacted = true;
  let hasPlayed = false;
  let inViewport = true;
  let observer = null;
  const syncPlayback = () => {
    if (!playback) return;
    playback.hidden = items.length < 2;
    playback.disabled = media.matches;
    playback.textContent = media.matches ? 'Autoplay off' : timer ? 'Pause rotation' : hasPlayed ? 'Resume rotation' : 'Start rotation';
    playback.setAttribute('aria-label', media.matches ? 'Autoplay off: reduced motion preference' : playback.textContent);
  };

  const stop = () => {
    interacted = true;
    if (timer) windowRef.clearInterval(timer);
    timer = null;
    syncPlayback();
  };
  const pause = () => {
    if (timer) windowRef.clearInterval(timer);
    timer = null;
    syncPlayback();
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
    if (!interacted && !media.matches && documentRef.visibilityState !== 'hidden' && inViewport && items.length > 1 && !timer) {
      timer = windowRef.setInterval(() => render(active + 1), 4300);
      hasPlayed = true;
    }
    syncPlayback();
  };
  const onManual = (callback) => { stop(); callback(); };
  const listeners = [];
  const listen = (target, event, handler, options) => { target?.addEventListener(event, handler, options); listeners.push(() => target?.removeEventListener(event, handler, options)); };

  render(0);
  listen(playback, 'click', () => {
    if (timer) stop();
    else { interacted = false; start(); }
  });
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
  listen(documentRef, 'visibilitychange', () => { if (documentRef.visibilityState === 'hidden') { pause(); } else start(); });
  listen(media, 'change', () => { root.dataset.reducedMotion = String(media.matches); if (media.matches && timer) { pause(); } else start(); });
  if (typeof windowRef.IntersectionObserver === 'function') {
    observer = new windowRef.IntersectionObserver((entries = []) => {
      const entry = entries[0];
      inViewport = entry ? (entry.isIntersecting ?? (entry.intersectionRatio ?? 0) > 0) : true;
      if (!inViewport) {
        pause();
        return;
      }
      start();
    });
    observer.observe(root);
  }
  root.dataset.reducedMotion = String(media.matches);
  start();

  const cleanup = () => { if (timer) windowRef.clearInterval(timer); observer?.disconnect(); listeners.splice(0).forEach((remove) => remove()); imageTransitions.get(root.querySelector('[data-hero-image]'))?.(); instances.delete(root); };
  instances.set(root, cleanup);
  return cleanup;
}
