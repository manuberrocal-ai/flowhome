import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('discount telemetry has no zero fallback for absent or expired commercial evidence', async () => {
  for (const file of ['src/components/ProductCard.astro', 'src/components/CompareTable.astro', 'src/components/StickyCTA.astro', 'src/layouts/ProductLayout.astro', 'src/layouts/ReviewLayout.astro', 'src/pages/product/[slug].astro']) {
    const text = await source(file);
    const attributes = [...text.matchAll(/data-discount=\{([^}]+)\}/g)].map(match => match[1]);
    assert.ok(attributes.length, file);
    for (const expression of attributes) {
      assert.match(expression, /displayDiscountPct/, file);
      assert.doesNotMatch(expression, /\?\?\s*0|\|\|\s*0/, file);
    }
  }
  const home = await source('src/pages/index.astro');
  assert.match(home, /discountPct: commerce\.displayDiscountPct,/);
  assert.doesNotMatch(await source('src/pages/quiz.astro'), /data-discount=/, 'quiz has no verified promotion to project');
  const deal = await source('src/components/DealCard.astro');
  assert.match(deal, /data-discount=\{showPromotion \? commerce\.displayDiscountPct : undefined\}/);
  assert.match(deal, /if \(cta\) delete cta\.dataset\.discount;/);
  assert.doesNotMatch(deal, /dataset\.discount\s*=\s*['"]0['"]/);
});

test('commercial components render only the centrally gated display projection', async () => {
  for (const file of ['src/components/ProductCard.astro', 'src/components/CompareTable.astro', 'src/components/StickyCTA.astro', 'src/components/PriceHistory.astro', 'src/pages/product/[slug].astro', 'src/pages/reviews/index.astro', 'src/layouts/ProductLayout.astro', 'src/layouts/ReviewLayout.astro', 'src/layouts/CompareLayout.astro']) {
    const text = await source(file);
    assert.match(text, /getCommerceData/, file);
    assert.match(text, /displayPrice/, file);
    assert.doesNotMatch(text, /\{(?:data|productData|product|p)\.(?:price|originalPrice|discountPct|ownerRating|ownerRatingCount)\b/, file);
  }
});

test('browser catalog payloads omit unauthorized numbers and re-check freshness before rendering', async () => {
  for (const file of ['src/pages/search.astro', 'src/pages/quiz.astro']) {
    const text = await source(file);
    assert.match(text, /price: commerce\.displayPrice/, file);
    assert.match(text, /ownerRating: commerce\.displayRating/, file);
    assert.match(text, /priceValidUntil: commerce\.priceExpiresAt/, file);
    assert.match(text, /ratingValidUntil: commerce\.ratingExpiresAt/, file);
    assert.doesNotMatch(text, /(?:escapeHtml|price)\((?:product|item)\.(?:price|ownerRating)\)/, file);
  }
});

test('deals require exact product identity, active window and authorized commercial evidence', async () => {
  const text = await source('src/components/DealCard.astro');
  assert.match(text, /suppliedProduct\.asin === data\.asin/);
  assert.match(text, /suppliedProduct\.slug === data\.productSlug/);
  assert.match(text, /statusInfo\.status === 'active' && commerce\.showPromotion/);
  assert.match(text, /priceSource: data\.priceSource, priceLastChecked: data\.priceLastChecked/);
  assert.doesNotMatch(text, /!isExpired && <div class="deal-badge/);
  assert.doesNotMatch(text, /productData\?\.price \?\? data\.dealPrice/);
});

test('shortlist controls do not persist new prices and the page never totals legacy prices', async () => {
  assert.doesNotMatch(await source('src/components/ProductCard.astro'), /data-price=/);
  const cart = await source('src/lib/cart-client.js');
  assert.doesNotMatch(cart, /getCartSubtotal|formatMoney\(item\.price\)|price: button\.dataset\.price/);
  assert.doesNotMatch(await source('src/pages/cart.astro'), /Estimated subtotal|\$0\.00/);
  assert.doesNotMatch(await source('src/pages/quiz.astro'), /store\.toggle\([^\n]*price: product\.price/);
});

test('internal price and rating selectors require public commerce eligibility', async () => {
  const text = await source('src/lib/internal-links.ts');
  assert.match(text, /getCommerceData/);
  assert.match(text, /price !== undefined/);
  assert.match(text, /\.isRatingFresh/);
  assert.match(text, /commerce\(d\)\.showPromotion/);
  assert.doesNotMatch(text, /\.data\.(?:price|ownerRating|discountPct)\s*(?:<=|>=|-)/);
});
