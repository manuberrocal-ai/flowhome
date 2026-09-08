async page => {
  page.setDefaultTimeout(8000);
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4341/product/amazon-smart-thermostat/');
    const reject = page.getByRole('button', { name: 'Reject', exact: true });
    if (await reject.isVisible()) await reject.click();
    const links = page.locator('[data-fh-amazon-cta][aria-label]');
    for (const link of await links.all()) {
      const visibleLabel = (await link.innerText()).replace(/\s+/g, ' ').trim();
      const name = await link.getAttribute('aria-label');
      if (!name.toLowerCase().includes(visibleLabel.toLowerCase())) throw new Error('Amazon name mismatch: ' + visibleLabel);
    }
    const details = page.locator('[data-product-action="details"]').first();
    if (!(await details.getAttribute('aria-label')).startsWith('View details:')) throw new Error('Details name mismatch');
    const save = page.locator('[data-flow-cart-add]').first();
    for (const saved of [false, true, false]) {
      if ((await save.getAttribute('aria-pressed')) !== String(saved)) await save.press('Space');
      const label = await save.locator('.product-card-side-action-label').innerText();
      const name = await save.getAttribute('aria-label');
      if (!name.startsWith(label + ':')) throw new Error('Toggle name mismatch: ' + label);
      if (saved && !name.includes('Remove from your FlowHome list')) throw new Error('Missing removal action');
    }
    await details.focus();
    await page.keyboard.press('Tab');
    if (!(await save.evaluate(el => el === document.activeElement && el.matches(':focus-visible')))) throw new Error('Keyboard focus failed');
    const contrast = await page.getByText('Amazon listing link', { exact: true }).evaluate(el => {
      const rgb = getComputedStyle(el).color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const linear = rgb.map(value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
      return 1.05 / (.2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2] + .05);
    });
    if (contrast < 4.5) throw new Error('Insufficient contrast');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
    await page.getByRole('complementary').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.playwright-cli/fh12s-product-' + width + '.png' });
    results.push({ width, amazonLinks: await links.count(), toggleAndKeyboard: true, contrast, overflow: false });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page.locator('[data-product-action="details"]').first().evaluate(el => getComputedStyle(el).transitionDuration);
  if (duration.split(',').some(value => parseFloat(value) > .001)) throw new Error('Reduced motion failed');
  if (errors.length) throw new Error(errors.join('; '));
  return { results, reducedMotion: duration, pageErrors: errors };
}
