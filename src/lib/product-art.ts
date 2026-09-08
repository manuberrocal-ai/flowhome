import { getCategoryIllustration, getLocalProductIllustration, getModelIllustration, getIllustrationCaption } from './product-image-policy.js';
import { thumbnailPath } from './product-thumbnails.js';

export type ProductImageKind = 'product' | 'fallback';

export function getCategoryLabel(category?: string) {
  return (category ?? 'smart-home-device')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function hasRealProductImage(product: { image?: string }) {
  // Image URLs alone do not establish permission. Editorial A uses illustrations only.
  void product;
  return false;
}

export function getProductFallbackImage(product: { category?: string }) {
  const source = getCategoryIllustration(product.category);
  return thumbnailPath(source, 960) ?? source;
}

export function getProductImageKind(product: { image?: string }) : ProductImageKind {
  return hasRealProductImage(product) ? 'product' : 'fallback';
}

export function getProductImage(product: { image?: string; category?: string }) {
  return getLocalProductIllustration(product);
}

export function getProductImageAlt(product: { name?: string; category?: string; image?: string }) {
  const model = getModelIllustration(product);
  if (model) return model.alt;
  return `${getCategoryLabel(product.category)} category illustration; not a photo of ${product.name ?? 'the product'}`;
}

export function getProductImageSourceLabel(product: { image?: string }) {
  return getIllustrationCaption(product);
}
