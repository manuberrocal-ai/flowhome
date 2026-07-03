const categoryArtwork: Record<string, string> = {
  'smart-thermostat': '/images/product-art/smart-thermostat.svg',
  'security-camera': '/images/product-art/security-camera.svg',
  'video-doorbell': '/images/product-art/video-doorbell.svg',
  'smart-lock': '/images/product-art/smart-lock.svg',
  'robot-vacuum': '/images/product-art/robot-vacuum.svg',
  'smart-lighting': '/images/product-art/smart-lighting.svg',
  'smart-plug': '/images/product-art/smart-plug.svg',
  'smart-speaker': '/images/product-art/smart-speaker.svg',
  'smart-display': '/images/product-art/smart-display.svg',
  'smart-hub': '/images/product-art/smart-hub.svg',
};

const placeholderImage = '/images/product-placeholder.svg';
const defaultArtwork = '/images/product-art/smart-home-device.svg';

export type ProductImageKind = 'product' | 'fallback';

export function getCategoryLabel(category?: string) {
  return (category ?? 'smart-home-device')
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function hasRealProductImage(product: { image?: string }) {
  return Boolean(
    product.image &&
    product.image !== placeholderImage &&
    !product.image.includes('product-placeholder.svg') &&
    !product.image.includes('/images/product-art/')
  );
}

export function getProductFallbackImage(product: { category?: string }) {
  return categoryArtwork[product.category ?? ''] ?? defaultArtwork;
}

export function getProductImageKind(product: { image?: string }) : ProductImageKind {
  return hasRealProductImage(product) ? 'product' : 'fallback';
}

export function getProductImage(product: { image?: string; category?: string }) {
  if (hasRealProductImage(product)) return product.image as string;
  return getProductFallbackImage(product);
}

export function getProductImageAlt(product: { name?: string; category?: string; image?: string }) {
  if (hasRealProductImage(product)) return product.name ?? 'Product image';
  return `${getCategoryLabel(product.category)} product illustration`;
}

export function getProductImageSourceLabel(product: { image?: string }) {
  return hasRealProductImage(product) ? 'Product photo' : 'Representative category image';
}
