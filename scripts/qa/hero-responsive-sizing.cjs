async page => {
  const results = [];
  for (const width of [390, 640, 768, 1440]) {
    for (const deviceScaleFactor of [1, 2, 3]) {
      const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, deviceScaleFactor, reducedMotion: 'reduce' });
      try {
        const tab = await context.newPage();
        await tab.goto('http://127.0.0.1:4339/');
        const image = tab.locator('[data-hero-image]');
        await image.evaluate(el => el.decode());
        const result = await image.evaluate(el => ({ source: new URL(el.currentSrc).pathname, sizes: el.sizes, alt: el.alt, height: el.getBoundingClientRect().height, preloadSizes: document.querySelector('link[rel="preload"][as="image"]').getAttribute('imagesizes') }));
        if (result.sizes !== result.preloadSizes || !result.alt.includes('Echo Dot')) throw Error('Preload or identity mismatch');
        if (width === 390) {
          const expected = { 1: 240, 2: 480, 3: 720 }[deviceScaleFactor];
          if (!result.source.endsWith(`echo-dot-5th-gen-${expected}.webp`) || result.height !== 192) throw Error(JSON.stringify(result));
        }
        if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw Error('Layout overflow');
        results.push({ width, deviceScaleFactor, ...result });
      } finally { await context.close(); }
    }
  }
  return results;
}
