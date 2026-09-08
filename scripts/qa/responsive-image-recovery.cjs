async page => {
  const results = [];
  for (const density of [1, 2, 3]) {
    for (const fail of [false, true]) {
      const context = await page.context().browser().newContext({ viewport: { width: 390, height: 1000 }, deviceScaleFactor: density, reducedMotion: 'reduce' });
      try {
        if (fail) await context.route('**/models-v1/echo-dot-5th-gen*.webp', route => route.abort());
        const tab = await context.newPage();
        await tab.goto('http://127.0.0.1:4339/cart/');
        await tab.evaluate(() => localStorage.setItem('flowhome-amazon-list', JSON.stringify([{ asin: 'B09B8V1LZ3', slug: 'echo-dot-5th-gen', name: 'Echo Dot 5th Gen', image: '/images/product-art/illustrations-v1/smart-speaker.png', url: '/product/echo-dot-5th-gen/' }])));
        await tab.reload();
        const routes = fail ? ['/cart/', '/product/echo-dot-5th-gen/', '/review/echo-dot-5th-gen-review/', '/search/?q=Echo%20Dot'] : ['/cart/'];
        for (const route of routes) {
          if (route !== '/cart/') await tab.goto('http://127.0.0.1:4339' + route);
          const selector = route === '/cart/' ? '[data-cart-page-items] img' : 'img[data-fallback-src]';
          const img = tab.locator(selector).first();
          await img.scrollIntoViewIfNeeded();
          if (fail) await tab.waitForFunction(selector => {
            const img = document.querySelector(selector);
            return img?.complete && img.naturalWidth > 0 && !img.getAttribute('srcset');
          }, selector);
          const state = await img.evaluate(async img => {
            await img.decode();
            return { src: new URL(img.currentSrc).pathname, srcset: img.getAttribute('srcset'), caption: img.closest('[data-image-fallback-scope]')?.querySelector('[data-image-source-caption]')?.textContent, bytes: performance.getEntriesByType('resource').find(r => r.name === img.currentSrc)?.encodedBodySize, overflow: document.documentElement.scrollWidth > innerWidth };
          });
          if (state.overflow || (fail ? state.src.includes('/models-v1/') || state.srcset || state.caption.includes('Echo Dot') : !state.src.endsWith(density === 3 ? '-480.webp' : '-240.webp'))) throw Error(JSON.stringify(state));
          results.push({ route, density, fail, ...state });
          if (route === '/cart/') {
            await tab.locator('[data-cart-page-remove]').focus();
            await tab.keyboard.press('Enter');
            if (await img.count()) throw Error('Keyboard removal failed');
          }
        }
      } finally { await context.close(); }
    }
  }
  return results;
}
