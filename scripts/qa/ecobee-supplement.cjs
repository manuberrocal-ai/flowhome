async page => {
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ['/search/?q=ecobee', '/category/smart-thermostat/', '/review/ecobee-smart-thermostat-premium-review/', '/compare/amazon-smart-thermostat-vs-ecobee-smart-thermostat-premium/']) {
      await page.goto('http://127.0.0.1:4339' + route);
      if (route.startsWith('/compare/')) {
        for (const [slug, name, asin] of [['amazon-smart-thermostat', 'Amazon Smart Thermostat', 'B08J4C8871'], ['ecobee-smart-thermostat-premium', 'ecobee Smart Thermostat Premium', 'B09XXTQP3B']]) {
          if (!(await page.locator('th[scope="col"]').allTextContents()).includes(name)) throw Error('Wrong comparison identity');
          if (!await page.locator('a[href="/product/' + slug + '/"]').count()) throw Error('Missing profile link');
          const href = await page.locator('[data-cta-position="compare_table"][data-product-slug="' + slug + '"]').getAttribute('href');
          if (!href.includes('/dp/' + asin)) throw Error('Wrong Amazon destination');
        }
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Comparison overflow');
        results.push({ width, route, scope: 'text table and destinations; no product images in this template' });
        continue;
      }
      const image = page.locator('img[src="/images/product-art/models-v1/ecobee-premium.webp"]').first();
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(image => image.decode());
      const card = image.locator('xpath=ancestor::*[@data-image-fallback-scope][1]');
      if (!(await card.locator('[data-image-source-caption]').textContent()).includes('ecobee Premium illustration')) throw Error('Wrong caption');
      if (!(await image.getAttribute('alt')).includes('one white room SmartSensor')) throw Error('Wrong identity');
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      if (route.startsWith('/search/')) await card.screenshot({ path: 'reports/FH09Y-ecobee-' + width + '.png' });
      results.push({ width, route });
    }
  }
  return results;
}
