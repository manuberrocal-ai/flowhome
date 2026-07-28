import assert from 'node:assert/strict';
import test from 'node:test';
import { applyProduct, setupHeroCarousel } from '../src/lib/hero-carousel.js';

class Node {
  constructor() { this.attrs = {}; this.dataset = {}; this.children = []; this.listeners = {}; this.classList = { values: new Set(), toggle: (name, on) => on ? this.classList.values.add(name) : this.classList.values.delete(name) }; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name]; }
  toggleAttribute(name, value) { this.attrs[name] = value ? '' : undefined; }
  append(node) { this.children.push(node); }
  get firstChild() { return this.children[0]; }
  removeChild() { this.children.shift(); }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  removeEventListener() {}
  dispatch(name, event = {}) { this.listeners[name]?.forEach((fn) => fn(event)); }
  querySelector(selector) { return this.map?.[selector] || null; }
  querySelectorAll(selector) { return this.map?.[selector] || []; }
}

const product = (slug, title) => ({ id: slug, slug, title, image: `/${slug}.jpg`, alt: `${title} alt`, priceLabel: slug === 'one' ? '$10' : '$20', priceContext: slug === 'one' ? 'Price snapshot' : 'Historical price snapshot', originalPrice: slug === 'one' ? 20 : 40, ownerRating: slug === 'one' ? 4.5 : 2, ownerRatingCount: slug === 'one' ? 12 : 34, ratingSource: 'Amazon customer rating', badges: [slug === 'one' ? 'Save 50%' : 'New'], detailsUrl: `/product/${slug}/`, amazonUrl: `https://amazon.test/${slug}`, affiliateDisclosure: `Disclosure ${slug}`, category: slug === 'one' ? 'Smart home' : 'Lighting', discountPct: slug === 'one' ? 50 : 0, quote: `${title} quote` });

function fixture() {
  const root = new Node();
  const fields = ['title', 'category', 'price', 'price-context', 'original-price', 'rating', 'rating-count', 'rating-source', 'quote', 'badges'];
  root.map = Object.fromEntries(fields.map((name) => [`[data-hero-field="${name}"]`, new Node()]));
  root.map['[data-hero-image]'] = new Node();
  root.map['[data-hero-photo-link]'] = new Node();
  root.map['[data-hero-details]'] = new Node();
  root.map['[data-hero-amazon]'] = new Node();
  root.map['[data-hero-indicator]'] = new Node();
  root.map['[data-hero-live]'] = new Node();
  root.map['[data-hero-slide]'] = new Node();
  root.map['[data-hero-field="discount"]'] = new Node();
  root.map['[data-hero-rating-stars]'] = new Node();
  root.map['[data-hero-star]'] = Array.from({ length: 5 }, () => new Node());
  root.ownerDocument = { createElement: () => new Node() };
  return root;
}

test('applying a product updates every field without mixing products', () => {
  const root = fixture();
  const first = product('one', 'First');
  const second = product('two', 'Second');
  applyProduct(root, first, 0);
  applyProduct(root, second, 1);
  assert.equal(root.map['[data-hero-field="title"]'].textContent, 'Second');
  assert.equal(root.map['[data-hero-image]'].src, '/two.jpg');
  assert.equal(root.map['[data-hero-image]'].alt, 'Second alt');
  assert.equal(root.map['[data-hero-field="price"]'].textContent, '$20');
  assert.equal(root.map['[data-hero-field="price-context"]'].textContent, 'Historical price snapshot');
  assert.equal(root.map['[data-hero-field="original-price"]'].textContent, '$40');
  assert.equal(root.map['[data-hero-field="rating"]'].textContent, '2');
  assert.equal(root.map['[data-hero-field="rating-count"]'].textContent, '34');
  assert.equal(root.map['[data-hero-field="rating-source"]'].textContent, 'Amazon customer rating');
  assert.equal(root.map['[data-hero-field="discount"]'].textContent, '');
  assert.equal(root.map['[data-hero-field="discount"]'].attrs.hidden, '');
  assert.equal(root.map['[data-hero-amazon]'].href, 'https://amazon.test/two');
  assert.equal(root.map['[data-hero-amazon]'].attrs['aria-label'], 'Check Second price on Amazon');
  assert.equal(root.map['[data-hero-amazon]'].dataset.productSlug, 'two');
  assert.equal(root.map['[data-hero-amazon]'].dataset.category, 'Lighting');
  assert.equal(root.map['[data-hero-amazon]'].dataset.discount, '0');
  assert.equal(root.map['[data-hero-amazon]'].dataset.affiliateDisclosure, 'Disclosure two');
  assert.equal(root.map['[data-hero-details]'].href, '/product/two/');
  assert.equal(root.map['[data-hero-photo-link]'].href, '/product/two/');
  assert.equal(root.map['[data-hero-field="category"]'].textContent, 'Lighting');
  assert.equal(root.map['[data-hero-field="quote"]'].textContent, '"Second quote"');
  assert.equal(root.map['[data-hero-indicator]'].textContent, '2');
  assert.equal(root.map['[data-hero-field="badges"]'].children[0].textContent, 'New');
  assert.equal(root.map['[data-hero-star]'][0].classList.values.has('text-amber-300'), true);
  assert.equal(root.map['[data-hero-star]'][1].classList.values.has('text-amber-300'), true);
  assert.equal(root.map['[data-hero-star]'][2].classList.values.has('text-slate-600'), true);
  assert.equal(root.map['[data-hero-star]'][4].classList.values.has('text-slate-600'), true);
  assert.equal(root.map['[data-hero-rating-stars]'].attrs['aria-label'], 'Amazon customer rating 2 out of 5 stars');
});

test('setup respects reduced motion, interaction, and visibility', () => {
  const root = fixture();
  const dot = new Node();
  const secondDot = new Node();
  const doc = new Node();
  doc.visibilityState = 'visible';
  doc.querySelectorAll = () => [dot, secondDot];
  doc.querySelector = (selector) => selector === '.hero-prev' || selector === '.hero-next' ? new Node() : null;
  const media = new Node();
  media.matches = true;
  let starts = 0;
  const win = { matchMedia: () => media, setInterval: () => { starts += 1; return 1; }, clearInterval() {} };
  setupHeroCarousel({ root, products: [product('one', 'First'), product('two', 'Second')], windowRef: win, documentRef: doc });
  assert.equal(starts, 0);
  media.matches = false;
  media.dispatch('change');
  assert.equal(starts, 1);
  doc.visibilityState = 'hidden';
  doc.dispatch('visibilitychange');
  doc.visibilityState = 'visible';
  doc.dispatch('visibilitychange');
  assert.equal(starts, 2);
  secondDot.dispatch('click');
  assert.equal(secondDot.attrs['aria-pressed'], 'true');
  assert.equal(dot.attrs['aria-pressed'], 'false');
  root.map['[data-hero-slide]'].dispatch('pointerdown');
  doc.visibilityState = 'hidden';
  doc.dispatch('visibilitychange');
  doc.visibilityState = 'visible';
  doc.dispatch('visibilitychange');
  assert.equal(starts, 2, 'interaction pauses autoplay permanently without restarting it');
});
