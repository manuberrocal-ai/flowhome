async page => {
  const path = '/images/product-art/models-v1/ring-video-doorbell-wired.webp';
  const caption = 'Ring Video Doorbell Wired illustration — not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/ring-video-doorbell-wired/', '/category/video-doorbell/', '/search/?q=Ring', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Ring Video Doorbell');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('original black Ring')) throw new Error('Alt mismatch');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') await page.screenshot({ path: 'docs/project/FH09F-ring-' + width + '.png' });
      results.push({ width, route });
    }
  }
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4339/');
    await page.getByRole('button', { name: 'Show Ring Video Doorbell Wired', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('[data-hero-image]').getAttribute('src') === expected, path);
    await page.locator('[data-hero-image]').evaluate(img => img.decode());
    if (await page.locator('[data-hero-field="image-caption"]').textContent() !== caption) throw new Error('Hero caption mismatch');
    if (await page.locator('[data-hero-details]').getAttribute('href') !== '/product/ring-video-doorbell-wired/') throw new Error('Hero route mismatch');
    await page.locator('[data-hero-showcase]').screenshot({ path: 'docs/project/FH09F-ring-hero-' + width + '.png' });
  }
  return { results, homeHero: true };
}
