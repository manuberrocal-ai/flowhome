import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCurrentSitemapUrls, validateExplicitUrls } from './deployed-urls.mjs';

const SITE = 'https://flowhome.dev';
const HOST = 'flowhome.dev';
const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';
const MAX_BATCH_SIZE = 10_000;

export function findIndexNowKey(publicDir = PUBLIC_DIR) {
  if (!existsSync(publicDir)) throw new Error(`Missing ${publicDir} directory.`);

  const candidates = readdirSync(publicDir)
    .filter((file) => /^[A-Za-z0-9-]{8,128}\.txt$/.test(file))
    .map((file) => ({ file, key: file.replace(/\.txt$/, '') }))
    .filter(({ file, key }) => readFileSync(join(publicDir, file), 'utf8').trim() === key);

  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one IndexNow key file in ${publicDir}; found ${candidates.length}.`);
  }

  return candidates[0].key;
}

export function readIndexNowUrls(urlsFile, distDir = DIST_DIR) {
  if (!urlsFile) throw new Error('INDEXNOW_URLS_FILE is required; IndexNow only submits an explicit deployed URL list.');
  if (!existsSync(urlsFile)) throw new Error(`INDEXNOW_URLS_FILE does not exist: ${urlsFile}`);

  const content = readFileSync(urlsFile, 'utf8');
  if (!content.trim()) throw new Error('INDEXNOW_URLS_FILE is empty; no URLs were selected for submission.');

  return validateExplicitUrls(content, readCurrentSitemapUrls(distDir));
}

export function partitionUrls(urls, batchSize = MAX_BATCH_SIZE) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('IndexNow batch size must be a positive integer.');
  return Array.from({ length: Math.ceil(urls.length / batchSize) }, (_, index) => urls.slice(index * batchSize, (index + 1) * batchSize));
}

export async function submitIndexNow({
  publicDir = PUBLIC_DIR,
  distDir = DIST_DIR,
  urlsFile = process.env.INDEXNOW_URLS_FILE,
  endpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow',
  dryRun = process.env.INDEXNOW_DRY_RUN === 'true' || process.argv.includes('--dry-run'),
  softFail = process.env.INDEXNOW_SOFT_FAIL === 'true' || process.argv.includes('--soft-fail'),
  fetchImpl = globalThis.fetch,
} = {}) {
  const key = findIndexNowKey(publicDir);
  const urls = readIndexNowUrls(urlsFile, distDir);
  const batches = partitionUrls(urls);

  console.log(`IndexNow key location: ${SITE}/${key}.txt`);
  console.log(`IndexNow URLs prepared: ${urls.length}`);

  for (const [index, urlList] of batches.entries()) {
    const payload = { host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList };
    if (dryRun) {
      if (batches.length > 1) console.log(`IndexNow payload ${index + 1}/${batches.length}:`);
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }

    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();
      console.log(`IndexNow response: ${response.status} ${response.statusText}`);
      if (responseText) console.log(responseText);

      if ([200, 202].includes(response.status)) continue;
      throw new Error(`IndexNow submission failed with ${response.status}.`);
    } catch (error) {
      if (softFail) {
        console.warn(`Warning: ${error.message}`);
        continue;
      }
      throw error;
    }
  }
}

export async function main() {
  await submitIndexNow();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
