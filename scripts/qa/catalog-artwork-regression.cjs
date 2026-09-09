async page => {
  // Runtime consistency check. Manufacturer fidelity remains a separate editorial review.
  const origin = 'http://127.0.0.1:4339';
  const results = [];
  const errors = [];
  const check = (condition, message) => { if (!condition) throw Error(message); };
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(origin + '/products/');
    const cards = page.locator('.product-card');
    const catalog = [];
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const img = card.locator('.product-card-image');
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(image => image.decode());
      catalog.push(await card.evaluate(card => {
        const image = card.querySelector('.product-card-image');
        const details = card.querySelector('[data-product-action="details"]');
        const amazon = card.querySelector('[data-fh-amazon-cta]');
        const saved = card.querySelector('[data-flow-cart-add]');
        return { name: card.querySelector('.product-card-title').textContent.trim(),
          slug: amazon.dataset.productSlug, asin: amazon.dataset.asin, category: amazon.dataset.category,
          image: image.getAttribute('src'), selected: new URL(image.currentSrc).pathname, alt: image.alt,
          caption: card.querySelector('[data-image-source-caption]').textContent.trim(),
          details: details.getAttribute('href'), amazon: amazon.getAttribute('href'), amazonPath: new URL(amazon.href).pathname,
          internalLinks: [...card.querySelectorAll('a[href^="/product/"]')].map(a => a.getAttribute('href')),
          saved: { image: saved.dataset.image, url: saved.dataset.url, asin: saved.dataset.asin, slug: saved.dataset.slug }
        };
      }));
    }
    check(catalog.length === 28, 'Expected the full 28-product catalog');
    check(new Set(catalog.map(item => item.slug)).size === catalog.length, 'Duplicate product slugs');
    check(new Set(catalog.map(item => item.asin)).size === catalog.length, 'Duplicate ASINs');
    const specific = catalog.filter(item => item.image.includes('/models-v1/'));
    check(new Set(specific.map(item => item.image)).size === specific.length, 'Repeated model-specific artwork');
    let profilesPassed = 0;
    for (const item of catalog) {
      try {
        check(item.details === `/product/${item.slug}/`, 'Mismatched product destination');
        check(item.internalLinks.length >= 3 && item.internalLinks.every(url => url === item.details), 'Media/title/details disagree');
        check(item.amazonPath === '/dp/' + item.asin || item.amazonPath === '/dp/' + item.asin + '/', 'Amazon identity mismatch');
        check(item.saved.image === item.image && item.saved.url === item.details && item.saved.asin === item.asin && item.saved.slug === item.slug, 'Saved-list payload mismatch');
        check(item.selected === item.image.replace(/\.webp$/, '-240.webp'), 'Missing DPR1 catalog thumbnail');
        check(/not a (product )?photo/.test(item.caption), 'Missing illustration disclosure');
        const response = await page.goto(origin + item.details);
        check(response.ok(), 'Profile HTTP failure');
        check((await page.locator('h1').textContent()).trim() === item.name, 'Profile name mismatch');
        const image = page.locator('img[src="' + item.image + '"]').first();
        await image.evaluate(image => image.decode());
        check(await image.getAttribute('alt') === item.alt, 'Profile alt mismatch');
        const scope = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
        check((await scope.locator('[data-image-source-caption]').textContent()).trim() === item.caption, 'Profile caption mismatch');
        check(await page.locator('[data-cta-position="product_profile"]').getAttribute('href') === item.amazon, 'Profile Amazon destination mismatch');
        check(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), 'Profile horizontal overflow');
        profilesPassed++;
      } catch (error) { errors.push({ width, slug: item.slug, message: error.message }); }
    }
    results.push({ width, catalog: catalog.length, profilesPassed, modelArtwork: specific.length, genericArtwork: catalog.length - specific.length });
  }
  if (errors.length) throw Error(JSON.stringify({ results, errors }));
  return { results, scope: 'catalog and all product profiles; source fidelity is not certified by DOM consistency' };
}
