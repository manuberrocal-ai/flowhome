async page => {
  const results = [];
  for (const width of [390, 1440]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const tab = await context.newPage();
    await tab.goto('http://127.0.0.1:4339/products/');
    const result = await tab.evaluate(async () => {
      const images = [...document.querySelectorAll('.product-card-image')];
      // Explicitly load the complete catalog, not a claim about first-viewport payload.
      images.forEach(image => { image.loading = 'eager'; });
      await Promise.all(images.map(image => image.decode()));
      const paths = [...new Set(images.map(image => image.currentSrc))];
      const resources = performance.getEntriesByType('resource').filter(entry => paths.includes(entry.name));
      return {
        images: images.length,
        unique: paths.length,
        encodedBytes: resources.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
        paths: paths.map(path => new URL(path).pathname),
        decoded: images.every(image => image.naturalWidth > 0 && image.naturalHeight > 0),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    if (!result.decoded || result.overflow || result.images !== 28 || result.unique < 14) throw new Error(JSON.stringify(result));
    results.push({ width, ...result });
    await context.close();
  }
  return results;
}
