async page => {
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/product/echo-dot-5th-gen/', '/review/echo-dot-5th-gen-review/', '/search/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      const image = page.locator('img[src*="/illustrations-v1/"]').first();
      await image.scrollIntoViewIfNeeded();
      const info = await image.evaluate(async img => {
        await img.decode();
        await document.fonts.ready;
        return { src: img.getAttribute('src'), width: img.naturalWidth, height: img.naturalHeight, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      if (!info.src.endsWith('.webp') || !info.width || info.overflow) throw new Error(route + JSON.stringify(info));
      results.push({ viewportWidth: width, route, ...info });
    }
  }
  await page.goto('http://127.0.0.1:4339/cart/');
  await page.evaluate(() => localStorage.setItem('flowhome-amazon-list', JSON.stringify([{ asin: 'B09B8V1LZ3', slug: 'echo-dot-5th-gen', name: 'Echo Dot 5th Gen', image: '/images/product-art/illustrations-v1/smart-speaker.png', url: '/product/echo-dot-5th-gen/' }])));
  await page.reload();
  const saved = page.locator('[data-cart-page-items] img');
  await saved.evaluate(img => img.decode());
  if (!(await saved.getAttribute('src')).endsWith('/smart-speaker.webp')) throw new Error('Legacy saved illustration not optimized');
  await page.locator('[data-cart-page-remove]').focus();
  await page.keyboard.press('Enter');
  if (await saved.count()) throw new Error('Keyboard removal failed');
  await page.goto('http://127.0.0.1:4339/products/');
  await page.locator('.product-card').first().scrollIntoViewIfNeeded();
  await page.locator('.product-card-image').evaluateAll(async images => {
    images.forEach(img => { img.loading = 'eager'; });
    await Promise.all(images.map(img => img.decode()));
    await document.fonts.ready;
  });
  await page.screenshot({ path: 'docs/project/FH09C-catalog-1440.png' });
  return { results, legacySavedImage: 'webp', keyboardRemove: true };
}
