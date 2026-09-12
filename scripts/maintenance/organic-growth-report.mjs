import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_COLUMNS = [
  'recorded_at', 'window_days', 'source', 'cluster', 'page_url', 'query',
  'impressions', 'clicks', 'ctr', 'avg_position', 'sessions',
  'engaged_sessions', 'affiliate_clicks', 'notes',
];

const NUMERIC_COLUMNS = [
  'window_days', 'impressions', 'clicks', 'ctr', 'avg_position',
  'sessions', 'engaged_sessions', 'affiliate_clicks',
];

export function parseCsv(input) {
  const normalizedInput = input.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < normalizedInput.length; index += 1) {
    const character = normalizedInput[index];
    if (quoted) {
      if (character === '"' && normalizedInput[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += character;
      }
    } else if (closedQuote && character === ',') {
      row.push(field);
      field = '';
      closedQuote = false;
    } else if (closedQuote && character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      closedQuote = false;
    } else if (closedQuote) {
      throw new Error('Malformed CSV: unexpected text after a closing quote.');
    } else if (character === '"' && field === '') {
      quoted = true;
    } else if (character === '"') {
      throw new Error('Malformed CSV: quote inside an unquoted field.');
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('Malformed CSV: unterminated quoted field.');
  if (closedQuote) row.push(field);
  if (field !== '' || row.length > 0) {
    if (!closedQuote) row.push(field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value !== ''));
}

export function validateRows(rows) {
  if (rows.length === 0) throw new Error('CSV is empty; a header row is required.');
  const headers = rows[0];
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`);
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV columns are not allowed.');

  return rows.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) throw new Error(`Row ${rowIndex + 2} has ${values.length} fields; expected ${headers.length}.`);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    for (const column of NUMERIC_COLUMNS) {
      const value = record[column];
      if (value !== '' && (value.trim() === '' || !Number.isFinite(Number(value.trim())))) {
        throw new Error(`Row ${rowIndex + 2}: ${column} must be numeric.`);
      }
    }
    return record;
  });
}

const number = (value) => value === '' ? null : Number(value.trim());
const format = (value) => Number.isInteger(value) ? String(value) : value.toFixed(2);

export function summarize(records) {
  // A CSV row can be a page total, a query slice or a rolling window. The
  // schema cannot prove those populations are disjoint, so never add rows.
  return records.map((record) => {
    const impressions = number(record.impressions);
    const clicks = number(record.clicks);
    return {
      source: record.source,
      cluster: record.cluster,
      records: [record],
      observations: 1,
      impressions,
      clicks,
      ctr: impressions !== null && impressions > 0 && clicks !== null ? clicks / impressions * 100 : null,
      avgPosition: number(record.avg_position),
      sessions: number(record.sessions),
      engagedSessions: number(record.engaged_sessions),
      affiliateClicks: number(record.affiliate_clicks),
    };
  });
}

export function renderReport(records) {
  if (records.length === 0) return 'Organic growth report: no observations recorded.\nTracker is valid and header-only; no conclusions are available.\n';
  const lines = [`Organic growth report: ${records.length} observation(s).`, 'Each row is reported separately; windows, page totals, query slices and source metrics are not combined. No aggregate traffic or revenue is inferred.'];
  for (const group of summarize(records)) {
    const record = group.records[0];
    const metrics = [`observations=${group.observations}`, `recorded_at=${JSON.stringify(record.recorded_at)}`, `window_days=${JSON.stringify(record.window_days)}`, `page=${JSON.stringify(record.page_url)}`, `query=${JSON.stringify(record.query)}`];
    if (group.impressions !== null) metrics.push(`impressions=${format(group.impressions)}`);
    if (group.clicks !== null) metrics.push(`clicks=${format(group.clicks)}`);
    if (group.ctr !== null) metrics.push(`ctr=${group.ctr.toFixed(2)}%`);
    if (group.avgPosition !== null) metrics.push(`avg_position=${group.avgPosition.toFixed(2)}`);
    if (group.sessions !== null) metrics.push(`sessions=${format(group.sessions)}`);
    if (group.engagedSessions !== null) metrics.push(`engaged_sessions=${format(group.engagedSessions)}`);
    if (group.affiliateClicks !== null) metrics.push(`affiliate_clicks=${format(group.affiliateClicks)}`);
    metrics.push(`notes=${JSON.stringify(record.notes)}`);
    lines.push(`${group.source} | ${group.cluster} | ${metrics.join(' ')}`);
  }
  return `${lines.join('\n')}\n`;
}

export async function main(filePath = process.argv[2]) {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const defaultPath = path.resolve(scriptDirectory, '../../data/organic-growth-scorecard.csv');
  const inputPath = path.resolve(filePath || defaultPath);
  const records = validateRows(parseCsv(await readFile(inputPath, 'utf8')));
  process.stdout.write(renderReport(records));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Organic growth report error: ${error.message}`);
    process.exitCode = 1;
  });
}
