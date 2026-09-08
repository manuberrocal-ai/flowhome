async page => {
  const path = '/images/product-art/models-v1/aqara-m2.webp';
  const caption = 'Aqara Hub M2 illustration — not a product photo';
  const results = [];
  const heroResults = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/product/aqara-hub-m2/', '/category/smart-hub/', '/search/?q=Aqara%20Hub', '/products/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route === '/products/') await page.locator('#catalog-search').fill('Aqara Hub M2');
      const img = page.locator('img[src="' + path + '"]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(async el => { await el.decode(); await document.fonts.ready; });
      const scope = img.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (await scope.locator('[data-image-source-caption]').textContent() !== caption) throw new Error('Caption mismatch');
      if (!(await img.getAttribute('alt')).includes('low black circular')) throw new Error('Missing model identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
      if (route === '/products/') await page.screenshot({ path: 'docs/project/FH09K-aqara-' + width + '.png' });
      results.push({ width, route });
    }
    await page.goto('http://127.0.0.1:4339/');
    const dots = page.locator('[data-hero-dot]');
    if (await dots.count() !== 6) throw new Error('Unexpected hero count');
    const sources = new Set();
    for (let i = 0; i < 6; i++) {
      await dots.nth(i).click();
      const img = page.locator('[data-hero-image]');
      await img.evaluate(el => el.decode());
      const src = await img.getAttribute('src');
      const text = await page.locator('[data-hero-field="image-caption"]').textContent();
      if (!src.includes('/models-v1/') || text.startsWith('Category illustration')) throw new Error('Generic hero item');
      sources.add(src);
    }
    if (sources.size !== 6) throw new Error('Repeated hero artwork');
    if (await page.locator('[data-hero-field="image-caption"]').textContent() !== caption) throw new Error('M2 hero caption mismatch');
    heroResults.push({ width, distinctModelImages: sources.size });
  }
  return { results, heroResults };
}
