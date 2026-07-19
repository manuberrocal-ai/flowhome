import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const guideImages = [
  'robot-vacuums-guide.png',
  'smart-lighting-guide.png',
  'smart-hubs-guide.png',
];

async function text(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('best-of guides expose safe optional Pinterest image metadata', async () => {
  const schema = await text('src/content.config.ts');
  const page = await text('src/pages/best/[slug].astro');

  assert.match(schema, /pinterestImage:\s*z\.string\(\)\.regex\(\/\^\\\/images\\\/pinterest\\\//);
  assert.match(schema, /pinterestImage:\s*z\.string\(\)\.regex\(\/\^.*\\\.png\$\/\)\.optional\(\)/s);
  assert.match(page, /<BaseLayout[\s\S]*image=\{list\.data\.pinterestImage\}/);
  assert.match(page, /<BaseLayout[\s\S]*type="article"/);
});

test('the three guide PNGs declare and contain byte-identical 1000x1500 assets', async () => {
  const yamlPaths = [
    ['src/content/best-of/best-robot-vacuums-for-smart-homes.yaml', '/images/pinterest/robot-vacuums-guide.png'],
    ['src/content/best-of/best-smart-lighting-for-room-control.yaml', '/images/pinterest/smart-lighting-guide.png'],
    ['src/content/best-of/best-smart-hubs-for-matter-zigbee.yaml', '/images/pinterest/smart-hubs-guide.png'],
  ];

  for (const [yamlPath, imagePath] of yamlPaths) {
    assert.match(await text(yamlPath), new RegExp(`^pinterestImage: ${imagePath.replaceAll('/', '\\/')}$`, 'm'));
  }

  for (const imageName of guideImages) {
    const publicPath = resolve(root, 'public/images/pinterest', imageName);
    const sourcePath = resolve(root, 'assets/pinterest/launch-01/png', imageName);
    const [publicImage, sourceImage] = await Promise.all([readFile(publicPath), readFile(sourcePath)]);
    assert.deepEqual(pngDimensions(publicImage), { width: 1000, height: 1500 });
    assert.deepEqual(publicImage, sourceImage);
    assert.equal((await stat(publicPath)).isFile(), true);
  }
});
