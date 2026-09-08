async page => {
  page.setDefaultTimeout(8000);
  const results = [];
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4339/products/');
    await page.locator('#catalog-search').waitFor();
    const geometry = await page.evaluate(() => ({
      firstProductY: document.querySelector('[data-catalog-item]').getBoundingClientRect().top,
      overflow: document.documentElement.scrollWidth > innerWidth,
      searchY: document.querySelector('#catalog-search').getBoundingClientRect().bottom
    }));
    if (geometry.overflow || (width === 1440 && geometry.firstProductY >= 900)) throw new Error('Directory layout failed');
    await page.locator('#catalog-search').fill('HS220');
    if (await page.locator('[data-catalog-item]:visible').count() !== 1) throw new Error('Model search failed');
    await page.locator('#catalog-category').selectOption('smart-lock');
    if (!await page.locator('#catalog-empty').isVisible()) throw new Error('Empty state missing');
    await page.locator('#catalog-reset').click();
    if (await page.locator('[data-catalog-item]:visible').count() !== 28) throw new Error('Reset failed');
    await page.locator('#catalog-category').selectOption('smart-lighting');
    if (await page.locator('[data-catalog-item]:visible').count() !== 5) throw new Error('Category filter failed');
    await page.locator('#catalog-reset').click();
    await page.locator('summary').click();
    if (await page.getByRole('navigation', { name: 'Product categories', exact: true }).getByRole('link').count() !== 14) throw new Error('Category routes missing');
    await page.locator('summary').click();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/project/FH12D-directory-' + width + '.png' });
    results.push({ width, ...geometry, modelSearch: true, empty: true, reset: true, categories: 14 });
  }
  return results;
}
