/**
 * Internal Links - Automatic related products and cross-linking
 */

import { getDealStatus } from './deal-state';
import { getCollection } from 'astro:content';
import { selectDirectAlternatives } from './product-taxonomy';

export async function getDirectAlternatives(product: any, limit: number = 4) {
  const allProducts = await getCollection('products');
  return selectDirectAlternatives(product, allProducts, limit);
}

export async function getProductsByPriceRange(min: number, max: number, category?: string) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => {
      const priceMatch = p.data.price >= min && p.data.price <= max;
      const categoryMatch = category ? p.data.category === category : true;
      return priceMatch && categoryMatch && p.data.catalogActive;
    })
    .sort((a, b) => a.data.price - b.data.price);
}

export async function getProductsUnderPrice(category: string, maxPrice: number) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => p.data.category === category && p.data.price <= maxPrice && p.data.catalogActive)
    .sort((a, b) => b.data.ownerRating - a.data.ownerRating);
}

export async function getTopRatedProducts(category: string, limit: number = 5) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => p.data.category === category && p.data.catalogActive)
    .sort((a, b) => b.data.ownerRating - a.data.ownerRating)
    .slice(0, limit);
}

export async function getBestDeals(limit: number = 6, now: Date = new Date()) {
  const allDeals = await getCollection('deals');
  return allDeals
    .filter((d) => getDealStatus({ start: d.data.startDate, end: d.data.endDate }, now).status === 'active')
    .sort((a, b) => b.data.discountPct - a.data.discountPct)
    .slice(0, limit);
}
