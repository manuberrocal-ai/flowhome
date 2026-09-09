async page => {
  const results = [];
  for (const width of [390, 1440]) {
    for (const density of [1, 2, 3]) {
      const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
      try {
        const tab = await context.newPage();
        await tab.goto('http://127.0.0.1:4339/reviews/');
        const state = await tab.evaluate(async () => {
          const images = [...document.images].filter(img => img.getAttribute('src'));
          images.forEach(img => { img.loading = 'eager'; });
          await Promise.all(images.map(img => img.decode()));
          await document.fonts.ready;
          const resources = performance.getEntriesByType('resource').filter(r => r.initiatorType === 'img' || /\.(webp|png|svg)(\?|$)/.test(r.name));
          const art = [...document.querySelectorAll('article img')];
          return { count: art.length, unique: new Set(art.map(i => i.currentSrc)).size,
            selected: [...new Set(art.map(i => /-(\d+)\.webp$/.exec(i.currentSrc)?.[1]))],
            captions: [...document.querySelectorAll('article [data-image-source-caption]')].every(p => /not a (product )?photo/.test(p.textContent)),
            bytes: resources.reduce((s,r) => s+r.encodedBodySize,0), overflow: document.documentElement.scrollWidth > innerWidth };
        });
        if (state.count !== 15 || state.unique !== 15 || !state.captions || state.overflow || state.selected.join() !== '240') throw Error(JSON.stringify(state));
        if (density === 1) await tab.screenshot({ path: `docs/project/FH09AN-reviews-${width}.png` });
        results.push({ width, density, ...state });
      } finally { await context.close(); }
    }
  }
  return results;
}
