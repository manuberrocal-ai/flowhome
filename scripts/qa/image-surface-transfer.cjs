async page => {
  const results = [];
  for (const width of [390, 1440]) {
    for (const density of [1, 2, 3]) {
      for (const route of ['/product/echo-dot-5th-gen/', '/review/echo-dot-5th-gen-review/', '/search/?q=Echo%20Dot']) {
        const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
        try {
          const tab = await context.newPage();
          await tab.goto('http://127.0.0.1:4339' + route);
          const img = tab.locator('img[src="/images/product-art/models-v1/echo-dot-5th-gen.webp"]').first();
          await img.scrollIntoViewIfNeeded();
          const state = await img.evaluate(async img => {
            await img.decode();
            await document.fonts.ready;
            const rect = img.getBoundingClientRect();
            const resource = performance.getEntriesByType('resource').find(entry => entry.name === img.currentSrc);
            return { src: new URL(img.currentSrc).pathname, width: rect.width, height: rect.height, bytes: resource?.encodedBodySize ?? null,
              caption: img.closest('[data-image-fallback-scope]')?.querySelector('[data-image-source-caption]')?.textContent,
              overflow: document.documentElement.scrollWidth > innerWidth };
          });
          if (!state.bytes || state.overflow || !state.caption?.includes('Echo Dot')) throw Error(JSON.stringify(state));
          results.push({ route, viewport: width, density, ...state });
        } finally { await context.close(); }
      }
    }
  }
  return results;
}
