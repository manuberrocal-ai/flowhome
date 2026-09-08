import assert from 'node:assert/strict';
import test from 'node:test';
import { availabilityPermissionFor, validateCommercialEvidence } from '../src/lib/blocks/block8/evidence.ts';
import { isOfferPromotable } from '../src/lib/blocks/block8/freshness.ts';
import { ingestOffers } from '../src/lib/blocks/block8/ingestion.ts';
import { applyOverride } from '../src/lib/blocks/block8/admin.ts';
import { NOW, offerFixture, evidenceFixture } from './helpers/block8-fixtures.mjs';

const ingest = (offer, evidence) => ingestOffers([{ ...offer, snapshotId: offer.lastSnapshotId }], { ...evidence, existingSnapshotKeys: new Set(), existingOfferKeys: new Set(), existingTrendKeys: new Set(), historyByVariant: new Map() }, NOW)[0];

test('price-only rights keep price evidence valid but cannot ingest or promote availability', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  delete evidence.sourcePermissions[0].availability;
  assert.equal(validateCommercialEvidence(offer, evidence, NOW), null);
  assert.equal(availabilityPermissionFor(offer, evidence, NOW), null);
  assert.equal(isOfferPromotable(offer, NOW, evidence).promotable, false);
  assert.equal(ingest(offer, evidence).status, 'rejected');
  assert.equal(applyOverride({ targetId: offer.id, targetType: 'offer', action: 'override_promote', actorId: 'fixture-reviewer', note: null, now: NOW }, offer, evidence).changed, false);
});

test('availability has explicit independent rights, strict validity and its own TTL', () => {
  for (const patch of [{ state: 'revoked' }, { state: 'unknown' }, { permissionId: 'fixture:current-permission' }, { permissionId: '' }, { validUntil: NOW }, { validUntil: 'bad' }, { validFrom: NOW }, { maxAgeMs: 3_600_000 }, { maxAgeMs: 86_400_001 }, { maxAgeMs: 0 }, { maxAgeMs: '86400000' }]) {
    const offer = offerFixture(); const evidence = evidenceFixture(offer);
    Object.assign(evidence.sourcePermissions[0].availability, patch);
    assert.equal(availabilityPermissionFor(offer, evidence, NOW), null, JSON.stringify(patch));
    assert.equal(isOfferPromotable(offer, NOW, evidence).promotable, false);
    assert.equal(ingest(offer, evidence).status, 'rejected');
  }
});

test('earlier availability expiry caps the offer without renewing either capture', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  evidence.sourcePermissions[0].availability.validUntil = '2026-07-30T12:01:00Z';
  const result = ingest(offer, evidence);
  assert.equal(result.status, 'inserted');
  assert.equal(result.entity.expiresAt, '2026-07-30T12:01:00.000Z');
  assert.equal(result.entity.capturedAt, new Date(offer.capturedAt).toISOString());
  assert.equal(isOfferPromotable(offer, '2026-07-30T12:00:59Z', evidence).promotable, true);
  assert.equal(isOfferPromotable(offer, '2026-07-30T12:01:00Z', evidence).promotable, false);
});

test('ambiguous or revoked parent evidence cannot supply availability rights', () => {
  const offer = offerFixture(); const evidence = evidenceFixture(offer);
  evidence.sourcePermissions.push(structuredClone(evidence.sourcePermissions[0]));
  assert.equal(availabilityPermissionFor(offer, evidence, NOW), null);
  evidence.sourcePermissions.pop(); evidence.sourcePermissions[0].state = 'revoked';
  assert.equal(availabilityPermissionFor(offer, evidence, NOW), null);
});

test('availability uses its own capture and TTL rather than borrowing the price clock', () => {
  const offer = offerFixture({ availabilityCapturedAt: '2026-07-30T11:59:30Z', expiresAt: '2026-07-30T12:30:00Z' });
  const evidence = evidenceFixture(offer);
  evidence.sourcePermissions[0].availability.maxAgeMs = 60_000;
  assert.equal(isOfferPromotable(offer, NOW, evidence).promotable, true);
  assert.equal(ingest(offer, evidence).entity.expiresAt, '2026-07-30T12:00:30.000Z');
  assert.equal(isOfferPromotable(offer, '2026-07-30T12:00:30Z', evidence).promotable, false);
  assert.equal(isOfferPromotable({ ...offer, availabilityCapturedAt: '2026-07-30T12:00:01Z' }, NOW, evidence).promotable, false);
});
