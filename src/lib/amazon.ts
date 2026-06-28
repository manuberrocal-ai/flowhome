/**
 * Amazon Affiliate Link Utilities
 * StoreID: flowhome-20
 */

export const ASSOCIATE_TAG = 'flowhome-20';
export const AMAZON_BASE_URL = 'https://www.amazon.com';

export function buildAffiliateUrl(asin: string): string {
  return `${AMAZON_BASE_URL}/dp/${asin}?tag=${ASSOCIATE_TAG}`;
}

export function buildSearchUrl(query: string): string {
  return `${AMAZON_BASE_URL}/s?k=${encodeURIComponent(query)}&tag=${ASSOCIATE_TAG}`;
}

export function buildCartUrl(asins: string[]): string {
  const items = asins.map((asin, i) => `&ASIN.${i + 1}=${asin}&Quantity.${i + 1}=1`).join('');
  return `${AMAZON_BASE_URL}/gp/aws/cart/add.html?tag=${ASSOCIATE_TAG}${items}`;
}

export function extractAsinFromUrl(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

export function buildImageUrl(asin: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const sizeMap = {
    small: '._SL75_',
    medium: '._SL160_',
    large: '._SL500_',
  };
  return `https://m.media-amazon.com/images/I/${asin}${sizeMap[size]}.jpg`;
}
