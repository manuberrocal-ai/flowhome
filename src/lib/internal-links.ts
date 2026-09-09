/**
 * Internal Links - Automatic related products and cross-linking
 */

import { getDealStatus } from './deal-state';
import { getCollection } from 'astro:content';
import { selectDirectAlternatives } from './product-taxonomy';
import { getCommerceData } from './commerce-data';

export async function getDirectAlternatives(product: any, limit: number = 4) {
  const allProducts = await getCollection('products');
  return selectDirectAlternatives(product, allProducts, limit);
}

export async function getProductsByPriceRange(min: number, max: number, category?: string) {
  const allProducts = await getCollection('products');
  const now = new Date();
  return allProducts
    .filter((p) => {
      const price = getCommerceData(p.data, now).displayPrice;
      const priceMatch = price !== undefined && price >= min && price <= max;
      const categoryMatch = category ? p.data.category === category : true;
      return priceMatch && categoryMatch && p.data.catalogActive;
    })
    .sort((a, b) => getCommerceData(a.data, now).displayPrice! - getCommerceData(b.data, now).displayPrice!);
}

export async function getProductsUnderPrice(category: string, maxPrice: number) {
  const allProducts = await getCollection('products');
  const now = new Date();
  return allProducts
    .filter((p) => {
      const price = getCommerceData(p.data, now).displayPrice;
      return p.data.category === category && price !== undefined && price <= maxPrice && p.data.catalogActive;
    })
    .sort((a, b) => (getCommerceData(b.data, now).displayRating ?? 0) - (getCommerceData(a.data, now).displayRating ?? 0) || a.data.slug.localeCompare(b.data.slug));
}

export async function getTopRatedProducts(category: string, limit: number = 5) {
  const allProducts = await getCollection('products');
  const now = new Date();
  return allProducts
    .filter((p) => p.data.category === category && p.data.catalogActive && getCommerceData(p.data, now).isRatingFresh)
    .sort((a, b) => getCommerceData(b.data, now).displayRating! - getCommerceData(a.data, now).displayRating! || a.data.slug.localeCompare(b.data.slug))
    .slice(0, limit);
}

export async function getBestDeals(limit: number = 6, now: Date = new Date()) {
  const allDeals = await getCollection('deals');
  const commerce = (deal: (typeof allDeals)[number]) => getCommerceData({ ...deal.data, price: deal.data.dealPrice }, now);
  return allDeals
    .filter((d) => getDealStatus({ start: d.data.startDate, end: d.data.endDate }, now).status === 'active' && commerce(d).showPromotion)
    .sort((a, b) => commerce(b).displayDiscountPct! - commerce(a).displayDiscountPct!)
    .slice(0, limit);
}
