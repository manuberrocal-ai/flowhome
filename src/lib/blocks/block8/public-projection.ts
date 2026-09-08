/** Server integration only: no endpoint, default provider or permission discovery. */
import { getCommerceData, type CommerceProduct } from '../../commerce-data.ts';
import { toStrictUtc, type Offer } from './domain.ts';
import { availabilityPermissionFor, sourcePermissionFor, validateCommercialEvidence, type CommercialEvidenceContext } from './evidence.ts';

/**
 * The caller must read the reviewed offer and evidence from trusted, revocation-aware
 * server storage. These objects are not authentication and must not come from a
 * request body. Recompute per request; do not cache the returned projection.
 * The normal Astro static-commerce guard remains authoritative even here.
 */
export function projectAuthorizedCommerce(asin: string, offer: Offer, evidence: CommercialEvidenceContext | undefined, now: Date | string = new Date()) {
  const empty = () => getCommerceData({}, now);
  if (!/^[A-Z0-9]{10}$/.test(asin) || !evidence || !toStrictUtc(now)
    || offer.source !== 'amazon-creators-api' || offer.market !== 'US' || offer.currency !== 'USD'
    || offer.lifecycle !== 'active' || offer.review !== 'approved'
    || validateCommercialEvidence(offer, evidence, now)) return empty();
  const variants = evidence.knownVariants.filter(variant => variant.id === offer.variantId);
  if (variants.length !== 1 || variants[0].marketplaceIdType !== 'asin' || variants[0].marketplaceId !== asin) return empty();
  try {
    const url = new URL(offer.affiliateUrl ?? '');
    const params = [...url.searchParams.entries()];
    if (url.protocol !== 'https:' || url.hostname !== 'www.amazon.com' || url.username || url.password || url.port || url.hash
      || url.pathname !== `/dp/${asin}` || params.length !== 1 || params[0][0] !== 'tag' || params[0][1] !== 'flowhome-20') return empty();
  } catch { return empty(); }
  const grant = sourcePermissionFor(offer, evidence, now)!;
  const deadline = Math.min(Date.parse(offer.capturedAt) + grant.maxAgeMs, Date.parse(grant.validUntil), offer.expiresAt == null ? Infinity : Date.parse(offer.expiresAt));
  if (Date.parse(toStrictUtc(now)!) >= deadline) return empty();
  const product: CommerceProduct = {
    asin, affiliateUrl: offer.affiliateUrl!, price: offer.price, priceSource: 'amazon-creators-api',
    priceLastChecked: offer.capturedAt, priceValidUntil: new Date(deadline).toISOString(),
  };
  const availability = availabilityPermissionFor({ ...offer, capturedAt: offer.availabilityCapturedAt }, evidence, now);
  if (availability && ['in-stock', 'out-of-stock', 'preorder', 'discontinued'].includes(offer.availability)) {
    product.availabilityStatus = offer.availability as CommerceProduct['availabilityStatus'];
    product.availabilitySource = 'amazon-creators-api';
    product.availabilityLastChecked = offer.availabilityCapturedAt;
    product.availabilityValidUntil = new Date(Math.min(deadline, Date.parse(availability.expiresAt))).toISOString();
  }
  // No reference-price, discount, coupons or rating rights are inferred.
  return getCommerceData(product, now);
}
