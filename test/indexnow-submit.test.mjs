import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { partitionUrls, readIndexNowUrls, submitIndexNow } from '../scripts/deploy/indexnow-submit.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'flowhome-indexnow-'));
  const publicDir = path.join(root, 'public');
  const distDir = path.join(root, 'dist');
  await Promise.all([mkdir(publicDir), mkdir(distDir)]);
  const key = '85b3b79bd6a26a3862465cc5611db3a2';
  await Promise.all([
    writeFile(path.join(publicDir, `${key}.txt`), key),
    writeFile(path.join(distDir, 'sitemap-0.xml'), '<urlset><url><loc>https://flowhome.dev/a/</loc></url><url><loc>https://flowhome.dev/b/</loc></url><url><loc>https://flowhome.dev/best/best-smart-lighting-for-room-control/</loc></url></urlset>'),
  ]);
  return { root, publicDir, distDir };
}

test('requires a non-empty explicit file and validates submitted URLs against the sitemap', async (t) => {
  const { root, distDir } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.throws(() => readIndexNowUrls(undefined, distDir), /INDEXNOW_URLS_FILE is required/);
  const empty = path.join(root, 'empty.txt');
  const foreign = path.join(root, 'foreign.txt');
  const missing = path.join(root, 'missing.txt');
  await Promise.all([writeFile(empty, ''), writeFile(foreign, 'https://example.com/a/'), writeFile(missing, 'https://flowhome.dev/missing/')]);
  assert.throws(() => readIndexNowUrls(empty, distDir), /empty/i);
  assert.throws(() => readIndexNowUrls(foreign, distDir), /HTTPS flowhome\.dev/i);
  assert.throws(() => readIndexNowUrls(missing, distDir), /current dist sitemap/i);
});

test('deduplicates URLs and submits sitemap-listed URLs in 10,000-URL batches', async (t) => {
  const { root, publicDir, distDir } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const urlsFile = path.join(root, 'urls.txt');
  await writeFile(urlsFile, 'https://flowhome.dev/b/\nhttps://flowhome.dev/a/\nhttps://flowhome.dev/a/\n');
  assert.deepEqual(readIndexNowUrls(urlsFile, distDir), ['https://flowhome.dev/a/', 'https://flowhome.dev/b/']);
  const manyUrls = Array.from({ length: 10_001 }, (_, index) => `https://flowhome.dev/page-${index}/`);
  assert.deepEqual(partitionUrls(manyUrls).map((batch) => batch.length), [10_000, 1]);
  await writeFile(path.join(distDir, 'sitemap-0.xml'), `<urlset>${manyUrls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
  await writeFile(urlsFile, `${manyUrls.join('\n')}\n`);

  const calls = [];
  await submitIndexNow({ publicDir, distDir, urlsFile, fetchImpl: async (...args) => {
    calls.push(args);
    return { status: 202, statusText: 'Accepted', text: async () => '' };
  } });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(([, options]) => JSON.parse(options.body).urlList.length), [10_000, 1]);
});

test('dry-run never calls fetch and network exceptions obey soft-fail mode', async (t) => {
  const { root, publicDir, distDir } = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const urlsFile = path.join(root, 'urls.txt');
  await writeFile(urlsFile, 'https://flowhome.dev/best/best-smart-lighting-for-room-control/\n');
  let fetchCalls = 0;
  await submitIndexNow({ publicDir, distDir, urlsFile, dryRun: true, fetchImpl: async () => {
    fetchCalls += 1;
    throw new Error('fetch must not run in dry-run');
  } });
  assert.equal(fetchCalls, 0);

  const networkFailure = async () => { throw new Error('network unavailable'); };
  await assert.doesNotReject(() => submitIndexNow({ publicDir, distDir, urlsFile, softFail: true, fetchImpl: networkFailure }));
  await assert.rejects(() => submitIndexNow({ publicDir, distDir, urlsFile, softFail: false, fetchImpl: networkFailure }), /network unavailable/);
});
