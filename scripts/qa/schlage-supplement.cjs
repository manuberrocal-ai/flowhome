async page => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/search/?q=Schlage', '/category/smart-lock/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      const image = page.locator('img[src="/images/product-art/models-v1/schlage-encode-century.webp"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      const card = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (!(await card.locator('[data-image-source-caption]').textContent()).includes('Schlage Encode Century illustration')) throw Error('Wrong caption');
      if (!(await image.getAttribute('alt')).includes('Schlage Encode BE489WB CEN 622')) throw Error('Wrong identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      if (route.startsWith('/search/')) await card.screenshot({ path: 'reports/FH09AD-schlage-' + width + '.png' });
      results.push({ width, route });
    }
  }
  return results;
}
