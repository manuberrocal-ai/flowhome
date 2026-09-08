async page => {
  const path = '/images/product-art/models-v1/eufy-c120.webp';
  const caption = 'eufy Indoor Cam C120 illustration — not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/product/eufy-security-indoor-cam-c120/', '/category/security-camera/', '/search/?q=Eufy', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Eufy');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('fixed eufy')) throw new Error('Missing model identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/') {
        const cards = await page.locator('.product-card-image').evaluateAll(imgs => imgs.map(el => el.getAttribute('src')));
        if (cards.length !== 8 || new Set(cards).size !== 8 || cards.some(src => !src.includes('/models-v1/'))) throw new Error('Featured artwork incomplete');
      }
      if (route === '/products/') {
        if (!(await img.evaluate(el => el.currentSrc)).includes('eufy-c120-240.webp')) throw new Error('Missing thumbnail');
        await page.screenshot({ path: 'docs/project/FH09N-eufy-' + width + '.png' });
      }
      results.push({ width, route });
    }
  }
  return { results, eightDistinctFeaturedModels: true };
}
