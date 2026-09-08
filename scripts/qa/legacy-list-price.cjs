async page => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 1000 } });
  try {
    const tab = await context.newPage();
    await tab.goto('http://127.0.0.1:4339/cart/');
    await tab.evaluate(() => localStorage.setItem('flowhome-amazon-list', JSON.stringify([{ asin: 'B09B8V1LZ3', slug: 'echo-dot-5th-gen', name: 'Echo Dot 5th Gen', price: 123.45, url: '/product/echo-dot-5th-gen/' }])));
    await tab.reload();
    await tab.locator('[data-cart-page-items] article').waitFor();
    const state = await tab.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('flowhome-amazon-list'));
      return { count: saved.entries.length, asin: saved.entries[0].asin, hasPrice: Object.hasOwn(saved.entries[0], 'price') };
    });
    if (state.count !== 1 || state.asin !== 'B09B8V1LZ3' || state.hasPrice) throw Error(JSON.stringify(state));
    await tab.locator('[data-cart-page-remove]').focus();
    await tab.keyboard.press('Enter');
    await tab.locator('[data-cart-page-empty]').waitFor({ state: 'visible' });
    return { ...state, keyboardRemoval: true };
  } finally { await context.close(); }
}
