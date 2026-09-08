async page => {
  const path = '/images/product-art/models-v1/kasa-ep10.webp';
  const caption = 'Kasa EP10 illustration — one unit, not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/tp-link-kasa-smart-plug-mini/', '/category/smart-plug/', '/search/?q=Kasa', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Kasa Smart Plug');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('EP10P2 two-pack')) throw new Error('Missing bundle limit');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') {
        if (!(await img.evaluate(el => el.currentSrc)).includes('kasa-ep10-240.webp')) throw new Error('Missing thumbnail');
        await page.screenshot({ path: 'docs/project/FH09H-kasa-' + width + '.png' });
      }
      results.push({ width, route });
    }
    await page.goto('http://127.0.0.1:4339/');
    await page.getByRole('button', { name: 'Show TP-Link Kasa Smart Plug Mini', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('[data-hero-image]').getAttribute('src') === expected, path);
    await page.locator('[data-hero-image]').evaluate(el => el.decode());
    if (await page.locator('[data-hero-field="image-caption"]').textContent() !== caption) throw new Error('Hero caption mismatch');
  }
  return { results, hero: true };
}
