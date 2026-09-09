import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { getProductFeatures } from '../src/lib/product-specs.ts';
import { catalogEvidenceCases } from '../scripts/qa/viewport-cases.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const product = (slug) => parse(read(`src/content/products/${slug}.yaml`));
const note = (record) => (record.compatibilityNotes ?? []).join(' ');
const sourceHosts = (record) => (record.sources ?? []).map(({ url }) => new URL(url).hostname);

test('browser evidence covers each corrected profile and review on desktop and mobile', () => {
  const cases = catalogEvidenceCases();
  assert.equal(cases.length, 10);
  assert.equal(new Set(cases.map(({ name }) => name)).size, 10);
  assert.equal(new Set(cases.map(({ path }) => path)).size, 5);
  for (const path of new Set(cases.map(({ path }) => path))) {
    assert.deepEqual(cases.filter((item) => item.path === path).map(({ width }) => width), [390, 1440]);
  }
  for (const item of cases) {
    assert.ok(item.evidenceTerms.length >= 3);
    assert.equal(item.expectedStatus, 200);
  }
});

test('documented Echo Dot and Nest Hub controllers retain Matter with explicit role and setup limits', () => {
  const echo = product('echo-dot-5th-gen');
  const nest = product('google-nest-hub-2nd-gen');
  for (const record of [echo, nest]) {
    assert.equal(record.matter, true, record.slug);
    assert.equal(getProductFeatures(record).find(({ label }) => label === 'Matter')?.value, 'Catalog: Yes (unverified)');
    assert.match(note(record), /controller/i);
    assert.match(note(record), /supported device types/i);
  }
  assert.ok(sourceHosts(echo).includes('developer.amazon.com'));
  assert.match(note(echo), /separate Thread border router/i);
  assert.ok(sourceHosts(nest).includes('support.google.com'));
  assert.match(note(nest), /built-in Thread border router/i);
  assert.match(note(nest), /IPv6/);
});

test('Blind Tilt describes native Bluetooth separately from hub-dependent remote and Matter paths', () => {
  const blind = product('switchbot-blind-tilt');
  assert.equal(blind.wifi, false);
  assert.equal(blind.bluetooth, true);
  assert.equal(blind.matter, true, 'The documented bridge path must not be presented as unsupported');
  assert.equal(blind.appleHomeKit, true, 'Apple Home support is conditional on the documented bridge and controller');
  assert.equal(getProductFeatures(blind).find(({ label }) => label === 'Wi-Fi')?.value, 'Catalog: No (unverified)');
  assert.equal(getProductFeatures(blind).find(({ label }) => label === 'Matter')?.value, 'Catalog: Yes (unverified)');
  assert.equal(getProductFeatures(blind).find(({ label }) => label === 'Apple HomeKit')?.value, 'Catalog: Yes (unverified)');
  assert.match(note(blind), /Bluetooth-only/i);
  assert.match(note(blind), /separate.*hub/i);
  assert.match(note(blind), /Matter bridge/i);
  assert.match(note(blind), /not.*native Matter/i);
  assert.ok(sourceHosts(blind).includes('us.switch-bot.com'));
  assert.ok(sourceHosts(blind).includes('support.switch-bot.com'));
});

test('connectivity corrections retain commercial provenance and reconcile both existing reviews', () => {
  for (const slug of ['echo-dot-5th-gen', 'google-nest-hub-2nd-gen', 'switchbot-blind-tilt']) {
    const record = product(slug);
    assert.equal(record.priceSource, 'manual');
    assert.equal(record.reviewedBy, undefined);
    assert.equal(record.humanReviewedDate, undefined);
    for (const source of record.sources ?? []) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.match(source.accessedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(record.priceLastChecked < source.accessedAt, 'Document access must not renew commercial observations');
    }
  }
  const echoReview = read('src/content/reviews/echo-dot-5th-gen-review.md');
  const nestReview = read('src/content/reviews/google-nest-hub-2nd-gen-review.md');
  assert.match(echoReview, /Matter controller/i);
  assert.match(echoReview, /separate Thread border router/i);
  assert.match(nestReview, /Matter controller/i);
  assert.match(nestReview, /built-in Thread border router/i);
});
