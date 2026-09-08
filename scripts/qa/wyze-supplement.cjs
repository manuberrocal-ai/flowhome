async page => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/search/?q=Wyze', '/category/smart-lighting/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      const image = page.locator('img[src="/images/product-art/models-v1/wyze-bulb-color.webp"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      const card = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (!(await card.locator('[data-image-source-caption]').textContent()).includes('Wyze Bulb Color illustration')) throw Error('Wrong caption');
      if (!(await image.getAttribute('alt')).includes('one unlit Wyze Bulb Color')) throw Error('Wrong identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      if (route.startsWith('/category/')) {
        const images = await page.locator('.product-card-image').evaluateAll(images => images.map(image => image.getAttribute('src')));
        if (images.length !== 5 || new Set(images).size !== 5 || images.some(image => !image.includes('/models-v1/'))) throw Error('Lighting artwork coverage mismatch');
      }
      if (route.startsWith('/search/')) await card.screenshot({ path: 'reports/FH09U-wyze-bulb-color-' + width + '.png' });
      results.push({ width, route });
    }
  }
  return results;
}
