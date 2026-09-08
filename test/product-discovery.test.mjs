import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildDiscoveryReport } from '../scripts/discovery/product-discovery.mjs';
import { scoreCatalogProduct } from '../scripts/lib/catalog-prioritization.mjs';
import { COMMISSION_SCHEDULE, resolveCommissionClassification } from '../scripts/lib/commission-evidence.mjs';
import { readProducts } from '../scripts/lib/content-utils.mjs';

const now = new Date('2026-09-05T14:00:00Z');
const product = (overrides = {}) => ({ asin: 'B000000001', slug: 'fixture-plug', category: 'smart-plug', file: 'src/content/products/fixture.yaml', name: 'Fixture', catalogActive: true, ...overrides });
const review = (overrides = {}) => ({ asin: 'B000000001', market: 'US', state: 'approved', amazonCategory: 'home', rate: 0.03,
  scheduleVersion: COMMISSION_SCHEDULE.version, rateSource: COMMISSION_SCHEDULE.source,
  classificationEvidence: 'fixture:approved-asin-classification', reviewedAt: '2026-09-05T12:00:00Z', validUntil: '2026-09-06T12:00:00Z', ...overrides });

test('manual commercial and ROI fields cannot change discovery scores, order or approval', () => {
  const products = [product(), product({ asin: 'B000000002', slug: 'second' })];
  const baseline = buildDiscoveryReport(products, { now });
  const inflated = buildDiscoveryReport(products.map((p) => ({ ...p, price: 999999, priceSource: 'manual', ownerRating: 5, ownerRatingCount: 99999999,
    discountPct: 99, priority: 'hero', priorityScore: 999999, roiApproved: true, estimatedCommission: 999999, commissionRate: 1 })), { now });
  assert.deepEqual(inflated, baseline);
  assert.equal(baseline.automatedApprovals, 0);
  assert.equal(baseline.evaluations[0].dealScore.score, 15);
  assert.equal(baseline.evaluations[0].dealScore.coverage, 15);
  assert.equal(baseline.evaluations[0].dealScore.missing.length, 6);
  assert.equal(baseline.evaluations[0].estimatedCommission, null);
  assert.equal(baseline.evaluations[0].commission.rate, null);
});

test('unknown/inactive classifications or missing local provenance do not earn relevance', () => {
  for (const overrides of [{ category: 'invented' }, { file: undefined }, { file: '../outside.yaml' }, { catalogActive: false }]) {
    const scores = scoreCatalogProduct(product(overrides));
    for (const score of Object.values(scores)) { assert.equal(score.score, null); assert.equal(score.coverage, 0); }
  }
  const scores = scoreCatalogProduct(product());
  assert.equal(scores.trendScore.score, 30);
  assert.equal(scores.trendScore.coverage, 30, 'partial score is not inflated to 100');
  assert.equal(scores.opportunityScore.score, 15);
  assert.equal(buildDiscoveryReport([product({ catalogActive: false })], { now }).reviewCandidates, 0);
});

test('discovery is deterministic, detects ambiguous identities and rejects invalid reference/market', () => {
  const products = [product({ slug: 'z' }), product({ asin: 'B000000002', slug: 'a' })];
  assert.deepEqual(buildDiscoveryReport(products, { now }), buildDiscoveryReport([...products].reverse(), { now }));
  assert.equal(buildDiscoveryReport([product(), product({ slug: 'other' })], { now }).evaluations.length, 0);
  assert.equal(buildDiscoveryReport([product(), product({ asin: 'B000000002' })], { now }).evaluations.length, 0);
  assert.equal(buildDiscoveryReport([product({ asin: 'invalid' }), product({ market: 'CA' })], { now }).anomalies.length, 2);
  assert.throws(() => buildDiscoveryReport(products, { now: '2026-02-30T00:00:00Z' }), /invalid_discovery_reference/);
});

test('commission requires independently reviewed ASIN classification, not a generic type or rate table', () => {
  for (const category of ['smart-display', 'smart-hub', 'security-camera', 'all-other', 'toString']) {
    assert.equal(resolveCommissionClassification(product({ market: 'US', category }), [], now).rate, null);
  }
  const exact = product({ market: 'US' });
  const valid = resolveCommissionClassification(exact, [review()], now);
  assert.equal(valid.rate, 0.03);
  assert.equal(valid.amazonCategory, 'home');
  assert.equal(valid.status, 'reviewed');
  assert.equal(resolveCommissionClassification(exact, [review({ amazonCategory: 'gift-cards', rate: 0 })], now).rate, 0, 'known zero is not a fallback 4%');
  const ranked = buildDiscoveryReport([product()], { now, commissionClassifications: [review()] });
  assert.deepEqual(ranked.evaluations[0].dealScore, scoreCatalogProduct(product()).dealScore);
  assert.equal(ranked.evaluations[0].estimatedCommission, null, 'a classification is not qualified revenue');
  assert.equal(ranked.automatedApprovals, 0);
});

test('wrong, revoked, expired, duplicate and unsubstantiated commission records remain null', () => {
  const exact = product({ market: 'US' });
  for (const overrides of [{ asin: 'B000000002' }, { market: 'CA' }, { state: 'revoked' }, { state: 'pending' }, { validUntil: now.toISOString() },
    { reviewedAt: '2026-09-06T00:00:00Z' }, { reviewedAt: '2026-02-30T00:00:00Z' }, { reviewedAt: '2026-09-04T00:00:00Z' },
    { rate: '0.03' }, { rate: 0.04 }, { amazonCategory: 'smart-plug' }, { scheduleVersion: 'old' }, { classificationEvidence: '' },
    { classificationEvidence: COMMISSION_SCHEDULE.source }, { rateSource: 'https://example.test' }]) {
    assert.equal(resolveCommissionClassification(exact, [review(overrides)], now).rate, null, JSON.stringify(overrides));
  }
  assert.equal(resolveCommissionClassification(exact, [review(), review()], now).rate, null);
  assert.equal(resolveCommissionClassification(product({ market: 'CA' }), [review()], now).rate, null);
});

test('all 28 real catalog records are review-only with unknown commissions and no ROI fields', () => {
  const products = readProducts();
  assert.equal(products.length, 28);
  for (const p of products) for (const field of ['priority', 'priorityScore', 'roiApproved']) assert.equal(field in p, false, `${p.slug}: ${field}`);
  const registry = JSON.parse(readFileSync(new URL('../data/amazon-commission-classifications.json', import.meta.url), 'utf8'));
  assert.deepEqual(registry.classifications, []);
  const report = buildDiscoveryReport(products, { now, commissionClassifications: registry.classifications });
  assert.equal(report.evaluations.length, 28);
  assert.equal(report.automatedApprovals, 0);
  assert.deepEqual(report.anomalies, []);
  for (const row of report.evaluations) {
    assert.equal(row.commission.rate, null);
    assert.equal(row.commission.amazonCategory, null);
    assert.equal(row.dealScore.coverage, 15);
    assert.equal(row.state, 'needs-review');
  }
});

test('retired ROI implementations, live reports and public consumers cannot reappear', () => {
  for (const path of ['scripts/lib/internal-roi.mjs', 'src/lib/roi.ts', 'src/lib/commission-rates.ts', 'data/internal-product-radar.json', 'data/product-discovery-report.json']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false, path);
  }
  for (const path of ['src/components/ProductCard.astro', 'src/pages/quiz.astro', 'src/lib/quiz-recommend.ts', 'src/content.config.ts']) {
    assert.doesNotMatch(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), /data\.priority|product\.priority|priorityScore|roiApproved|Top pick|editorial-priority/);
  }
});

test('real discovery CLI writes only a review report outside published sources', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'flowhome-discovery-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, 'src/content/products'), { recursive: true }); mkdirSync(join(dir, 'data'));
  const source = 'asin: B000000001\nslug: fixture-plug\nname: Fixture\ncategory: smart-plug\nprice: 999999\nownerRating: 5\nownerRatingCount: 99999999\nroiApproved: true\n';
  writeFileSync(join(dir, 'src/content/products/fixture.yaml'), source);
  writeFileSync(join(dir, 'data/amazon-commission-classifications.json'), JSON.stringify({ schemaVersion: 1, market: 'US', classifications: [] }));
  const cli = fileURLToPath(new URL('../scripts/discovery/product-discovery.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [cli], { cwd: dir, encoding: 'utf8', windowsHide: true, env: { ...process.env, FLOWHOME_ROI_PHASE: 'growth' } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /retired and ignored/);
  assert.match(result.stdout, /0 automated approvals/);
  assert.equal(readFileSync(join(dir, 'src/content/products/fixture.yaml'), 'utf8'), source);
  const report = JSON.parse(readFileSync(join(dir, 'reports/discovery/product-review.json'), 'utf8'));
  assert.equal(report.evaluations[0].dealScore.coverage, 15);
  assert.equal(report.evaluations[0].estimatedCommission, null);
  assert.equal(existsSync(join(dir, 'data/internal-product-radar.json')), false);
});
