import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://flowhome.dev';
const HOST = 'flowhome.dev';
const PUBLIC_DIR = 'public';
const DIST_DIR = 'dist';
const ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const DRY_RUN = process.env.INDEXNOW_DRY_RUN === 'true' || process.argv.includes('--dry-run');

function findIndexNowKey() {
  const candidates = readdirSync(PUBLIC_DIR)
    .filter((file) => /^[A-Za-z0-9-]{8,128}\.txt$/.test(file))
    .map((file) => ({ file, key: file.replace(/\.txt$/, '') }))
    .filter(({ file, key }) => readFileSync(join(PUBLIC_DIR, file), 'utf8').trim() === key);

  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one IndexNow key file in ${PUBLIC_DIR}; found ${candidates.length}.`);
  }

  return candidates[0].key;
}

function readSitemapUrls() {
  if (!existsSync(DIST_DIR)) {
    throw new Error('Missing dist directory. Run npm run build before submitting IndexNow URLs.');
  }

  const xmlFiles = readdirSync(DIST_DIR).filter((file) => /^sitemap.*\.xml$/.test(file));
  const urls = new Set();

  for (const file of xmlFiles) {
    const xml = readFileSync(join(DIST_DIR, file), 'utf8');
    const matches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const match of matches) {
      const url = match[1].trim();
      if (url.startsWith(SITE) && !url.endsWith('.xml')) {
        urls.add(url);
      }
    }
  }

  if (!urls.size) {
    throw new Error('No page URLs found in sitemap files.');
  }

  return [...urls].sort();
}

async function submitIndexNow() {
  const key = findIndexNowKey();
  const urls = readSitemapUrls();
  const payload = {
    host: HOST,
    key,
    keyLocation: `${SITE}/${key}.txt`,
    urlList: urls,
  };

  console.log(`IndexNow key location: ${payload.keyLocation}`);
  console.log(`IndexNow URLs prepared: ${urls.length}`);

  if (DRY_RUN) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  console.log(`IndexNow response: ${response.status} ${response.statusText}`);
  if (responseText) console.log(responseText);

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow submission failed with ${response.status}.`);
  }
}

submitIndexNow().catch((error) => {
  console.error(error.message);
  process.exit(1);
});