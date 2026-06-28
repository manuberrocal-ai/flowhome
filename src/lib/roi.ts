/**
 * ROI Calculator - Automatic product selection system
 * Filters products by minimum commission margin and calculates priority score
 */

import { getCommissionRate } from './commission-rates';

export const MIN_COMMISSION_SEED = 1.00;
export const MIN_COMMISSION_GROWTH = 5.00;

export type Priority = 'rejected' | 'standard' | 'featured' | 'hero';

export interface Product {
  asin: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  rating: number;
  reviewCount: number;
  discountPct?: number;
  trendScore?: number;
}

export interface ROIResult {
  approved: boolean;
  commission: number;
  priority: Priority;
  priorityScore: number;
  reason: string;
}

export function evaluateProduct(
  product: Product,
  phase: 'seed' | 'growth' = 'growth'
): ROIResult {
  const commissionRate = getCommissionRate(product.category);
  const commission = product.price * commissionRate;
  const minCommission = phase === 'seed' ? MIN_COMMISSION_SEED : MIN_COMMISSION_GROWTH;

  if (commission < minCommission) {
    return {
      approved: false,
      commission,
      priority: 'rejected',
      priorityScore: 0,
      reason: `Commission $${commission.toFixed(2)} below minimum $${minCommission.toFixed(2)}`,
    };
  }

  let score = commission * 10;

  const discountPct = product.discountPct || 0;
  if (discountPct > 30) score += 20;
  else if (discountPct > 20) score += 10;

  if (product.rating > 4.5) score += 15;
  else if (product.rating > 4.0) score += 8;

  const trendScore = product.trendScore || 0;
  if (trendScore > 70) score += 25;
  else if (trendScore > 40) score += 12;

  if (product.reviewCount > 1000) score += 10;
  else if (product.reviewCount > 500) score += 5;

  if (product.price >= 200 && product.price <= 600) score += 20;
  else if (product.price >= 100 && product.price < 200) score += 10;

  let priority: Priority;
  if (score >= 80) priority = 'hero';
  else if (score >= 50) priority = 'featured';
  else priority = 'standard';

  return {
    approved: true,
    commission,
    priority,
    priorityScore: Math.round(score),
    reason: `Approved: $${commission.toFixed(2)} commission, score ${Math.round(score)}`,
  };
}

export function filterApprovedProducts(
  products: Product[],
  phase: 'seed' | 'growth' = 'growth'
): Product[] {
  return products.filter((p) => evaluateProduct(p, phase).approved);
}

export function sortProductsByPriority(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const roiA = evaluateProduct(a);
    const roiB = evaluateProduct(b);
    return roiB.priorityScore - roiA.priorityScore;
  });
}
