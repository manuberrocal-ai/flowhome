async page => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 1000 }, javaScriptEnabled: false });
  try {
    const tab = await context.newPage();
    const results = [];
    for (const route of ['/preferences/', '/cart/', '/search/', '/account/']) {
      await tab.goto('http://127.0.0.1:4339' + route);
      const text = await tab.locator('main').innerText();
      if (route !== '/account/' && (!text.includes('JavaScript') || text.includes('Checking secure'))) throw Error(route + ': missing fallback');
      if (route === '/cart/' && text.includes('Your FlowHome list is empty')) throw Error('Unread list presented as empty');
      results.push({ route, text });
    }
    return results;
  } finally { await context.close(); }
}
