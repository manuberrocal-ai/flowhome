import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { setupHeroCarousel } from '../src/lib/hero-carousel.js';

function read(path) {
  return readFileSync(path, 'utf8');
}

function collectFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return /\.(astro|js|mjs|ts|tsx|css)$/i.test(entry.name) ? [path] : [];
  });
}

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

const baseLayout = read('src/layouts/BaseLayout.astro');
const footer = read('src/components/Footer.astro');
const indexPage = read('src/pages/index.astro');
const styleSheet = read('src/styles/global.css');
const heroCarousel = read('src/lib/hero-carousel.js');

test('BaseLayout keeps only reduced-motion-safe interaction zoom', () => {
  assert.match(baseLayout, /const reduceMotion = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(baseLayout, /if \(!reduceMotion\) setupProductZoom\(\);/);
  assert.doesNotMatch(baseLayout, /requestAnimationFrame|addEventListener\('scroll'/);
});

test('Parallax and infinite decorative motion are removed', () => {
  const srcFiles = collectFiles('src');
  const srcContents = srcFiles.map((file) => read(file)).join('\n');
  assert.doesNotMatch(srcContents, /flow-wave|home-parallax-bg(?:--account)?|data-dark-parallax/i);
  assert.doesNotMatch(srcContents, /background-attachment\s*:\s*fixed|animation-iteration-count\s*:\s*infinite|animation:[^;]*infinite|animate-(pulse|bounce|spin)/i);
  assert.doesNotMatch(srcContents, /duration-(?:30[1-9]|3[1-9]\d|[4-9]\d{2}|\d{4,})\b|duration-\[(?:30[1-9]|3[1-9]\d|[4-9]\d{2}|\d{4,})ms\]|\b(?:30[1-9]|3[1-9]\d|[4-9]\d{2}|\d{4,})ms\b/i);
  assert.doesNotMatch(srcContents, /requestAnimationFrame|addEventListener\(['"]scroll/i);
  for (const content of [baseLayout, footer, indexPage, styleSheet]) {
    assert.doesNotMatch(content, /parallax|background-attachment\s*:\s*fixed|animation-iteration-count\s*:\s*infinite|animation:[^;]*infinite|animate-(pulse|bounce|spin)/i);
    assert.doesNotMatch(content, /requestAnimationFrame|addEventListener\(['"]scroll/);
  }
});

test('Interaction feedback stays within the brief motion range', () => {
  assert.match(styleSheet, /--fh-motion-fast:\s*150ms/);
  assert.match(styleSheet, /--fh-motion-base:\s*220ms/);
  assert.match(styleSheet, /--fh-motion-slow:\s*300ms/);
  assert.match(footer, /transition: transform 180ms ease/);
  assert.match(indexPage, /transition hover:-translate-y-0\.5/);
});

test('Reduced motion disables non-essential hero transitions', () => {
  assert.match(styleSheet, /prefers-reduced-motion: reduce/);
  assert.match(indexPage, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(indexPage, /transition: none !important/);
});

test('hero carousel exposes eager/fetchpriority high for primary image and lazy for thumbnails', () => {
  assert.match(indexPage, /<img data-hero-image[^>]*loading="eager"[^>]*fetchpriority="high"/);
  assert.match(indexPage, /loading="lazy"[^>]*fetchpriority="low"/);
});

test('Finite brand restoration motion remains one-shot and is disabled for reduced motion', () => {
  assert.match(styleSheet, /@keyframes brand-star-reveal/);
  assert.match(styleSheet, /\.hero-star \{ animation: brand-star-reveal var\(--fh-motion-slow\) var\(--fh-ease\) both; \}/);
  assert.match(styleSheet, /\.hero-star:nth-child\(5\) \{ animation-delay: 180ms; \}/);
  assert.match(styleSheet, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.hero-star \{ animation: none !important; \}/);
  assert.doesNotMatch(`${indexPage}\n${styleSheet}`, /@keyframes\s+(flow-wave|leaf-dance|sparkle|pop|heroStarPop)|animation:[^;]*infinite/i);
});

test('hero carousel script honors prefers-reduced-motion via matchMedia', () => {
  assert.match(heroCarousel, /prefers-reduced-motion: reduce/);
  assert.match(heroCarousel, /matchMedia/);
});

test('hero carousel pauses on viewport exit and resumes on re-entry without marking interaction', () => {
  const root = fixture();
  const dot = new Node();
  const secondDot = new Node();
  const doc = new Node();
  doc.visibilityState = 'visible';
  doc.querySelectorAll = () => [dot, secondDot];
  doc.querySelector = (selector) => selector === '.hero-prev' || selector === '.hero-next' ? new Node() : null;
  const media = new Node();
  media.matches = false;
  let starts = 0;
  let clears = 0;
  let observer = null;
  const win = {
    matchMedia: () => media,
    setInterval: () => { starts += 1; return starts; },
    clearInterval: () => { clears += 1; },
    IntersectionObserver: class {
      constructor(cb) { this.cb = cb; this.disconnected = false; observer = this; }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
      emit(isIntersecting) { if (!this.disconnected) this.cb([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0, target: this.target }]); }
    },
  };
  const cleanup = setupHeroCarousel({ root, products: [
    { id: 'one', slug: 'one', title: 'First', image: '/one.jpg', alt: 'First alt', priceLabel: '$10', priceContext: 'Price snapshot', originalPrice: 20, ownerRating: 4.5, ownerRatingCount: 12, ratingSource: 'Amazon customer rating', badges: ['Save 50%'], detailsUrl: '/product/one/', amazonUrl: 'https://amazon.test/one', affiliateDisclosure: 'Disclosure one', category: 'Smart home', discountPct: 50, quote: 'First quote' },
    { id: 'two', slug: 'two', title: 'Second', image: '/two.jpg', alt: 'Second alt', priceLabel: '$20', priceContext: 'Historical price snapshot', originalPrice: 40, ownerRating: 2, ownerRatingCount: 34, ratingSource: 'Amazon customer rating', badges: ['New'], detailsUrl: '/product/two/', amazonUrl: 'https://amazon.test/two', affiliateDisclosure: 'Disclosure two', category: 'Lighting', discountPct: 0, quote: 'Second quote' },
  ], windowRef: win, documentRef: doc });
  assert.equal(starts, 1);
  assert.equal(observer.target, root);
  observer.emit(false);
  assert.equal(clears, 1);
  assert.equal(starts, 1);
  observer.emit(true);
  assert.equal(starts, 2);
  cleanup();
  assert.equal(observer.disconnected, true);
  observer.emit(true);
  assert.equal(starts, 2);
});
