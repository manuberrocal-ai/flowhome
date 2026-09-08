async page => {
  const results = [];
  for (const width of [390, 1440]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      for (const route of ['/account/', '/preferences/', '/cart/', '/search/?q=zzzz-no-product-zzzz', '/404/']) {
        const response = await tab.goto('http://127.0.0.1:4339' + route);
        if (route === '/cart/') await tab.locator('[data-cart-page-empty]').waitFor({ state: 'visible' });
        if (route === '/preferences/') {
          await tab.waitForFunction(() => document.querySelector('[data-lifecycle-status]')?.textContent.includes('unavailable in this version'));
          if (await tab.locator('[data-lifecycle-signed-out]').isVisible() || await tab.locator('[data-lifecycle-preferences]').isVisible()) throw Error('Inactive preferences expose account controls');
        }
        const state = await tab.evaluate(async () => {
          await document.fonts.ready;
          return { h1: document.querySelector('h1')?.textContent, robots: document.querySelector('meta[name="robots"]')?.content, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        if (!state.h1 || !state.robots?.includes('noindex') || state.overflow) throw Error(JSON.stringify({ route, ...state }));
        results.push({ width, route, status: response.status(), ...state });
      }
      await tab.goto('http://127.0.0.1:4339/cart/');
      await tab.evaluate(() => localStorage.setItem('flowhome-amazon-list', '{invalid'));
      await tab.reload();
      await tab.locator('[data-cart-page-recovery]').waitFor({ state: 'visible' });
      if (await tab.evaluate(() => localStorage.getItem('flowhome-amazon-list')) !== '{invalid') throw Error('Corrupt data was overwritten');
      await tab.locator('[data-cart-page-reset-saved-list]').focus();
      await tab.keyboard.press('Enter');
      await tab.locator('[data-cart-page-recovery]').waitFor({ state: 'hidden' });
      await tab.locator('[data-cart-page-empty]').waitFor({ state: 'visible' });
      results.push({ width, corruptListPreserved: true, explicitKeyboardReset: true });
    } finally { await context.close(); }
  }
  return results;
}
