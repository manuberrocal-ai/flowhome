import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

test('favicon is discovered early at low priority without hiding or changing the tab icon', async () => {
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const preloads = [...layout.matchAll(/<link\s+[^>]*rel="preload"[^>]*>/g)].map(match => match[0]);
  const iconPreloads = preloads.filter(link => link.includes('/images/flowhome-favicon.png'));
  assert.equal(iconPreloads.length, 1);
  assert.match(iconPreloads[0], /as="image"/);
  assert.match(iconPreloads[0], /type="image\/png"/);
  assert.match(iconPreloads[0], /fetchpriority="low"/);
  assert.match(layout, /<link rel="icon" type="image\/png" href="\/images\/flowhome-favicon\.png" \/>/);
  assert.ok(layout.indexOf(iconPreloads[0]) < layout.indexOf('</head>'));
});

test('favicon and manifest use the original transparent PNG without a white tile', async () => {
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const png = await readFile(new URL('../public/images/flowhome-favicon.png', import.meta.url));
  const metadata = await sharp(png).metadata();
  const manifest = JSON.parse(await readFile(new URL('../public/site.webmanifest', import.meta.url), 'utf8'));
  assert.match(layout, /rel="icon" type="image\/png" href="\/images\/flowhome-favicon\.png"/);
  assert.doesNotMatch(layout, /rel="icon"[^>]*favicon\.svg/);
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.hasAlpha, true);
  assert.deepEqual(manifest.icons, [{ src: '/images/flowhome-favicon.png', sizes: `${metadata.width}x${metadata.height}`, type: 'image/png', purpose: 'any' }]);
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let opaqueWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) transparent++;
    if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245 && data[i + 3] > 240) opaqueWhite++;
  }
  assert.ok(transparent > info.width * info.height * 0.3, 'Background must remain transparent');
  assert.equal(opaqueWhite, 0, 'No opaque white frame or background');
});

test('Apple touch icon retains its separate square opaque platform asset', async () => {
  const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
  assert.match(layout, /rel="apple-touch-icon" sizes="180x180" href="\/images\/flowhome-touch-180\.png"/);
  const source = await readFile(new URL('../public/favicon.svg', import.meta.url));
  const raster = await readFile(new URL('../public/images/flowhome-touch-180.png', import.meta.url));
  const metadata = await sharp(raster).metadata();
  assert.equal(metadata.width, 180);
  assert.equal(metadata.height, 180);
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.hasAlpha, false);
  const expected = await sharp(source).resize(180, 180).flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer();
  assert.deepEqual(await sharp(raster).raw().toBuffer(), expected);
});
