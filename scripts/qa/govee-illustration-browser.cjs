async page => {
  const imagePath = '/images/product-art/models-v1/govee-h617c.webp';
  const caption = 'Govee H617C strip illustration — not a product photo or full kit';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/govee-rgbic-led-strip-lights/', '/category/smart-lighting/', '/search/?q=Govee', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Govee');
      const image = page.locator('img[src="' + imagePath + '"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(async img => { await img.decode(); await document.fonts.ready; });
      const scope = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Wrong caption');
      if (!(await image.getAttribute('alt')).includes('coiled section')) throw new Error('Wrong alt');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') {
        await page.screenshot({ path: 'docs/project/FH09E-govee-' + width + '.png' });
      }
      if (route.startsWith('/product/')) {
        if (await page.locator('meta[property="og:image:alt"]').getAttribute('content') !== caption) throw new Error('Social caption mismatch');
      }
      results.push({ width, route, image: true, caption: true, overflow: false });
    }
  }
  const add = page.locator('[data-catalog-item]:not([hidden]) [data-flow-cart-add]').first();
  if (await add.getAttribute('aria-pressed') !== 'true') await add.click();
  await page.goto('http://127.0.0.1:4339/cart/');
  const saved = page.locator('[data-cart-page-items] img[src="' + imagePath + '"]');
  await saved.evaluate(img => img.decode());
  if (await saved.locator('xpath=ancestor::article[1]').locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Saved label mismatch');
  const context = await page.context().browser().newContext();
  const failure = await context.newPage();
  await failure.route('**' + imagePath, route => route.abort());
  await failure.goto('http://127.0.0.1:4339/product/govee-rgbic-led-strip-lights/');
  const fallback = failure.locator('[data-image-fallback-scope] img').first();
  await failure.waitForFunction(() => document.querySelector('[data-image-fallback-scope] img').getAttribute('src').endsWith('/smart-lighting.webp'));
  await fallback.evaluate(img => img.decode());
  if (!(await failure.locator('[data-image-source-caption]').first().textContent()).startsWith('Category illustration')) throw new Error('Failure falsely labels model');
  await context.close();
  return { results, saved: true, fallback: true };
}
