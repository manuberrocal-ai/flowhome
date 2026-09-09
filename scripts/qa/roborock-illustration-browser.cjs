async page => {
  const path = '/images/product-art/models-v1/roborock-q5-plus.webp';
  const caption = 'Roborock Q5+ and dock illustration — not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/product/roborock-q5-plus/', '/category/robot-vacuum/', '/search/?q=Roborock', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Roborock');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('Auto-Empty Dock Pure')) throw new Error('Missing dock identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') {
        if (!(await img.evaluate(el => el.currentSrc)).includes('roborock-q5-plus-240.webp')) throw new Error('Missing thumbnail');
        await page.screenshot({ path: 'docs/project/FH09M-roborock-' + width + '.png' });
      }
      results.push({ width, route });
    }
  }
  return { results };
}
