async page => {
  const path = '/images/product-art/models-v1/hue-562918.webp';
  const caption = 'Hue 562918 device illustration — not a photo; accessories omitted';
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/philips-hue-white-color-starter-kit/', '/category/smart-lighting/', '/search/?q=Philips%20Hue', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Philips Hue');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('two E26 color bulbs')) throw new Error('Missing kit identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') {
        if (!(await img.evaluate(el => el.currentSrc)).includes('hue-562918-240.webp')) throw new Error('Missing thumbnail');
        await page.screenshot({ path: 'docs/project/FH09J-hue-' + width + '.png' });
      }
      results.push({ width, route });
    }
    await page.goto('http://127.0.0.1:4339/');
    await page.getByRole('button', { name: 'Show Philips Hue White and Color Starter Kit', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('[data-hero-image]').getAttribute('src') === expected, path);
    await page.locator('[data-hero-image]').evaluate(el => el.decode());
    if (await page.locator('[data-hero-field="image-caption"]').textContent() !== caption) throw new Error('Hero caption mismatch');
  }
  return { results, hero: true };
}
