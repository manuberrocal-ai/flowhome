/**
 * Internal Links - Automatic related products and cross-linking
 */

import { getCollection } from 'astro:content';

export async function getRelatedProducts(category: string, currentSlug: string, limit: number = 4) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => p.data.category === category && p.slug !== currentSlug)
    .slice(0, limit);
}

export async function getProductsByPriceRange(min: number, max: number, category?: string) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => {
      const priceMatch = p.data.price >= min && p.data.price <= max;
      const categoryMatch = category ? p.data.category === category : true;
      return priceMatch && categoryMatch && p.data.available;
    })
    .sort((a, b) => a.data.price - b.data.price);
}

export async function getProductsUnderPrice(category: string, maxPrice: number) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => p.data.category === category && p.data.price <= maxPrice && p.data.available)
    .sort((a, b) => b.data.rating - a.data.rating);
}

export async function getTopRatedProducts(category: string, limit: number = 5) {
  const allProducts = await getCollection('products');
  return allProducts
    .filter((p) => p.data.category === category && p.data.available)
    .sort((a, b) => b.data.rating - a.data.rating)
    .slice(0, limit);
}

export async function getBestDeals(limit: number = 6) {
  const allDeals = await getCollection('deals');
  return allDeals
    .filter((d) => new Date(d.data.endDate) > new Date())
    .sort((a, b) => b.data.discountPct - a.data.discountPct)
    .slice(0, limit);
}
