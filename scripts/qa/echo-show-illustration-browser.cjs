async page => {
  const path = '/images/product-art/models-v1/echo-show-8-3rd-gen.webp';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/product/echo-show-8-3rd-gen/', '/category/smart-display/', '/search/?q=Echo%20Show', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Echo Show');
      const image = page.locator('img[src="' + path + '"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(async image => { await image.decode(); await document.fonts.ready; });
      const scope = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      const caption = await scope.locator('[data-image-source-caption]').textContent();
      if (caption !== 'Echo Show 8 3rd Gen illustration — not a photo; sample screen') throw Error(caption);
      if (!(await image.getAttribute('alt')).includes('centered camera')) throw Error('Identity missing');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      if (route === '/products/') {
        if (!(await image.evaluate(image => image.currentSrc)).endsWith('echo-show-8-3rd-gen-240.webp')) throw Error('Thumbnail missing');
        await page.screenshot({ path: 'reports/FH09P-echo-show-' + width + '.png' });
      }
      results.push({ width, route });
    }
  }
  return results;
}
