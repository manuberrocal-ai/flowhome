// Deterministic format conversion only: never generates or retouches product art.
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { illustrationCategories } from '../../src/lib/product-image-policy.js';

const directory = new URL('../../public/images/product-art/illustrations-v1/', import.meta.url);
const reportDirectory = new URL('../../reports/product-art/', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const records = [];
for (const category of illustrationCategories) {
  const source = await readFile(new URL(`${category}.png`, directory));
  const output = await sharp(source).webp({ lossless: true, effort: 6 }).toBuffer();
  const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const encoded = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (original.info.width !== encoded.info.width || original.info.height !== encoded.info.height || !original.data.equals(encoded.data)) {
    throw new Error(`Pixel equivalence failed: ${category}`);
  }
  if (output.length >= source.length) throw new Error(`No byte saving: ${category}`);
  const target = new URL(`${category}.webp`, directory);
  // Refuse to replace a sibling asset not produced by this deterministic recipe.
  const existing = await readFile(target).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (existing && !existing.equals(output)) throw new Error(`Existing output differs: ${category}`);
  if (!existing) await writeFile(target, output, { flag: 'wx' });
  records.push({ category, originalBytes: source.length, webpBytes: output.length, width: encoded.info.width, height: encoded.info.height, sourceSha256: digest(source), outputSha256: digest(output), rgbaSha256: digest(original.data), identicalPixels: true });
}
const report = { encoder: sharp.versions, originalBytes: records.reduce((sum, record) => sum + record.originalBytes, 0), webpBytes: records.reduce((sum, record) => sum + record.webpBytes, 0), records };
await mkdir(reportDirectory, { recursive: true });
await writeFile(new URL('lossless-encoding.json', reportDirectory), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
