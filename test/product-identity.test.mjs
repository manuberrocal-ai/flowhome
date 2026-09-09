import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { getIdentityClaim, getIdentityRows } from '../src/lib/product-identity.ts';

const now = new Date('2026-09-06T18:00:00Z');
const source = { label: 'Test fixture, not product evidence', url: 'https://example.com/manual', accessedAt: '2026-09-06' };
const claim = { value: 'Example model', conditions: 'Documentary observation only', sources: [source] };
const product = { model: 'Example model', asin: 'B012345678', identityEvidence: { model: 'Example model', asin: 'B012345678', claims: { model: claim } } };
const withClaim = (field, value) => ({ ...product, identityEvidence: { ...product.identityEvidence, claims: { [field]: value } } });

test('identity sources belong to one field and exact model/ASIN, not general product sources', () => {
  assert.deepEqual(getIdentityClaim(product, 'model', now), claim);
  assert.equal(getIdentityClaim(product, 'bundle', now), null);
  for (const patch of [{ model: 'Different' }, { asin: 'B098765432' }, { identityEvidence: undefined }, { model: undefined }]) {
    assert.equal(getIdentityClaim({ ...product, ...patch, sources: [source], installation: { sources: [source] } }, 'model', now), null);
  }
  assert.equal(getIdentityClaim(withClaim('asin', claim), 'asin', now), null);
});

test('malformed and future documentary evidence fails closed', () => {
  for (const bad of [null, [], {}, { ...claim, value: '' }, { ...claim, conditions: ' ' }, { ...claim, sources: [] },
    ...['http://example.com', 'javascript:alert(1)', 'https://user:secret@example.com', 'bad'].map(url => ({ ...claim, sources: [{ ...source, url }] })),
    ...['2026-09-07', '2026-02-30', 'invalid'].map(accessedAt => ({ ...claim, sources: [{ ...source, accessedAt }] }))]) {
    assert.equal(getIdentityClaim(withClaim('model', bad), 'model', now), null);
  }
  assert.equal(getIdentityClaim(product, 'toString', now), null);
  assert.equal(getIdentityClaim(product, 'model', new Date('invalid')), null);
});

test('firmware and subscriptions require dated expiry without silently claiming permanent support', () => {
  for (const field of ['firmware', 'subscription']) {
    assert.equal(getIdentityClaim(withClaim(field, claim), field, now), null);
    for (const validUntil of ['2026-09-05', '2026-02-30']) assert.equal(getIdentityClaim(withClaim(field, { ...claim, validUntil }), field, now), null);
    assert.ok(getIdentityClaim(withClaim(field, { ...claim, validUntil: '2026-09-06' }), field, now));
    assert.equal(getIdentityClaim(withClaim(field, { ...claim, validUntil: '2026-09-06' }), field, new Date('2026-09-07')), null);
  }
});

test('every current catalog entry has eight explicit identity slots without installation-derived claims', () => {
  const root = new URL('../src/content/products/', import.meta.url);
  const products = readdirSync(root).filter(file => file.endsWith('.yaml')).map(file => parse(readFileSync(new URL(file, root), 'utf8')));
  assert.equal(products.length, 28);
  for (const item of products) {
    const rows = getIdentityRows(item, now);
    assert.equal(rows.length, 8);
    assert.ok(rows.filter(row => ['firmware', 'subscription'].includes(row.field)).every(row => row.claim === null), item.slug);
    const documented = rows.filter(row => row.claim).length;
    const expected = { 'aqara-motion-sensor-p1': 5, 'philips-hue-white-color-starter-kit': 4, 'roborock-q5-plus': 4, 'tp-link-kasa-smart-plug-mini': 4,
      'schlage-encode-smart-wifi-deadbolt': 3, 'yale-assure-lock-2-wifi': 3, 'eufy-security-indoor-cam-c120': 2,
      'arlo-essential-outdoor-camera': 3, 'aeotec-smartthings-hub': 4, 'echo-show-8-3rd-gen': 3 };
    const additionalAsin = ['govee-rgbic-led-strip-lights', 'meross-smart-garage-door-opener', 'irobot-roomba-j7-plus'].includes(item.slug);
    assert.equal(documented, expected[item.slug] ?? (additionalAsin ? 3 : 2), item.slug);
    if (!expected[item.slug] && !additionalAsin) assert.equal(getIdentityClaim(item, 'asin', now), null, 'A family manual does not verify an ASIN');
    if (item.slug === 'arlo-essential-outdoor-camera') {
      assert.equal(getIdentityClaim(item, 'bundle', now), null);
      assert.match(getIdentityClaim(item, 'model', now).conditions, /one camera.*three/);
    }
    if (item.slug === 'eufy-security-indoor-cam-c120') {
      assert.equal(getIdentityClaim(item, 'generation', now), null);
      assert.match(getIdentityClaim(item, 'model', now).conditions, /suffix remains unresolved/);
    }
    if (documented) {
      assert.ok(rows.filter(row => row.claim).every(row => row.claim.sources.every(source => !source.url.includes('example.com'))));
      assert.ok(getIdentityRows({ ...item, asin: 'B000000000' }, now).every(row => row.claim === null));
      assert.ok(getIdentityRows({ ...item, model: 'Unreviewed revision' }, now).every(row => row.claim === null));
    }
  }
});
