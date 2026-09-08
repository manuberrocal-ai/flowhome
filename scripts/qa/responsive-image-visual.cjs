async page => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('http://127.0.0.1:4339/product/echo-dot-5th-gen/');
    await page.locator('img[src*="models-v1/echo-dot"]').first().evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/project/FH09AJ-profile-${width}.png` });
  }
  return { screenshots: 2 };
}
