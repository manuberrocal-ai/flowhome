import assert from 'node:assert/strict';
import test from 'node:test';
import { generateBreadcrumbSchema, generateItemListSchema, generateProductSchema, generateReviewSchema } from '../src/lib/seo.ts';

const now = new Date('2026-07-26T12:00:00Z');
const fresh = '2026-07-26T11:00:00Z';
const product = (overrides = {}) => ({ name: 'Test product', slug: 'test-product', brand: 'Test', price: 50, affiliateUrl: 'https://example.test/product', priceLastChecked: fresh, priceSource: 'manual', ownerRating: 4.8, ownerRatingCount: 300, ...overrides });

test('retailer owner ratings never create aggregate or review ratings', () => {
  const schema = generateProductSchema(product(), now);
  assert.equal(schema.aggregateRating, undefined);
  assert.equal(generateReviewSchema({ pubDate: '2026-07-01' }, product(), now).reviewRating, undefined);
});

test('only an explicit valid editorial rating produces Review reviewRating', () => {
  const schema = generateReviewSchema({ pubDate: '2026-07-01', editorialRating: 4, editorialRatingScale: 5 }, product(), now);
  assert.deepEqual(schema.reviewRating, { '@type': 'Rating', ratingValue: 4, bestRating: '5' });
  assert.equal(schema.author.name, 'FlowHome Editorial Team');
});

test('offers require a valid fresh source and HTTPS URL; verified availability is separately conditional', () => {
  assert.equal(generateProductSchema(product({ priceSource: undefined }), now).offers, undefined);
  assert.equal(generateProductSchema(product({ affiliateUrl: 'http://example.test/product' }), now).offers, undefined);
  assert.equal(generateProductSchema(product({ priceLastChecked: '2026-07-19T11:59:59Z' }), now).offers, undefined);
  assert.equal(generateProductSchema(product(), now).offers.availability, undefined);
  const verified = generateProductSchema(product({ availabilityStatus: 'in-stock', availabilitySource: 'affiliate feed', availabilityLastChecked: fresh }), now);
  assert.equal(verified.offers.availability, 'https://schema.org/InStock');
  assert.equal(verified.url, 'https://flowhome.dev/product/test-product/');
  assert.equal(verified['@context'], 'https://schema.org');
  assert.equal(generateReviewSchema({ pubDate: '2026-07-01' }, product(), now).itemReviewed['@context'], undefined);
});

test('comparison schemas expose ItemList and breadcrumbs', () => {
  assert.equal(generateItemListSchema([product({ slug: 'test' })], 'https://flowhome.dev/compare/test/')['@type'], 'ItemList');
  assert.equal(generateBreadcrumbSchema([{ name: 'Home', url: 'https://flowhome.dev/' }])['@type'], 'BreadcrumbList');
});
