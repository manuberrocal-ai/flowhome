const representativeAlt = 'Representative category illustration; not a product photo';
const representativeCaption = 'Category illustration — not a product photo';
const unavailableLabel = 'Product image unavailable';
const installations = new WeakMap();

export function resolveImageFallback(candidate, pageUrl) {
  if (typeof candidate !== 'string' || !candidate.trim()) return null;
  try {
    const page = new URL(pageUrl);
    const fallback = new URL(candidate, page);
    if (!['http:', 'https:'].includes(fallback.protocol) || fallback.origin !== page.origin || fallback.username || fallback.password) return null;
    fallback.hash = '';
    return fallback.href;
  } catch {
    return null;
  }
}

export function setupImageFallbacks({ documentRef = globalThis.document, windowRef = globalThis.window } = {}) {
  if (!documentRef || !windowRef?.HTMLImageElement) return () => {};
  if (installations.has(documentRef)) return installations.get(documentRef);
  const originals = new WeakMap();
  const isImage = (node) => node instanceof windowRef.HTMLImageElement;
  const getFallback = (image) => resolveImageFallback(image.dataset.fallbackSrc, windowRef.location.href);
  const sourceIsFallback = (image, fallback) => {
    try {
      const source = new URL(image.src, windowRef.location.href);
      source.hash = '';
      return source.href === fallback && !image.getAttribute('srcset');
    } catch {
      return false;
    }
  };
  const captionFor = (image) => image.closest('[data-image-fallback-scope]')?.querySelector('[data-image-source-caption]');
  const label = (image, unavailable = false, preserveCategoryAlt = false) => {
    const alt = unavailable ? unavailableLabel : representativeAlt;
    const alreadyDescriptive = preserveCategoryAlt && !unavailable && /category illustration; not a photo of /i.test(image.alt);
    // An explicitly empty alt is decorative, including when its source fails.
    if (image.alt && image.alt !== alt && !alreadyDescriptive) image.alt = alt;
    const caption = captionFor(image);
    const text = unavailable ? unavailableLabel : representativeCaption;
    if (caption && caption.textContent !== text) caption.textContent = text;
  };
  const recover = (image, failed = false) => {
    if (!isImage(image)) return;
    const fallback = getFallback(image);
    if (!fallback) return;
    if (sourceIsFallback(image, fallback)) {
      label(image, failed || (image.complete && image.naturalWidth === 0), true);
      return;
    }
    if (!image.complete || image.naturalWidth > 0) return;
    const previous = originals.get(image);
    originals.set(image, {
      src: image.src,
      alt: image.alt === representativeAlt || image.alt === unavailableLabel ? previous?.alt ?? '' : image.alt,
      caption: previous?.caption ?? captionFor(image)?.textContent,
    });
    label(image);
    // A responsive candidate must not keep winning over the local fallback.
    image.removeAttribute('srcset');
    image.src = fallback;
  };
  const onError = (event) => recover(event.target, true);
  const onLoad = (event) => {
    const image = event.target;
    if (!isImage(image)) return;
    const fallback = getFallback(image);
    if (fallback && sourceIsFallback(image, fallback)) {
      label(image, false, true);
      return;
    }
    const previous = originals.get(image);
    if (!previous) return;
    if (image.src === previous.src && [representativeAlt, unavailableLabel].includes(image.alt)) image.alt = previous.alt;
    const caption = captionFor(image);
    if (image.src === previous.src && caption && previous.caption !== undefined) caption.textContent = previous.caption;
    originals.delete(image);
  };
  const inspect = (node) => {
    if (isImage(node)) recover(node);
    node.querySelectorAll?.('img[data-fallback-src]').forEach((image) => recover(image));
  };
  documentRef.addEventListener('error', onError, true);
  documentRef.addEventListener('load', onLoad, true);
  const observer = windowRef.MutationObserver ? new windowRef.MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') recover(record.target);
      else record.addedNodes.forEach(inspect);
    }
  }) : null;
  observer?.observe(documentRef.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'alt', 'data-fallback-src'],
  });
  // Capture cached failures that fired before this deferred script initialized.
  inspect(documentRef);
  const cleanup = () => {
    documentRef.removeEventListener('error', onError, true);
    documentRef.removeEventListener('load', onLoad, true);
    observer?.disconnect();
    installations.delete(documentRef);
  };
  installations.set(documentRef, cleanup);
  return cleanup;
}
