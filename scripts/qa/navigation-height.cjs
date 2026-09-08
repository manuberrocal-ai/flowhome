async page => {
  const results = [];
  for (const [width, height, javaScriptEnabled] of [[1024, 300, true], [1280, 600, true], [1440, 500, true], [320, 480, true], [844, 390, true], [1024, 360, false]]) {
    const context = await page.context().browser().newContext({ viewport: { width, height }, javaScriptEnabled, reducedMotion: 'reduce' });
    try {
      const tab = await context.newPage();
      await tab.goto('http://127.0.0.1:4339/');
      const mobile = width < 1024;
      const panel = tab.locator(mobile ? '#mobile-menu' : '.nav-menu').first();
      if (mobile) {
        await tab.locator('.mobile-menu-btn').focus();
        await tab.keyboard.press('Enter');
        await tab.locator('.mobile-nav-trigger').first().focus();
        await tab.keyboard.press('Enter');
      } else {
        await tab.locator('.nav-dropdown > a').first().focus();
      }
      // Walk, rather than focus a distant element programmatically: native Tab
      // must keep every destination within the scrolling panel and viewport.
      let reachedLast = false;
      let checked = 0;
      for (let i = 0; i < 45; i++) {
        await tab.keyboard.press('Tab');
        const state = await panel.evaluate(el => {
          const active = document.activeElement;
          const rect = active.getBoundingClientRect();
          const bounds = el.getBoundingClientRect();
          return { inside: el.contains(active), label: active.textContent.trim(), top: rect.top, bottom: rect.bottom, panelTop: bounds.top, panelBottom: bounds.bottom, viewport: innerHeight };
        });
        if (!state.inside) throw Error(JSON.stringify({ width, height, issue: 'Focus escaped before last link', state }));
        if (state.bottom > state.viewport + 1 || state.top < state.panelTop - 1 || state.bottom > state.panelBottom + 1) throw Error(JSON.stringify({ width, height, issue: 'Focused link clipped', state }));
        checked++;
        if (state.label === (mobile ? 'Language options' : 'Hubs')) { reachedLast = true; break; }
      }
      if (!reachedLast) throw Error('Last navigation link not reached');
      const geometry = await panel.evaluate(el => ({ bottom: el.getBoundingClientRect().bottom, scrollTop: el.scrollTop, scrollable: el.scrollHeight > el.clientHeight, viewport: innerHeight }));
      if (geometry.bottom > height || !geometry.scrollable || geometry.scrollTop <= 0) throw Error(JSON.stringify(geometry));
      if (javaScriptEnabled) {
        await tab.keyboard.press('Escape');
        const trigger = tab.locator(mobile ? '.mobile-menu-btn' : '.nav-dropdown > a').first();
        if (!await trigger.evaluate(el => el === document.activeElement)) throw Error('Escape focus lost after scroll');
      }
      results.push({ width, height, javaScriptEnabled, focusedLinksChecked: checked, lastLinkVisible: true, ...geometry });
    } finally { await context.close(); }
  }
  return results;
}
