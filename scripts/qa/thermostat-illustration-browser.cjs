async page => {
  const path = '/images/product-art/models-v1/amazon-smart-thermostat.webp';
  const caption = 'Amazon Smart Thermostat illustration — not a product photo';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/amazon-smart-thermostat/', '/category/smart-thermostat/', '/search/?q=Amazon%20Smart%20Thermostat', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Amazon Smart Thermostat');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('sample 68 display')) throw new Error('Sample display not disclosed');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') {
        if (!(await img.evaluate(el => el.currentSrc)).includes('amazon-smart-thermostat-240.webp')) throw new Error('Missing thumbnail');
        await page.screenshot({ path: 'docs/project/FH09I-thermostat-' + width + '.png' });
      }
      results.push({ width, route });
    }
    await page.goto('http://127.0.0.1:4339/');
    await page.getByRole('button', { name: 'Show Amazon Smart Thermostat', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('[data-hero-image]').getAttribute('src') === expected, path);
    await page.locator('[data-hero-image]').evaluate(el => el.decode());
    if (await page.locator('[data-hero-field="image-caption"]').textContent() !== caption) throw new Error('Hero caption mismatch');
  }
  return { results, hero: true };
}
