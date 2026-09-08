import { illustrationCategories, modelIllustrations, getLocalProductIllustration, getModelIllustration } from './product-image-policy.js';

export const thumbnailWidths = Object.freeze([240, 480, 720, 960]);
export const thumbnailSources = Object.freeze([
  ...illustrationCategories.map(category => `/images/product-art/illustrations-v1/${category}.webp`),
  ...modelIllustrations.map(model => model.image),
]);
export function thumbnailPath(source, width) {
  if (!thumbnailSources.includes(source) || !thumbnailWidths.includes(width)) return undefined;
  return source.replace(/\.webp$/, `-${width}.webp`);
}
export function getProductThumbnailSet(product) {
  const source = getLocalProductIllustration(product);
  return thumbnailWidths.map(width => `${thumbnailPath(source, width)} ${width}w`).join(', ');
}

// Model originals are verified as 1254px squares by product-art-encoding.test.mjs.
// Retain them for large/dense detail views without inventing dimensions for fallbacks.
export function getProductDetailSet(product) {
  const thumbnails = getProductThumbnailSet(product);
  const model = getModelIllustration(product);
  return model ? `${thumbnails}, ${model.image} 1254w` : thumbnails;
}
