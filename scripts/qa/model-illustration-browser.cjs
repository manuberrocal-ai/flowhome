async page => {
  const modelPath = '/images/product-art/models-v1/echo-dot-5th-gen.webp';
  const modelCaption = 'Echo Dot 5th Gen illustration — not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/product/echo-dot-5th-gen/', '/review/echo-dot-5th-gen-review/', '/search/?q=Echo%20Dot', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Echo Dot');
      const img = page.locator('img[src="' + modelPath + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async image => { await image.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== modelCaption) throw new Error('Wrong caption ' + route);
      if (!(await img.getAttribute('alt')).includes('without clock')) throw new Error('Wrong alt');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow ' + route);
      if (route === '/') {
        const captionFits = await page.locator('[data-hero-field="image-caption"]').evaluate(el => {
          const caption = el.getBoundingClientRect();
          const stage = el.closest('.hero-product-stage').getBoundingClientRect();
          return caption.height > 0 && caption.bottom <= stage.bottom + 1 && caption.top >= stage.top;
        });
        if (!captionFits) throw new Error('Hero caption clipped');
        await page.screenshot({ path: 'docs/project/FH09D-echo-' + width + '.png' });
        await page.locator('.hero-next').click();
        if (await page.locator('[data-hero-field="image-caption"]').textContent() !== 'Kasa EP10 illustration — one unit, not a product photo') throw new Error('Caption did not rotate');
        await page.locator('.hero-prev').click();
        if (await page.locator('[data-hero-field="image-caption"]').textContent() !== modelCaption) throw new Error('Model caption did not return');
      }
      if (route.startsWith('/product/')) {
        if (await page.locator('meta[property="og:image:alt"]').getAttribute('content') !== modelCaption) throw new Error('Wrong social image caption');
      }
      results.push({ width, route, modelImage: true, caption: true });
    }
  }
  const add = page.locator('[data-catalog-item]:not([hidden]) [data-flow-cart-add]').first();
  if (await add.getAttribute('aria-pressed') !== 'true') await add.click();
  await page.goto('http://127.0.0.1:4339/cart/');
  await page.locator('[data-cart-page-items] img').evaluate(img => img.decode());
  if (await page.locator('[data-cart-page-items] img').getAttribute('src') !== modelPath) throw new Error('Saved artwork mismatch');
  if (await page.locator('[data-cart-page-items] [data-image-source-caption]').textContent() !== modelCaption) throw new Error('Saved caption mismatch');
  const context = await page.context().browser().newContext({ reducedMotion: 'reduce' });
  const broken = await context.newPage();
  await broken.route('**' + modelPath, route => route.abort());
  await broken.goto('http://127.0.0.1:4339/');
  await broken.waitForFunction(() => document.querySelector('[data-hero-image]').getAttribute('src').endsWith('/smart-speaker.webp'));
  if (!(await broken.locator('[data-hero-field="image-caption"]').textContent()).startsWith('Category illustration')) throw new Error('Failure retained model caption');
  await broken.locator('.hero-next').click();
  await broken.locator('[data-hero-image]').evaluate(img => img.decode());
  if (await broken.locator('[data-hero-field="image-caption"]').textContent() !== 'Kasa EP10 illustration — one unit, not a product photo') throw new Error('Stale caption restored');
  await context.close();
  return { results, savedModel: true, fallbackRotation: true };
}
