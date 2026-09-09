async page => {
  const results = [];
  for (const density of [1, 2, 3]) {
    const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      await tab.goto('http://127.0.0.1:4339/product/echo-dot-5th-gen/');
      const img = tab.locator('aside img[data-fallback-src]').first();
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(img => img.decode());
      const state = await img.evaluate(img => ({ src: new URL(img.currentSrc).pathname, caption: img.closest('[data-image-fallback-scope]').querySelector('[data-image-source-caption]').textContent }));
      if (!state.src.endsWith(`-${density * 240}.webp`) || !state.caption.includes('Echo Dot')) throw Error(JSON.stringify(state));
      if (density === 1) await tab.screenshot({ path: 'docs/project/FH09AM-sidebar-1440.png' });
      results.push({ density, ...state });
    } finally { await context.close(); }
  }
  return results;
}
