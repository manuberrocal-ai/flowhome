async page => {
  const origin = 'http://127.0.0.1:4339';
  await page.goto(origin + '/sitemap-0.xml');
  const routes = await page.evaluate(() => [...document.querySelectorAll('loc')].map(loc => new URL(loc.textContent).pathname));
  if (!routes.length) throw Error('Empty sitemap');
  const results = [];
  for (const width of [390, 1440]) {
    for (const route of routes) {
      const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      try {
        const tab = await context.newPage();
        const response = await tab.goto(origin + route);
        const state = await tab.evaluate(async () => {
          const images = [...document.images].filter(img => img.getAttribute('src') || img.getAttribute('srcset'));
          images.forEach(img => { img.loading = 'eager'; });
          await Promise.all(images.map(img => img.decode().catch(() => null)));
          await document.fonts.ready;
          const resources = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img' || /\.(webp|png|svg)(\?|$)/.test(r.name));
          return { imageBytes: resources.reduce((sum, r) => sum + r.encodedBodySize, 0),
            heavy: resources.filter(r => r.encodedBodySize > 200000).map(r => ({ path: new URL(r.name).pathname, bytes: r.encodedBodySize })),
            broken: images.filter(img => !img.naturalWidth).map(img => img.getAttribute('src')),
            overflow: document.documentElement.scrollWidth > innerWidth };
        });
        results.push({ width, route, status: response.status(), ...state });
      } finally { await context.close(); }
    }
  }
  return { routes: routes.length, scenarios: results.length, issues: results.filter(r => r.status !== 200 || r.broken.length || r.overflow || r.heavy.length), largest: [...results].sort((a,b) => b.imageBytes-a.imageBytes).slice(0,10) };
}
