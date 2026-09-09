async page => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/search/?q=August', '/category/smart-lock/', '/review/august-wifi-smart-lock-review/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      const image = page.locator('img[src="/images/product-art/models-v1/august-wifi-smart-lock.webp"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      const card = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (!(await card.locator('[data-image-source-caption]').textContent()).includes('August Wi-Fi lock illustration')) throw Error('Wrong caption');
      if (!(await image.getAttribute('alt')).includes('August Wi-Fi Smart Lock')) throw Error('Wrong identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      if (route.startsWith('/search/')) await card.screenshot({ path: 'reports/FH09AC-august-' + width + '.png' });
      results.push({ width, route });
    }
  }
  return results;
}
