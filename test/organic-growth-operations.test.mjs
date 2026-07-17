import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, validateRows, renderReport } from '../scripts/maintenance/organic-growth-report.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFile(path.join(root, file), 'utf8');

test('scorecard keeps the required 14-column header and evidence-backed rows', async () => {
  const rows = parseCsv(await read('data/organic-growth-scorecard.csv'));
  assert.deepEqual(rows[0], ['recorded_at', 'window_days', 'source', 'cluster', 'page_url', 'query', 'impressions', 'clicks', 'ctr', 'avg_position', 'sessions', 'engaged_sessions', 'affiliate_clicks', 'notes']);
  const records = validateRows(rows);
  const sources = new Set(records.map((record) => record.source));
  assert.ok(records.length > 0);
  assert.ok(sources.has('Amazon'));
  assert.ok(sources.has('Bing'));
  assert.ok(sources.has('GA4'));
  assert.ok(sources.has('GSC'));
});

test('CSV parser handles quoted commas and escaped quotes', () => {
  const records = validateRows(parseCsv(`${'recorded_at,window_days,source,cluster,page_url,query,impressions,clicks,ctr,avg_position,sessions,engaged_sessions,affiliate_clicks,notes'}\n2026-07-15,7,GSC,robot-vacuums,https://example.test/a,"best, vacuum",10,2,20,3,1,1,1,"said ""useful"""`));
  assert.equal(records[0].query, 'best, vacuum');
  assert.equal(records[0].notes, 'said "useful"');
  assert.deepEqual(parseCsv('a,b\n"line one\nline two",ok'), [['a', 'b'], ['line one\nline two', 'ok']]);
});

test('validation rejects missing columns, malformed numeric values, and whitespace numerics', () => {
  assert.throws(() => validateRows([['source'], ['GSC']]), /Missing required columns/);
  assert.throws(() => validateRows([parseCsv(awaitableHeader())[0], ...parseCsv(awaitableHeader('nope'))]), /numeric/);
  assert.throws(() => validateRows(parseCsv(awaitableHeader('   '))), /numeric/);
});

test('strict CSV parser rejects every malformed quote class', () => {
  assert.throws(() => parseCsv('a,b\na"b,c'), /quote inside an unquoted field/);
  assert.throws(() => parseCsv('a,b\n"ok"trailing,c'), /after a closing quote/);
  assert.throws(() => parseCsv('a,b\n"unterminated,c'), /unterminated quoted field/);
});

const awaitableHeader = (value = '') => `recorded_at,window_days,source,cluster,page_url,query,impressions,clicks,ctr,avg_position,sessions,engaged_sessions,affiliate_clicks,notes\n2026-07-15,${value},GSC,c,https://example.test,q,1,1,100,1,1,1,1,n`;

test('empty report is explicit and grouped summaries stay within source and cluster', () => {
  assert.match(renderReport([]), /no observations/i);
  const rows = validateRows(parseCsv(`${awaitableHeader('7')}\n2026-07-16,7,GA4,c,https://example.test,q,,,,,2,1,3,n`));
  const report = renderReport(rows);
  assert.match(report, /GSC \| c/);
  assert.match(report, /GA4 \| c/);
  assert.match(report, /not combined/);
});

test('runbook and package expose the required operating contracts', async () => {
  const runbook = await read('docs/ORGANIC_GROWTH_RUNBOOK.md');
  const packageJson = JSON.parse(await read('package.json'));
  assert.match(runbook, /Days 1–7|Days 1-7/);
  assert.match(runbook, /2–3 useful|2-3 useful/);
  assert.match(runbook, /Decision gate/);
  assert.match(runbook, /Paid advertising is explicitly out of scope/);
  assert.match(runbook, /never resubmit unchanged URLs|Deduplicate URLs/);
  assert.equal(packageJson.scripts['growth:report'], 'node scripts/maintenance/organic-growth-report.mjs');
});

test('CLI reports the non-empty scorecard and rejects malformed input without network access', async () => {
  const report = spawnSync(process.execPath, ['scripts/maintenance/organic-growth-report.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(report.status, 0);
  assert.match(report.stdout, /\d+ observation\(s\)/i);
  const badPath = path.join(root, '.tmp-organic-growth-invalid.csv');
  await writeFile(badPath, `${awaitableHeader('bad')}\n`);
  const invalid = spawnSync(process.execPath, ['scripts/maintenance/organic-growth-report.mjs', badPath], { cwd: root, encoding: 'utf8' });
  await rm(badPath, { force: true });
  assert.notEqual(invalid.status, 0);
  const optionalPath = path.join(root, '.tmp-organic-growth-valid.csv');
  await writeFile(optionalPath, await read('data/organic-growth-scorecard.csv'));
  const optional = spawnSync(process.execPath, ['scripts/maintenance/organic-growth-report.mjs', optionalPath], { cwd: root, encoding: 'utf8' });
  await rm(optionalPath, { force: true });
  assert.equal(optional.status, 0);
  assert.match(optional.stdout, /\d+ observation\(s\)/i);
});
