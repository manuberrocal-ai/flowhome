async page => {
  const results = [];
  for (const width of [390, 1440]) for (const dpr of [1, 3]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 900 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      tab.setDefaultTimeout(8000);
      await tab.goto('http://127.0.0.1:4341/products/');
      const reject = tab.getByRole('button', { name: 'Reject', exact: true });
      if (await reject.isVisible()) await reject.click();
      const buttons = tab.locator('[data-flow-cart-add]');
      if (await buttons.count() !== 28) throw Error('Catalog size mismatch');
      const expected = await buttons.evaluateAll(nodes => Object.fromEntries(nodes.map(el => [el.dataset.asin, { image: el.dataset.image, name: el.dataset.name }])));
      for (const button of await buttons.all()) {
        await button.click();
        if (await button.getAttribute('aria-pressed') !== 'true') throw Error('Save failed');
      }
      await tab.goto('http://127.0.0.1:4341/cart/');
      await tab.waitForFunction(() => document.querySelectorAll('.flow-cart-page-item').length === 28);
      const images = await tab.locator('.flow-cart-page-item').evaluateAll(async nodes => {
        for (const node of nodes) node.querySelector('img').loading = 'eager';
        await Promise.all(nodes.map(node => node.querySelector('img').decode()));
        return nodes.map(node => {
          const img = node.querySelector('img');
          return { asin: node.dataset.asin, source: new URL(img.src).pathname, selected: new URL(img.currentSrc).pathname,
            alt: img.alt, width: img.getBoundingClientRect().width,
            caption: node.querySelector('[data-image-source-caption]').textContent };
        });
      });
      for (const item of images) {
        if (item.source !== expected[item.asin]?.image) throw Error('Image identity mismatch: ' + item.asin);
        if (!item.selected.startsWith(item.source.replace(/\.webp$/, '-')) || !/-[0-9]+\.webp$/.test(item.selected)) throw Error('Missing responsive variant');
        if (!item.alt || !/not a (photo|product photo)/i.test(item.caption)) throw Error('Missing illustration disclosure');
        if (item.width > 100) throw Error('Unexpected list image geometry');
      }
      if (new Set(images.map(item => item.selected)).size !== 28) throw Error('Repeated product imagery');
      if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow');
      await tab.screenshot({ path: '.playwright-cli/fh09ao-list-' + width + '-' + dpr + '.png' });
      const bytes = await tab.evaluate(() => performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'img').reduce((sum, entry) => sum + entry.encodedBodySize, 0));
      results.push({ width, dpr, count: images.length, imageEncodedBytes: bytes, images });
    } finally { await context.close(); }
  }
  return results;
}
