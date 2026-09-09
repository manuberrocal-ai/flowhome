async page => {
  const results = [];
  for (const width of [1024, 1280, 1440]) {
    for (const reducedMotion of ['reduce', 'no-preference']) {
      const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, reducedMotion });
      try {
        const tab = await context.newPage();
        const failures = [];
        tab.on('pageerror', error => failures.push(error.message));
        tab.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`); });
        await tab.goto('http://127.0.0.1:4339/');
        const groups = tab.locator('.nav-dropdown');
        for (let i = 0; i < 3; i++) {
          const group = groups.nth(i);
          const link = group.locator(':scope > a');
          const menu = group.locator('.nav-menu');
          await link.focus();
          if (await link.getAttribute('aria-expanded') !== 'true') throw Error('Focus did not announce expansion');
          await tab.keyboard.press('Tab');
          if (!await menu.evaluate(el => el.contains(document.activeElement))) throw Error(JSON.stringify({ issue: 'Open links not reachable', width, reducedMotion, group: i, state: await menu.evaluate(el => ({ inert: el.inert, visibility: getComputedStyle(el).visibility, active: document.activeElement?.outerHTML })) }));
          await tab.keyboard.press('Escape');
          if (!await link.evaluate(el => el === document.activeElement)) throw Error('Escape lost focus');
          if (await link.getAttribute('aria-expanded') !== 'false' || !await menu.evaluate(el => el.inert)) throw Error('Escape did not close');
          await menu.waitFor({ state: 'hidden' });
          await tab.keyboard.press('Tab');
          if (await menu.evaluate(el => el.contains(document.activeElement))) throw Error('Closed links remained tabbable');
          await link.focus();
          await tab.keyboard.press('Escape');
          await tab.keyboard.press('ArrowDown');
          if (!await menu.locator('a').first().evaluate(el => el === document.activeElement)) throw Error('ArrowDown did not reopen');
          await tab.keyboard.press('Escape');
          await tab.locator('h1').click();
          await link.hover();
          if (await link.getAttribute('aria-expanded') !== 'true') throw Error('Hover did not announce expansion');
          await tab.mouse.move(5, 950);
          await menu.waitFor({ state: 'hidden' });
        }
        // Parent links must still navigate; they were not converted to buttons.
        await groups.first().locator(':scope > a').focus();
        await tab.keyboard.press('Enter');
        await tab.waitForURL('**/products/');
        if (await tab.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw Error('Header overflow');
        if (failures.length) throw Error(JSON.stringify(failures));
        results.push({ width, reducedMotion, dropdowns: 3, escapeTabArrowHover: true, parentNavigation: true });
      } finally { await context.close(); }
    }
  }
  for (const width of [320, 375, 390, 768]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      await tab.goto('http://127.0.0.1:4339/');
      const button = tab.locator('.mobile-menu-btn');
      await button.focus();
      await tab.keyboard.press('Enter');
      const trigger = tab.locator('.mobile-nav-trigger').first();
      await trigger.focus();
      await tab.keyboard.press('Tab');
      if (await tab.locator('.mobile-submenu').first().evaluate(el => el.contains(document.activeElement))) throw Error('Mobile closed submenu reachable');
      await tab.keyboard.press('Escape');
      if (await button.getAttribute('aria-expanded') !== 'false' || !await button.evaluate(el => el === document.activeElement)) throw Error('Mobile regression');
      results.push({ width, mobileEscapeAndClosedTab: true });
    } finally { await context.close(); }
  }
  const fallback = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 }, javaScriptEnabled: false });
  try {
    const tab = await fallback.newPage();
    await tab.goto('http://127.0.0.1:4339/');
    await tab.locator('.nav-dropdown > a').first().focus();
    await tab.keyboard.press('Tab');
    if (!await tab.locator('.nav-menu').first().evaluate(el => el.contains(document.activeElement))) throw Error('No-script navigation unavailable');
    results.push({ javaScriptEnabled: false, desktopLinksReachable: true });
  } finally { await fallback.close(); }
  return results;
}
