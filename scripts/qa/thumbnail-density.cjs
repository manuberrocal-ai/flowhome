async page => {
  const results = [];
  for (const density of [1, 2, 3]) {
    const context = await page.context().browser().newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.goto('http://127.0.0.1:4339/products/');
    const result = await tab.evaluate(async () => {
      const imgs = [...document.querySelectorAll('.product-card-image')];
      imgs.forEach(img => { img.loading = 'eager'; });
      await Promise.all(imgs.map(img => img.decode()));
      const urls = [...new Set(imgs.map(img => img.currentSrc))];
      return { count: imgs.length, paths: urls.map(url => new URL(url).pathname), bytes: performance.getEntriesByType('resource').filter(r => urls.includes(r.name)).reduce((n, r) => n + r.encodedBodySize, 0), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    if (result.count !== 28 || result.overflow || result.paths.some(path => !path.endsWith('-' + density * 240 + '.webp'))) throw new Error(JSON.stringify(result));
    await tab.locator('#catalog-search').fill('Echo Dot');
    await tab.locator('[data-catalog-item]:not([hidden])').scrollIntoViewIfNeeded();
    await tab.screenshot({ path: 'docs/project/FH09G-thumbnails-dpr' + density + '.png' });
    results.push({ density, ...result });
    await context.close();
  }
  const context = await page.context().browser().newContext();
  const tab = await context.newPage();
  await tab.route('**/models-v1/echo-dot-5th-gen-*.webp', route => route.abort());
  await tab.goto('http://127.0.0.1:4339/products/');
  await tab.locator('#catalog-search').fill('Echo Dot');
  const card = tab.locator('[data-catalog-item]:not([hidden])');
  const img = card.locator('img');
  await img.scrollIntoViewIfNeeded();
  await tab.waitForFunction(() => document.querySelector('[data-catalog-item]:not([hidden]) img').getAttribute('src').endsWith('/smart-speaker.webp'));
  await img.evaluate(el => el.decode());
  if (await img.getAttribute('srcset')) throw new Error('Failed candidate retained');
  if (!(await card.locator('[data-image-source-caption]').textContent()).startsWith('Category illustration')) throw new Error('False model caption');
  await context.close();
  return { results, fallback: true };
}
