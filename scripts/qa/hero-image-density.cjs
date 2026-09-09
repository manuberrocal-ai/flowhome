async page => {
  const results = [];
  for (const density of [1, 2, 3]) {
    const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.route('**/*', route => route.continue());
    await tab.goto('http://127.0.0.1:4339/');
    await tab.locator('[data-hero-image]').evaluate(image => image.decode());
    const state = await tab.evaluate(() => {
      const image = document.querySelector('[data-hero-image]');
      const preload = document.querySelector('link[as="image"][rel="preload"]');
      return { src: image.currentSrc, aligned: preload.imageSrcset === image.srcset && preload.imageSizes === image.sizes,
        originalRequests: performance.getEntriesByType('resource').filter(r => r.name.endsWith('/echo-dot-5th-gen.webp')).length };
    });
    const suffix = density === 1 ? '-480.webp' : density === 2 ? '-720.webp' : '5th-gen.webp';
    if (!state.src.endsWith(suffix) || !state.aligned || (density < 3 && state.originalRequests)) throw Error(JSON.stringify(state));
    if (density === 1) await tab.locator('[data-hero-showcase]').screenshot({ path: 'reports/FH09O-hero-1440.png' });
    results.push({ density, ...state });
    await context.close();
  }
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' });
  const tab = await context.newPage();
  await tab.route('**/models-v1/echo-dot-5th-gen*.webp', route => route.abort());
  await tab.goto('http://127.0.0.1:4339/');
  await tab.waitForFunction(() => { const image = document.querySelector('[data-hero-image]'); return image.complete && image.naturalWidth > 0 && image.currentSrc.includes('/illustrations-v1/'); });
  const fallback = await tab.locator('[data-hero-showcase]').evaluate(root => ({ srcset: root.querySelector('[data-hero-image]').srcset, caption: root.querySelector('[data-hero-field="image-caption"]').textContent }));
  if (fallback.srcset || !fallback.caption.startsWith('Category illustration')) throw Error(JSON.stringify(fallback));
  await tab.locator('.hero-next').click();
  await tab.waitForFunction(() => { const image = document.querySelector('[data-hero-image]'); return image.complete && image.currentSrc.includes('kasa-ep10-480.webp'); });
  const recovered = await tab.locator('[data-hero-field="image-caption"]').textContent();
  if (!recovered.includes('Kasa EP10')) throw Error(recovered);
  await tab.locator('[data-hero-showcase]').screenshot({ path: 'reports/FH09O-hero-390.png' });
  await context.close();
  return { densities: results, fallback, recovered };
}
