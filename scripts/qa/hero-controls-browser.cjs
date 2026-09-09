async page => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const results = [];
  page.setDefaultTimeout(10000);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:4339/');
    const root = page.locator('[data-hero-showcase]');
    const playback = root.locator('[data-hero-playback]');
    await playback.scrollIntoViewIfNeeded();
    const state = await playback.textContent();
    if (state === 'Resume rotation') await playback.click();
    await page.waitForFunction(() => document.querySelector('[data-hero-playback]').textContent === 'Pause rotation');
    await playback.click();
    const title = await root.locator('[data-hero-field="title"]').textContent();
    await page.waitForTimeout(4600);
    if (await root.locator('[data-hero-field="title"]').textContent() !== title) throw new Error('Pause failed');
    await root.locator('.hero-next').click();
    const nextTitle = await root.locator('[data-hero-field="title"]').textContent();
    if (nextTitle === title) throw new Error('Next did not change selection');
    const details = await root.locator('[data-hero-details]').getAttribute('href');
    const photo = await root.locator('[data-hero-photo-link]').getAttribute('href');
    const live = await root.locator('[data-hero-live]').textContent();
    if (details !== photo || live !== 'Selected ' + nextTitle) throw new Error('Selection consumers diverged');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Overflow');
    await page.screenshot({ path: 'docs/project/FH12F-hero-' + width + '.png' });
    results.push({ width, paused: true, title: nextTitle, details, live });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-hero-playback]').disabled);
  if (!await page.locator('[data-hero-playback]').isDisabled()) throw new Error('Reduced motion control not disabled');
  results.push({ reducedMotion: true });
  return results;
}
