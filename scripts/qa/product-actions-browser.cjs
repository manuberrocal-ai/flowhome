async page => {
  page.setDefaultTimeout(8000);
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4339/products/');
    const reject = page.getByRole('button', { name: 'Reject', exact: true });
    if (await reject.isVisible()) await reject.click();
    const card = page.locator('.product-card').first();
    await card.scrollIntoViewIfNeeded();
    await card.locator('img').evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    const details = card.locator('[data-product-action="details"]');
    await details.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    const focus = await details.evaluate(el => {
      const style = getComputedStyle(el);
      return { outline: style.outlineColor, width: style.outlineWidth, visible: el.matches(':focus-visible') };
    });
    if (!focus.visible || focus.width !== '3px' || focus.outline !== 'rgb(18, 48, 79)') throw new Error('Focus indicator failed');
    const labels = await card.locator('.product-card-side-action-label').evaluateAll(nodes => nodes.map(el => {
      const s = getComputedStyle(el);
      return { text: el.textContent, opacity: s.opacity, width: el.getBoundingClientRect().width };
    }));
    if (labels.some(label => label.opacity !== '1' || label.width < 20)) throw new Error('Hidden action label');
    const save = card.locator('[data-flow-cart-add]');
    if (await save.getAttribute('aria-pressed') === 'true') await save.press('Space');
    const before = await save.boundingBox();
    await save.click();
    if (await save.getAttribute('aria-pressed') !== 'true') throw new Error('Save failed');
    const after = await save.boundingBox();
    if (Math.abs(before.width - after.width) > 1) throw new Error('Save changed target width');
    await save.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await save.click();
    if (await save.getAttribute('aria-pressed') !== 'false') throw new Error('Remove failed');
    await details.focus();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw new Error('Horizontal overflow');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.product-card-side-action--list')).color === 'rgb(18, 48, 79)');
    await page.screenshot({ path: 'docs/project/FH12C-actions-' + width + '.png' });
    results.push({ width, focus, labels, saveToggle: true, stableWidth: true, overflow });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('.product-card-side-action').first().evaluate(el => getComputedStyle(el).transitionDuration);
  results.push({ reducedMotionDuration: duration });
  return results;
}
