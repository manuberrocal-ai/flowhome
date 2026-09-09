async page => {
  const results = [];
  for (const width of [390, 1440]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      const external = [];
      const errors = [];
      tab.on('request', request => { if (/supabase\.co|googletagmanager|clarity\.ms/.test(request.url())) external.push(request.url().split('?')[0]); });
      tab.on('pageerror', error => errors.push(error.message));
      await tab.goto('http://127.0.0.1:4340/products/');
      const env = await (await tab.request.get('http://127.0.0.1:4340/release-environment.json')).json();
      if (env.environment !== 'production' || env.authEnabled || env.analyticsEnabled) throw Error('Wrong review artifact');
      await tab.locator('[data-consent-action="accepted"]').first().click();
      await tab.locator('[data-flow-cart-add]').first().click();
      await tab.goto('http://127.0.0.1:4340/cart/');
      await tab.locator('[data-cart-page-items] img').evaluate(img => img.decode());
      if (await tab.locator('[data-cart-page-items] article').count() !== 1) throw Error('Saved item missing');
      await tab.reload();
      if (await tab.locator('[data-cart-page-items] article').count() !== 1) throw Error('Persistence failed');
      await tab.locator('[data-cart-page-remove]').focus();
      await tab.keyboard.press('Enter');
      await tab.locator('[data-cart-page-empty]').waitFor({ state: 'visible' });
      // Fixture belongs exclusively to this fresh browser context. Verify the
      // compiled candidate, not just the source normalizer, retires old prices.
      await tab.evaluate(() => localStorage.setItem('flowhome-amazon-list', JSON.stringify([
        { asin: 'B09B8V1LZ3', slug: 'echo-dot-5th-gen', name: 'Echo Dot 5th Gen', price: 123.45, url: '/product/echo-dot-5th-gen/' },
      ])));
      await tab.reload();
      await tab.locator('[data-cart-page-items] article').waitFor();
      const legacy = await tab.evaluate(() => {
        const saved = JSON.parse(localStorage.getItem('flowhome-amazon-list'));
        return { count: saved.entries.length, asin: saved.entries[0].asin, hasPrice: Object.hasOwn(saved.entries[0], 'price') };
      });
      if (legacy.count !== 1 || legacy.asin !== 'B09B8V1LZ3' || legacy.hasPrice) throw Error('Legacy price migration failed');
      await tab.locator('[data-cart-page-remove]').focus();
      await tab.keyboard.press('Enter');
      await tab.locator('[data-cart-page-empty]').waitFor({ state: 'visible' });
      await tab.goto('http://127.0.0.1:4340/account/');
      await tab.locator('[data-account-unavailable]').waitFor({ state: 'visible' });
      await tab.goto('http://127.0.0.1:4340/preferences/');
      await tab.waitForFunction(() => document.querySelector('[data-lifecycle-status]')?.textContent.includes('unavailable in this version'));
      if (external.length || errors.length) throw Error(JSON.stringify({ external, errors }));
      results.push({ width, productionConfig: true, localSaveReloadRemove: true, legacyPriceRetired: true, legacyIdentityPreserved: true, inactiveServices: true, externalServiceRequests: external.length, pageErrors: errors.length });
    } finally { await context.close(); }
  }
  return results;
}
