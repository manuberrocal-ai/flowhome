/** Synthetic rights and observations only. Never production permission evidence. */
export const NOW = '2026-07-30T12:00:00Z';
export const CAPTURED = '2026-07-30T11:00:00Z';

export function offerFixture(overrides = {}) {
  return { id: 'o1', variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', source: 'affiliate-feed', price: 100, listPrice: 140, capturedAt: CAPTURED, expiresAt: null, availability: 'in-stock', availabilityCapturedAt: CAPTURED, lastSnapshotId: 's1', lifecycle: 'active', review: 'approved', shipping: { cost: null, freeShipping: true, conditions: null, etaDays: null }, coupons: [], affiliateUrl: null, confidence: 'low', ...overrides };
}

export function snapshotFixture(overrides = {}) {
  return { id: 's1', variantId: 'v1', merchantId: 'm1', market: 'US', currency: 'USD', source: 'affiliate-feed', price: 100, listPrice: 140, capturedAt: CAPTURED, anomaly: false, idempotencyKey: 'fixture:s1', affiliateUrl: null, ...overrides };
}

export function evidenceFixture(offer = offerFixture(), history = []) {
  return {
    knownMerchants: [{ id: 'm1', authorised: true, market: 'US', currency: 'USD' }],
    knownVariants: [{ id: 'v1', marketplaceId: 'B0FIXTURE01', marketplaceIdType: 'asin', market: 'US', currency: 'USD' }],
    snapshotsById: new Map([...history.map((snapshot) => [snapshot.id, snapshot]), [offer.lastSnapshotId, snapshotFixture({ id: offer.lastSnapshotId, price: offer.price, listPrice: offer.listPrice, source: offer.source, capturedAt: offer.capturedAt })]]),
    sourcePermissions: [{ permissionId: 'fixture:current-permission', source: offer.source, merchantId: 'm1', market: 'US', currency: 'USD', state: 'approved', validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T00:00:00Z', currentPriceAllowed: true, maxAgeMs: 86_400_000, history: { permissionId: 'fixture:separate-history-permission', floorClaimsAllowed: true, retainForMs: 90 * 86_400_000 } }],
  };
}
