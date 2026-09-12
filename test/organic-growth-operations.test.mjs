import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, validateRows, renderReport, summarize } from '../scripts/maintenance/organic-growth-report.mjs';

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

const reportRow = (source, cluster, values) => `recorded_at,window_days,source,cluster,page_url,query,impressions,clicks,ctr,avg_position,sessions,engaged_sessions,affiliate_clicks,notes\n2026-07-15,7,${source},${cluster},https://example.test/q,query,${values.impressions ?? ''},${values.clicks ?? ''},${values.ctr ?? ''},${values.avg_position ?? ''},${values.sessions ?? ''},${values.engaged_sessions ?? ''},${values.affiliate_clicks ?? ''},note`;

test('empty report is explicit and grouped summaries stay within source and cluster', () => {
  assert.match(renderReport([]), /no observations/i);
  const rows = validateRows(parseCsv(`${awaitableHeader('7')}\n2026-07-16,7,GA4,c,https://example.test,q,,,,,2,1,3,n`));
  const report = renderReport(rows);
  assert.match(report, /GSC \| c/);
  assert.match(report, /GA4 \| c/);
  assert.match(report, /not combined/);
});

test('renderReport keeps explicit zero numeric metrics and omits unavailable ones', () => {
  const gscRows = validateRows(parseCsv(reportRow('GSC', 'gsc-zero', { impressions: 12, clicks: 0 })));
  const gscReport = renderReport(gscRows);
  assert.match(gscReport, /GSC \| gsc-zero \| .*impressions=12.*clicks=0.*ctr=0\.00%/);
  assert.ok(!gscReport.includes('sessions='));
  assert.ok(!gscReport.includes('engaged_sessions='));
  assert.ok(!gscReport.includes('affiliate_clicks='));

  const ga4Rows = validateRows(parseCsv(reportRow('GA4', 'ga4-sessions', { sessions: 2, engaged_sessions: 1 })));
  const ga4Report = renderReport(ga4Rows);
  assert.match(ga4Report, /GA4 \| ga4-sessions \| .*sessions=2.*engaged_sessions=1/);
  assert.ok(!ga4Report.includes('impressions='));
  assert.ok(!ga4Report.includes('clicks='));

  const amazonRows = validateRows(parseCsv(reportRow('Amazon', 'amazon-zero', { affiliate_clicks: 0 })));
  const amazonReport = renderReport(amazonRows);
  assert.match(amazonReport, /Amazon \| amazon-zero \| .*affiliate_clicks=0/);
});

test('rolling windows and repeated imports never inflate traffic', () => {
  const [first] = validateRows(parseCsv(reportRow('GSC', 'same', { impressions: 100, clicks: 5, avg_position: 2 })));
  const next = { ...first, recorded_at: '2026-07-16', impressions: '120', clicks: '6', avg_position: '8' };
  const summaries = summarize([first, next, { ...first }]);
  assert.equal(summaries.length, 3);
  assert.deepEqual(summaries.map((row) => row.impressions), [100, 120, 100]);
  assert.deepEqual(summaries.map((row) => row.avgPosition), [2, 8, 2]);
  assert.match(renderReport([first, next]), /windows.*not combined/);
});

test('page totals and query slices remain distinct with context', () => {
  const [total] = validateRows(parseCsv(reportRow('GSC', 'same', { impressions: 100, clicks: 5 })));
  total.query = '';
  total.notes = 'US, mobile';
  const slice = { ...total, query: 'smart hub', impressions: '20', clicks: '2' };
  const groups = summarize([total, slice]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((row) => row.ctr), [5, 10]);
  const report = renderReport([total, slice]);
  assert.match(report, /query="smart hub"/);
  assert.match(report, /notes="US, mobile"/);
  assert.match(report, /window_days="7"/);
  assert.doesNotMatch(report, /impressions=120/);
});

test('missing and zero observations are not merged into a measured total', () => {
  const [missing] = validateRows(parseCsv(reportRow('Amazon', 'same', {})));
  const groups = summarize([missing, { ...missing, affiliate_clicks: '0' }]);
  assert.deepEqual(groups.map((row) => row.affiliateClicks), [null, 0]);
  assert.equal(groups[0].ctr, null);
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
