async page => {
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const slug of ['echo-dot-5th-gen', 'philips-hue-white-color-starter-kit']) {
      await page.goto('http://127.0.0.1:4339/product/' + slug + '/');
      const img = page.locator('article img[data-fallback-src]').first();
      await img.evaluate(img => img.decode());
      const state = await img.evaluate(async img => {
        await document.fonts.ready;
        const scope = img.closest('[data-image-fallback-scope]');
        const box = scope.getBoundingClientRect();
        const art = img.parentElement.getBoundingClientRect();
        return { topGap: art.top - box.top, width: art.width, overflow: document.documentElement.scrollWidth > innerWidth, align: getComputedStyle(scope).justifyContent };
      });
      if (state.overflow || (width >= 768 && (state.align !== 'flex-start' || Math.abs(state.topGap - 64) > 1))) throw Error(JSON.stringify({ width, slug, ...state }));
      results.push({ viewport: width, slug, ...state });
      if (slug === 'echo-dot-5th-gen' && [390, 1440].includes(width)) await page.screenshot({ path: `docs/project/FH12J-profile-${width}.png` });
    }
  }
  return results;
}
