import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { thumbnailSources, thumbnailWidths, thumbnailPath } from '../../src/lib/product-thumbnails.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const recipe = JSON.stringify({ resize: 'inside-no-enlargement', quality: 84, effort: 6, versions: sharp.versions });
async function readOptional(url) {
  try { return await readFile(url); } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

// Cache is a performance hint only: source, recipe and output hashes must match.
export async function encodeThumbnails({ root = new URL('../../', import.meta.url), sources = thumbnailSources } = {}) {
  if (sources.some(source => !thumbnailSources.includes(source))) throw new Error('Unlisted thumbnail source');
  const cacheUrl = new URL('reports/product-art/thumbnail-cache.json', root);
  const previousBytes = await readOptional(cacheUrl);
  let previous = {};
  try { previous = JSON.parse(previousBytes?.toString() ?? '{}'); } catch { /* Rebuild an invalid cache. */ }
  const next = {};
  const stats = { sources: sources.length, sourceBytes: 0, variants: 0, thumbnailBytes: 0, encoded: 0, written: 0, reused: 0 };
  for (const source of sources) {
    const input = await readFile(new URL('public' + source, root));
    stats.sourceBytes += input.length;
    const sourceHash = hash(input);
    for (const width of thumbnailWidths) {
      const path = thumbnailPath(source, width);
      const destination = new URL('public' + path, root);
      const existing = await readOptional(destination);
      const key = hash(sourceHash + recipe + width);
      const cached = previous?.[path];
      let output = existing;
      if (existing && cached?.key === key && cached?.outputHash === hash(existing)) {
        stats.reused++;
      } else {
        output = await sharp(input).resize(width, width, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 84, effort: 6 }).toBuffer();
        stats.encoded++;
        if (!existing?.equals(output)) {
          await writeFile(destination, output);
          stats.written++;
        }
      }
      next[path] = { key, outputHash: hash(output) };
      stats.variants++;
      stats.thumbnailBytes += output.length;
    }
  }
  const serialized = Buffer.from(JSON.stringify(next, null, 2) + '\n');
  if (!previousBytes?.equals(serialized)) {
    await mkdir(new URL('reports/product-art/', root), { recursive: true });
    await writeFile(cacheUrl, serialized);
  }
  return stats;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await encodeThumbnails()));
}
