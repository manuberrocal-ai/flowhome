async page => {
  const results = [];
  for (const width of [390, 1440]) {
    for (const route of ['/', '/products/', '/product/echo-dot-5th-gen/', '/review/echo-dot-5th-gen-review/', '/search/?q=Echo%20Dot']) {
      const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      try {
        const tab = await context.newPage();
        await tab.goto('http://127.0.0.1:4339' + route);
        if (route.includes('search')) await tab.locator('img[src*="models-v1/"]').first().waitFor();
        const state = await tab.evaluate(async () => {
          const images = [...document.images].filter(img => img.getAttribute('src') || img.getAttribute('srcset'));
          images.forEach(img => { img.loading = 'eager'; });
          await Promise.all(images.map(img => img.decode().catch(() => null)));
          const resources = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img' || /\.(webp|png|svg)(\?|$)/.test(r.name));
          return { imageBytes: resources.reduce((sum, r) => sum + r.encodedBodySize, 0), requests: resources.length,
            heavy: resources.filter(r => r.encodedBodySize > 200000).map(r => ({ path: new URL(r.name).pathname, bytes: r.encodedBodySize })),
            broken: images.filter(img => !img.naturalWidth).length,
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        results.push({ width, route, ...state });
      } finally { await context.close(); }
    }
  }
  return results;
}
