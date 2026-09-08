async page => {
  const results = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/products/', '/product/echo-dot-5th-gen/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      const product = route.includes('/product/');
      if (await page.locator('[data-global-affiliate-disclosure]').count() !== (product ? 0 : 1)) throw Error('Global disclosure mismatch');
      if (product) {
        const notice = page.locator('.affiliate-disclosure');
        await notice.waitFor({ state: 'visible' });
        const text = await notice.textContent();
        if (!text.includes('FlowHome may earn') || !text.includes('verified seller package')) throw Error('Disclosure text missing');
        const noticeBox = await notice.boundingBox();
        const ctaBox = await page.locator('[data-cta-position="product_profile"]').boundingBox();
        if (noticeBox.y >= ctaBox.y) throw Error('Disclosure follows product CTA');
        await page.locator('article img[data-fallback-src]').first().evaluate(img => img.decode());
        await page.screenshot({ path: `docs/project/FH12M-disclosure-${width}.png` });
      }
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      results.push({ width, route, disclosurePresent: true });
    }
  }
  return results;
}
