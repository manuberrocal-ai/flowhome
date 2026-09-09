async page => {
  const checks = [];
  for (const width of [390, 768, 1440]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      await tab.goto('http://127.0.0.1:4341/search/');
      const reject = tab.getByRole('button', { name: 'Reject', exact: true });
      if (await reject.isVisible()) await reject.click();
      const input = tab.getByRole('searchbox', { name: 'Search products', exact: true });
      const cards = tab.locator('#search-results article');
      await tab.waitForFunction(() => document.querySelectorAll('#search-results article').length === 28);
      const expected = await tab.locator('#search-results').evaluate(el => JSON.parse(el.dataset.searchProducts));
      if (expected.length !== 28 || await cards.count() !== 28) throw Error('Incomplete catalog');
      if (await cards.getByText('View product details', { exact: true }).count() !== 28) throw Error('Misleading card action');
      if (await input.evaluate(el => getComputedStyle(el, '::placeholder').color === 'rgba(0, 0, 0, 0)')) throw Error('Invisible placeholder');
      if (await tab.locator('#search-status').textContent() !== 'Showing all 28 products.') throw Error('Missing count');
      const images = await cards.evaluateAll(async nodes => {
        const images = nodes.map(node => node.querySelector('img'));
        images.forEach(img => { img.loading = 'eager'; });
        await Promise.all(images.map(img => img.decode()));
        return nodes.map(node => ({ name: node.querySelector('h2').textContent, src: new URL(node.querySelector('img').src).pathname,
          selected: new URL(node.querySelector('img').currentSrc).pathname, alt: node.querySelector('img').alt,
          caption: node.querySelector('[data-image-source-caption]').textContent }));
      });
      for (const item of images) {
        if (item.src !== expected.find(product => product.name === item.name)?.image) throw Error('Image identity mismatch');
        if (!item.selected.startsWith(item.src.replace(/\.webp$/, '-'))) throw Error('Missing thumbnail');
        if (!item.alt || !/not a (photo|product photo)/i.test(item.caption)) throw Error('Missing illustration disclosure');
      }
      if (new Set(images.map(item => item.src)).size !== 28) throw Error('Repeated images');
      for (const query of ['  ECHO DOT  ', 'smart lighting', 'TP LINK', 'dimmer kasa']) {
        await input.fill(query);
        if (await cards.count() === 0) throw Error('Expected matches: ' + query);
        if (await tab.locator('#search-empty').isVisible()) throw Error('False empty state');
      }
      await input.fill('<img src=x onerror=alert(1)>');
      if (await cards.count() !== 0 || !await tab.locator('#search-empty').isVisible()) throw Error('Missing empty state');
      if (await tab.locator('#search-status').textContent() !== '0 products found.') throw Error('Empty count');
      if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Empty overflow');
      await tab.screenshot({ path: 'C:/AGENTES/Informes/flowhome/fh09ap-search-20260908/empty-' + width + '.png' });
      const clear = tab.getByRole('button', { name: 'Clear search', exact: true });
      await clear.focus();
      await tab.keyboard.press('Enter');
      if (await cards.count() !== 28 || await input.inputValue() !== '' || !await input.evaluate(el => el === document.activeElement)) throw Error('Keyboard recovery failed');
      if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Results overflow');
      await tab.screenshot({ path: 'C:/AGENTES/Informes/flowhome/fh09ap-search-20260908/results-' + width + '.png' });
      await tab.goto('http://127.0.0.1:4341/search/?q=echo%20dot');
      await tab.waitForFunction(() => document.querySelector('#search-status').textContent === '1 product found.');
      if (await cards.count() !== 1 || await input.inputValue() !== 'echo dot') throw Error('URL prefill failed');
      checks.push({ width, products: 28, uniqueImages: 28, queries: 4, empty: true, keyboardRecovery: true, urlPrefill: true, overflow: false });
    } finally { await context.close(); }
  }
  return checks;
}
