import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { getFeatureEvidenceLabel } from '../src/lib/product-feature-evidence.ts';
import { getInstallationEvidence } from '../src/lib/product-installation.ts';
import { selectRecommendationResult, getRecommendationReasons } from '../src/lib/quiz-recommend.ts';

const product = parse(readFileSync(new URL('../src/content/products/tp-link-kasa-smart-plug-mini.yaml', import.meta.url), 'utf8'));
const review = readFileSync(new URL('../src/content/reviews/tp-link-kasa-smart-plug-mini-review.md', import.meta.url), 'utf8');

test('Kasa retail identity preserves commerce and disputed energy remains unknown', () => {
  assert.equal(product.asin, 'B091FXQQMQ');
  assert.equal(product.model, 'EP10 (EP10P2 two-pack)');
  assert.equal(product.energyMonitoring, undefined);
  assert.equal(getFeatureEvidenceLabel(product, 'energyMonitoring'), 'Not verified');
  assert.equal(getInstallationEvidence(product)?.assessment, 'plug-and-play');
  assert.equal(product.affiliateUrl, 'https://www.amazon.com/dp/B091FXQQMQ?tag=flowhome-20');
  assert.equal(product.priceLastChecked, '2026-06-28');
  assert.equal(product.ratingLastChecked, '2026-06-28');
  assert.deepEqual([product.price, product.originalPrice, product.ownerRating, product.ownerRatingCount], [22.99, 29.99, 4.6, 78000]);
  assert.equal(product.sources.length, 4);
  assert.ok(product.sources.every((source) => source.accessedAt === '2026-09-05'));
});

test('Kasa review distinguishes bundle, unverified firmware and non-metering purpose', () => {
  assert.match(review, /EP10P2 two-pack/);
  assert.match(review, /energy measurement remains unverified/);
  assert.match(review, /Runtime is not measured electrical consumption/);
  assert.match(review, /Hardware revision, generation and installed firmware remain unverified/);
  assert.doesNotMatch(review, /not a confirmed hardware model|does not verify the catalog's energy-monitoring flag/);
});

test('EP10 setup preserves model, load scope and network conditions without certifying firmware', () => {
  const requirements = getInstallationEvidence(product).requirements.join(' ');
  for (const pattern of [/indoor/, /Do not stack/, /2\.4 GHz/, /TP-Link ID/, /100-120 V/, /resistive loads/, /load-specific/, /revision and firmware are not verified/]) assert.match(requirements, pattern);
  const state = { goal: 'energy', ecosystem: 'open', budget: 'open', installation: 'plug-and-play', extra: 'open' };
  const peer = { ...product, slug: 'synthetic-peer' };
  const result = selectRecommendationResult(state, [product, peer]);
  assert.deepEqual(result.relaxedFilters, []);
  assert.doesNotMatch(getRecommendationReasons(product, state, result).join(' '), /Installation requirements are not yet verified|energy monitoring|energy measurement/i);
  const schema = readFileSync(new URL('../src/content.config.ts', import.meta.url), 'utf8');
  assert.match(schema, /energyMonitoring:\s*z\.boolean\(\)\.optional\(\)/);
});
