import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveImageFallback, setupImageFallbacks } from '../src/lib/image-fallback.js';

const pageUrl = 'https://flowhome.dev/product/example/';
const artwork = '/images/product-art/smart-lighting.svg';
const artworkUrl = new URL(artwork, pageUrl).href;

class ImageFixture {
  constructor({ src = 'https://images.example/photo.jpg', fallback = artwork, complete = true, naturalWidth = 0, alt = 'Product photo', caption = true, srcset = '' } = {}) {
    this.dataset = { fallbackSrc: fallback };
    this.complete = complete;
    this.naturalWidth = naturalWidth;
    this.alt = alt;
    this.attributes = { srcset };
    this.caption = caption ? { textContent: 'Product photo' } : null;
    this.assignedSources = [];
    this.source = new URL(src, pageUrl).href;
  }
  get src() { return this.source; }
  set src(value) {
    this.source = new URL(value, pageUrl).href;
    this.assignedSources.push(this.source);
    this.complete = false;
    this.naturalWidth = 0;
  }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  closest() { return this.caption ? { querySelector: () => this.caption } : null; }
  failed() { this.complete = true; this.naturalWidth = 0; }
  loaded() { this.complete = true; this.naturalWidth = 500; }
}

function fixture(images = []) {
  const listeners = new Map();
  let observer;
  const documentRef = {
    documentElement: {},
    querySelectorAll: () => images,
    addEventListener(type, callback, capture) { listeners.set(type, { callback, capture }); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const windowRef = {
    location: { href: pageUrl },
    HTMLImageElement: ImageFixture,
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observer = this; }
      observe(target, options) { this.target = target; this.options = options; }
      disconnect() { this.disconnected = true; }
    },
  };
  const cleanup = setupImageFallbacks({ documentRef, windowRef });
  return {
    cleanup, documentRef, windowRef, listeners,
    get observer() { return observer; },
    event(type, target) { listeners.get(type)?.callback({ target }); },
    mutations(records) { observer.callback(records); },
  };
}

test('fallback destination must be a valid same-origin HTTP image source', () => {
  assert.equal(resolveImageFallback(artwork, pageUrl), artworkUrl);
  assert.equal(resolveImageFallback(`${artworkUrl}#decorative`, pageUrl), artworkUrl);
  for (const value of ['', null, '//elsewhere.test/image.svg', 'https://flowhome.dev.evil.test/image.svg', 'https://user:pass@flowhome.dev/image.svg', 'http://flowhome.dev/image.svg', 'javascript:alert(1)', 'data:image/svg+xml,a', 'https://[', String.fromCharCode(92, 92) + 'elsewhere.test/image.svg']) {
    assert.equal(resolveImageFallback(value, pageUrl), null, String(value));
  }
});

test('successful category artwork preserves its descriptive model-aware alt, but failure is still announced', () => {
  const alt = 'Smart Hub category illustration; not a photo of Aeotec SmartThings Hub';
  const image = new ImageFixture({ src: artwork, naturalWidth: 500, alt });
  const api = fixture([image]);
  assert.equal(image.alt, alt);
  api.event('load', image);
  assert.equal(image.alt, alt);
  image.failed();
  api.event('error', image);
  assert.equal(image.alt, 'Product image unavailable');
});

test('initial scan recovers images that failed before script startup and labels artwork honestly', () => {
  const image = new ImageFixture();
  fixture([image]);
  assert.deepEqual(image.assignedSources, [artworkUrl]);
  assert.match(image.alt, /Representative category illustration; not a product photo/);
  assert.equal(image.caption.textContent, 'Category illustration — not a product photo');
});

test('pending and successful images are untouched; captured errors recover later failures', () => {
  const pending = new ImageFixture({ complete: false });
  const loaded = new ImageFixture({ naturalWidth: 500 });
  const api = fixture([pending, loaded]);
  assert.equal(api.listeners.get('error').capture, true);
  assert.deepEqual(pending.assignedSources, []);
  assert.deepEqual(loaded.assignedSources, []);
  api.event('error', {});
  api.event('error', pending);
  assert.deepEqual(pending.assignedSources, []);
  pending.failed();
  api.event('error', pending);
  assert.deepEqual(pending.assignedSources, [artworkUrl]);
});

test('failed fallback does not retry or loop and reports unavailability', () => {
  const image = new ImageFixture();
  const api = fixture([image]);
  image.failed();
  api.event('error', image);
  api.event('error', image);
  api.mutations([{ type: 'attributes', target: image }]);
  assert.deepEqual(image.assignedSources, [artworkUrl]);
  assert.equal(image.alt, 'Product image unavailable');
  assert.equal(image.caption.textContent, 'Product image unavailable');
});

test('cached failures after hero rotation are handled with the new artwork and honest alt', () => {
  const image = new ImageFixture();
  const api = fixture([image]);
  image.loaded();
  api.event('load', image);
  image.src = 'https://images.example/next-product.jpg';
  image.alt = 'Next product';
  image.dataset.fallbackSrc = '/images/product-art/smart-speaker.svg';
  image.failed();
  api.mutations([{ type: 'attributes', target: image }, { type: 'attributes', target: image }]);
  assert.equal(image.src, 'https://flowhome.dev/images/product-art/smart-speaker.svg');
  assert.match(image.alt, /Representative category illustration/);
  assert.equal(image.assignedSources.length, 3);
  image.src = 'https://images.example/third-product.jpg';
  image.alt = 'Third product';
  image.caption.textContent = 'Third model illustration';
  image.loaded();
  api.event('load', image);
  assert.equal(image.alt, 'Third product');
  assert.equal(image.caption.textContent, 'Third model illustration');
});

test('dynamically inserted failures are scanned, including a nested image', () => {
  const api = fixture();
  const image = new ImageFixture();
  const nested = new ImageFixture({ alt: '' });
  api.mutations([{ type: 'childList', addedNodes: [image, { querySelectorAll: () => [nested] }, {}] }]);
  assert.equal(image.src, artworkUrl);
  assert.equal(nested.src, artworkUrl);
  assert.equal(nested.alt, '');
});

test('responsive image candidates are removed and invalid fallback targets stay untouched', () => {
  const image = new ImageFixture({ srcset: 'https://images.example/photo-large.jpg 2x' });
  const invalid = new ImageFixture({ fallback: '//elsewhere.test/image.svg' });
  fixture([image, invalid]);
  assert.equal(image.getAttribute('srcset'), null);
  assert.equal(image.src, artworkUrl);
  assert.deepEqual(invalid.assignedSources, []);
  assert.equal(invalid.alt, 'Product photo');
});

test('initial and reselected artwork is not presented as an actual product photo', () => {
  const image = new ImageFixture({ src: artwork, naturalWidth: 500 });
  const api = fixture([image]);
  assert.match(image.alt, /Representative category illustration/);
  image.alt = 'A new carousel product';
  api.mutations([{ type: 'attributes', target: image }]);
  assert.match(image.alt, /not a product photo/);
  assert.deepEqual(image.assignedSources, []);
});

test('retrying the original photo restores its original alt and caption after a successful load', () => {
  const image = new ImageFixture({ alt: 'Named product' });
  const source = image.src;
  const api = fixture([image]);
  image.src = source;
  image.loaded();
  api.event('load', image);
  assert.equal(image.alt, 'Named product');
  assert.equal(image.caption.textContent, 'Product photo');
});

test('installation is idempotent and can be cleaned up and reinstalled', () => {
  const api = fixture();
  assert.equal(setupImageFallbacks(api), api.cleanup);
  assert.equal(api.listeners.size, 2);
  assert.deepEqual(api.observer.options.attributeFilter, ['src', 'srcset', 'alt', 'data-fallback-src']);
  api.cleanup();
  assert.equal(api.listeners.size, 0);
  assert.equal(api.observer.disconnected, true);
  assert.notEqual(setupImageFallbacks(api), api.cleanup);
  assert.doesNotThrow(() => setupImageFallbacks({ documentRef: null, windowRef: null }));
});

test('layout installs the shared recovery helper and product photo captions have scoped hooks', () => {
  const layout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  assert.match(layout, /import \{ setupImageFallbacks \} from '\.\.\/lib\/image-fallback\.js'/);
  assert.match(layout, /setupImageFallbacks\(\)/);
  for (const path of ['../src/pages/product/[slug].astro', '../src/layouts/ProductLayout.astro']) {
    const product = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(product, /data-image-fallback-scope/);
    assert.match(product, /data-image-source-caption>\{sourceLabel\}/);
  }
});
