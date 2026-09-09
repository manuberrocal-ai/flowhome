import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

test('favicon and manifest share a square scalable navy/teal brand mark', async () => {
  const svg = await readFile(new URL('../public/favicon.svg', import.meta.url), 'utf8');
  const manifest = JSON.parse(await readFile(new URL('../public/site.webmanifest', import.meta.url), 'utf8'));
  assert.match(svg, /viewBox="0 0 64 64"/);
  assert.match(svg, /#12304f/);
  assert.match(svg, /#00bda5/);
  assert.doesNotMatch(svg, /#f97316|<script|href=/);
  assert.deepEqual(manifest.icons, [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]);
});

test('Apple touch icon is a square opaque raster of the current favicon', async () => {
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
