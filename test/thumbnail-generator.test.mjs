import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { encodeThumbnails } from '../scripts/maintenance/encode-product-thumbnails.mjs';
import { thumbnailSources, thumbnailWidths, thumbnailPath } from '../src/lib/product-thumbnails.js';

test('thumbnail cache skips unchanged work and rebuilds changed, missing or corrupt artifacts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'flowhome-thumbnail-test-'));
  const root = pathToFileURL(dir + '/');
  try {
    const source = thumbnailSources[0];
    await mkdir(new URL('public/images/product-art/illustrations-v1/', root), { recursive: true });
    const input = new URL('public' + source, root);
    const makeInput = color => sharp({ create: { width: 1254, height: 1254, channels: 3, background: color } }).webp().toBuffer();
    await writeFile(input, await makeInput('#abcdef'));
    const run = () => encodeThumbnails({ root, sources: [source] });
    assert.equal((await run()).written, thumbnailWidths.length);
    const output = new URL('public' + thumbnailPath(source, 240), root);
    const cache = new URL('reports/product-art/thumbnail-cache.json', root);
    const before = [await stat(output), await stat(cache)];
    const second = await run();
    assert.equal(second.encoded, 0);
    assert.equal(second.written, 0);
    assert.equal(second.reused, thumbnailWidths.length);
    assert.equal((await stat(output)).mtimeMs, before[0].mtimeMs);
    assert.equal((await stat(cache)).mtimeMs, before[1].mtimeMs);
    const stale = JSON.parse(await readFile(cache, 'utf8'));
    stale[thumbnailPath(source, 240)].key = 'old-recipe-or-library-version';
    await writeFile(cache, JSON.stringify(stale));
    const recipeMiss = await run();
    assert.equal(recipeMiss.encoded, 1);
    assert.equal(recipeMiss.written, 0);
    const expected = await readFile(output);
    await writeFile(output, 'corrupt');
    assert.equal((await run()).written, 1);
    assert.deepEqual(await readFile(output), expected);
    await rm(output);
    assert.equal((await run()).written, 1);
    await writeFile(input, await makeInput('#112233'));
    assert.equal((await run()).written, thumbnailWidths.length);
    await writeFile(cache, '{bad json');
    const rebuilt = await run();
    assert.equal(rebuilt.encoded, thumbnailWidths.length);
    assert.equal(rebuilt.written, 0);
    await assert.rejects(encodeThumbnails({ root, sources: ['/../outside.webp'] }), /Unlisted/);
  } finally {
    // Only the unique test-owned temporary directory returned above is removed.
    await rm(dir, { recursive: true, force: true });
  }
});
