import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../scripts/qa/catalog-artwork-regression.cjs', import.meta.url), 'utf8');
const run = () => runInNewContext(`(${source})`);
function fixture(change = () => {}, profileCaptionWrong = false) {
  const items = Array.from({ length: 28 }, (_, index) => {
    const slug = `item-${index}`, asin = `ASIN${index}`, details = `/product/${slug}/`, image = `/images/product-art/models-v1/${slug}.webp`;
    return { slug, asin, details, image, name: `Product ${index}`, alt: `Illustration ${index}`,
      category: 'smart-hub', caption: 'Model illustration — not a product photo',
      selected: image.replace('.webp', '-240.webp'), amazon: `https://www.amazon.com/dp/${asin}`, amazonPath: `/dp/${asin}`,
      internalLinks: [details, details, details], saved: { image, url: details, asin, slug } };
  });
  change(items);
  let active;
  const image = { scrollIntoViewIfNeeded: async () => {}, evaluate: async () => {}, getAttribute: async () => active.alt,
    locator: () => ({ locator: () => ({ textContent: async () => profileCaptionWrong ? 'wrong caption' : active.caption }) }) };
  return {
    emulateMedia: async () => {}, setViewportSize: async () => {}, evaluate: async () => false,
    goto: async url => { active = items.find(item => url.endsWith(item.details)); return { ok: () => true }; },
    locator: selector => {
      if (selector === '.product-card') return { count: async () => items.length, nth: index => ({ locator: () => image, evaluate: async () => items[index] }) };
      if (selector === 'h1') return { textContent: async () => active.name };
      if (selector.startsWith('img[')) return { first: () => image };
      if (selector === '[data-cta-position="product_profile"]') return { getAttribute: async () => active.amazon };
      throw Error('Unexpected locator ' + selector);
    }
  };
}

test('catalog regression requires all 28 profiles at both viewport sizes', async () => {
  const result = await run()(fixture());
  assert.equal(result.results.length, 2);
  assert.ok(result.results.every(result => result.catalog === 28 && result.profilesPassed === 28));
});

for (const [label, change, message] of [
  ['missing product', items => items.pop(), 'full 28-product catalog'],
  ['duplicate identity', items => { items[1].slug = items[0].slug; }, 'Duplicate product slugs'],
  ['duplicate model artwork', items => { items[1].image = items[0].image; }, 'Repeated model-specific artwork'],
  ['wrong media link', items => { items[0].internalLinks[0] = '/product/other/'; }, 'Media/title/details disagree'],
  ['wrong saved image', items => { items[0].saved.image = '/wrong.webp'; }, 'Saved-list payload mismatch'],
  ['missing thumbnail', items => { items[0].selected = items[0].image; }, 'Missing DPR1 catalog thumbnail'],
  ['missing disclosure', items => { items[0].caption = 'Product photo'; }, 'Missing illustration disclosure'],
]) {
  test(`catalog regression detects ${label}`, async () => {
    await assert.rejects(run()(fixture(change)), error => error.message.includes(message));
  });
}

test('catalog regression detects profile disclosure drift', async () => {
  await assert.rejects(run()(fixture(undefined, true)), error => error.message.includes('Profile caption mismatch'));
});
