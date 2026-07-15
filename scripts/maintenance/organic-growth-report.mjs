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

  const positions = Object.fromEntries(headers.map((header, index) => [header, index]));
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
  const groups = new Map();
  for (const record of records) {
    const key = `${record.source}\u0000${record.cluster}`;
    if (!groups.has(key)) groups.set(key, { source: record.source, cluster: record.cluster, records: [] });
    groups.get(key).records.push(record);
  }
  return [...groups.values()].map((group) => {
    const sum = (column) => group.records.reduce((total, record) => total + (number(record[column]) ?? 0), 0);
    const impressions = sum('impressions');
    const clicks = sum('clicks');
    const positions = group.records.map((record) => number(record.avg_position)).filter((value) => value !== null);
    return {
      ...group,
      observations: group.records.length,
      impressions,
      clicks,
      ctr: impressions > 0 ? clicks / impressions * 100 : null,
      avgPosition: positions.length > 0 ? positions.reduce((total, value) => total + value, 0) / positions.length : null,
      sessions: sum('sessions'),
      engagedSessions: sum('engaged_sessions'),
      affiliateClicks: sum('affiliate_clicks'),
    };
  });
}

export function renderReport(records) {
  if (records.length === 0) return 'Organic growth report: no observations recorded.\nTracker is valid and header-only; no conclusions are available.\n';
  const lines = [`Organic growth report: ${records.length} observation(s).`, 'Summaries are kept within each source + cluster; source metrics are not combined.'];
  for (const group of summarize(records)) {
    const metrics = [
      `observations=${group.observations}`,
      `impressions=${format(group.impressions)}`,
      `clicks=${format(group.clicks)}`,
      group.ctr === null ? null : `ctr=${group.ctr.toFixed(2)}%`,
      group.avgPosition === null ? null : `avg_position=${group.avgPosition.toFixed(2)}`,
      `sessions=${format(group.sessions)}`,
      `engaged_sessions=${format(group.engagedSessions)}`,
      `affiliate_clicks=${format(group.affiliateClicks)}`,
    ].filter(Boolean);
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
