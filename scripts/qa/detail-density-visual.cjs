async page => {
  const context = await page.context().browser().newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  try {
    const tab = await context.newPage();
    await tab.goto('http://127.0.0.1:4339/product/echo-dot-5th-gen/');
    const img = tab.locator('article img[data-fallback-src]').first();
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(img => img.decode());
    const src = await img.evaluate(img => new URL(img.currentSrc).pathname);
    if (!src.endsWith('-960.webp')) throw Error(src);
    await img.screenshot({ path: 'docs/project/FH09AK-echo-density3.png' });
    return { src, density: 3 };
  } finally { await context.close(); }
}
