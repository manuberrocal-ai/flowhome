async page => {
  await page.route('**/*', route => route.continue());
  const results = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('http://127.0.0.1:4339/');
    const dots = page.locator('[data-hero-dot]');
    const slides = [];
    for (let i = 0; i < await dots.count(); i++) {
      await dots.nth(i).click();
      await page.waitForFunction(() => { const image = document.querySelector('[data-hero-image]'); return image.complete && image.naturalWidth > 0 && image.currentSrc.replace(/-(240|480|720)\.webp$/, '.webp') === image.src; });
      await page.locator('[data-hero-image]').evaluate(async image => { await image.decode(); });
      slides.push(await page.locator('[data-hero-showcase]').evaluate(root => {
        const image = root.querySelector('[data-hero-image]');
        return { src: image.currentSrc, width: image.getBoundingClientRect().width,
          bytes: performance.getEntriesByName(image.currentSrc).at(-1)?.encodedBodySize,
          caption: root.querySelector('[data-hero-field="image-caption"]').textContent,
          alt: image.alt, details: root.querySelector('[data-hero-details]').getAttribute('href') };
      }));
    }
    if (slides.length !== 6 || new Set(slides.map(s => s.src)).size !== 6 || slides.some(s => !s.bytes || !s.caption.includes('not a') || !s.alt.includes('Illustration'))) throw Error('Hero identity or transfer failure: ' + JSON.stringify(slides));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    if (overflow) throw Error('Horizontal overflow');
    results.push({ width, totalBytes: slides.reduce((sum, s) => sum + s.bytes, 0), slides });
  }
  return results;
}
