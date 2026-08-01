import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const BASE_URL = (process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUTPUT_DIR = resolve(process.env.LIGHTHOUSE_OUTPUT_DIR || join(tmpdir(), `flowhome-lighthouse-${new Date().toISOString().replace(/[:.]/g, '-')}`));
const PROFILE_DIR = join(tmpdir(), `flowhome-lighthouse-profile-${process.pid}-${Date.now()}`);
const LOCAL_LIGHTHOUSE = join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'lighthouse.cmd' : 'lighthouse');
const LIGHTHOUSE_BIN = process.env.LIGHTHOUSE_BIN || LOCAL_LIGHTHOUSE;
const ROUTES = ['/', '/product/amazon-smart-thermostat/', '/review/roborock-q5-plus-review/', '/compare/amazon-smart-thermostat-vs-ecobee-smart-thermostat-premium/'];
const BUDGETS = { performance: 90, accessibility: 95, 'best-practices': 95, seo: 95, lcp: 2500, cls: 0.1, tbt: 200 };
const REQUIRED_LAB_AUDITS = ['largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time'];
let preview;
let createdPreview = false;

if (!relative(ROOT, OUTPUT_DIR).startsWith('..')) throw new Error('LIGHTHOUSE_OUTPUT_DIR must be outside the repository.');
if (!['127.0.0.1', 'localhost', '::1'].includes(new URL(BASE_URL).hostname)) throw new Error('LIGHTHOUSE_BASE_URL must resolve to localhost or a loopback address.');

export function parseLighthouseRuns(value = '3') {
  const runs = Number(value);
  if (!Number.isInteger(runs) || runs < 1 || runs > 5 || String(value).trim() !== String(runs)) throw new Error('LIGHTHOUSE_RUNS must be an integer from 1 through 5.');
  return runs;
}

export function median(values) {
  if (!Array.isArray(values) || !values.length || values.some((value) => !Number.isFinite(value))) throw new Error('median requires one or more finite values.');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function isCompleteLighthouseReport(result, requestedUrl) {
  try {
    return new URL(result?.finalUrl).href === new URL(requestedUrl).href
      && ['performance', 'accessibility', 'best-practices', 'seo'].every((category) => Number.isFinite(result?.categories?.[category]?.score))
      && REQUIRED_LAB_AUDITS.every((audit) => Number.isFinite(result?.audits?.[audit]?.numericValue));
  } catch { return false; }
}
export function classifyLighthouseOutcome(exitCode, result, requestedUrl) {
  if (isCompleteLighthouseReport(result, requestedUrl)) return { usable: true, warning: exitCode === 0 ? undefined : `Lighthouse exited ${exitCode} after a complete report; retained as a post-report cleanup warning.` };
  return { usable: false, failure: `Lighthouse exited ${exitCode} without a complete report for ${requestedUrl}.` };
}
export function aggregateLighthouseSamples(samples) {
  const scores = Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map((category) => [category, median(samples.map((sample) => sample.scores[category]))]));
  const lab = Object.fromEntries(['lcp', 'cls', 'tbt'].map((metric) => [metric, median(samples.map((sample) => sample.lab[metric]))]));
  const inp = samples.map((sample) => sample.lab.inp).filter(Number.isFinite);
  lab.inp = inp.length ? median(inp) : null;
  return { scores, lab };
}

async function exists(path) { try { await access(path, constants.F_OK); return true; } catch { return false; } }
async function findBrave() {
  if (process.env.LIGHTHOUSE_CHROME_PATH || process.env.BRAVE_PATH) return process.env.LIGHTHOUSE_CHROME_PATH || process.env.BRAVE_PATH;
  const candidates = process.platform === 'win32' ? [join(process.env.PROGRAMFILES || 'C:\\Program Files', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'), join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')] : ['/usr/bin/brave-browser', '/usr/bin/brave', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'];
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new Error('Brave was not found. Set LIGHTHOUSE_CHROME_PATH or BRAVE_PATH.');
}
async function serving() { try { return (await fetch(BASE_URL, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } }
function spawnLogged(command, args) { return spawn(command, args, { cwd: ROOT, stdio: 'ignore', windowsHide: true }); }
async function startPreview() {
  if (await serving()) return;
  preview = process.platform === 'win32' ? spawnLogged(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd run preview -- --host 127.0.0.1 --port 4321']) : spawnLogged('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321']); createdPreview = true;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) { if (preview.exitCode !== null) throw new Error(`Preview exited with ${preview.exitCode}.`); if (await serving()) return; await new Promise((resolvePromise) => setTimeout(resolvePromise, 250)); }
  throw new Error(`Preview server did not become ready at ${BASE_URL}.`);
}
async function stopPreview() {
  if (!createdPreview || !preview?.pid || preview.exitCode !== null) return;
  if (process.platform === 'win32') await new Promise((resolvePromise) => spawn('taskkill', ['/pid', String(preview.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true }).once('close', resolvePromise)); else preview.kill('SIGTERM');
}
function run(command, args, env = {}) { return new Promise((resolvePromise, reject) => { const child = spawn(command, args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: 'inherit', windowsHide: true, shell: process.platform === 'win32' }); child.once('error', reject); child.once('close', (code) => resolvePromise(code ?? 1)); }); }
function score(result, category) { return Math.round((result.categories?.[category]?.score ?? 0) * 100); }
function numeric(result, audit) { const value = result.audits?.[audit]?.numericValue; return Number.isFinite(value) ? value : null; }
async function readReport(path) { try { return JSON.parse(await readFile(path, 'utf8')); } catch { return undefined; } }
function reportName(route) { return route === '/' ? 'home' : route.split('/').filter(Boolean).join('-'); }

async function main() {
  const sampleCount = parseLighthouseRuns(process.env.LIGHTHOUSE_RUNS || '3');
  const summary = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, outputDir: OUTPUT_DIR, formFactor: 'mobile', sampleCount, budgets: BUDGETS, routes: [], failures: [], executionWarnings: [], notes: ['Synthetic local lab evidence only. External network is blocked; scores and lab metrics are not field CWV. INP can be unavailable in a lab run.'] };
  try {
    if (!await exists(LIGHTHOUSE_BIN)) throw new Error(`Repository-local Lighthouse binary is unavailable: ${LIGHTHOUSE_BIN}`);
    const chrome = await findBrave(); if (!await exists(chrome)) throw new Error(`Chrome executable does not exist: ${chrome}`);
    await mkdir(OUTPUT_DIR, { recursive: true }); await mkdir(PROFILE_DIR, { recursive: true }); await startPreview();
    for (const route of ROUTES) {
      const requestedUrl = `${BASE_URL}${route}`; const name = reportName(route); const samples = []; const routeFailures = [];
      for (let sampleIndex = 1; sampleIndex <= sampleCount; sampleIndex += 1) {
        const reportPath = join(OUTPUT_DIR, `${name}-sample-${sampleIndex}.json`);
        const exitCode = await run(LIGHTHOUSE_BIN, [requestedUrl, '--quiet', '--only-categories=performance,accessibility,best-practices,seo', '--form-factor=mobile', '--output=json', `--output-path=${reportPath}`, '--no-enable-error-reporting', '--blocked-url-patterns=https://*', `--chrome-flags=--headless=new --user-data-dir=${join(PROFILE_DIR, `${name}-sample-${sampleIndex}`)} --disable-background-networking --disable-component-update --disable-sync --host-resolver-rules=MAP * 0.0.0.0,EXCLUDE 127.0.0.1`], { CHROME_PATH: chrome, TEMP: PROFILE_DIR, TMP: PROFILE_DIR });
        const result = await readReport(reportPath); const outcome = classifyLighthouseOutcome(exitCode, result, requestedUrl);
        if (!outcome.usable) { routeFailures.push(`sample ${sampleIndex}: ${outcome.failure}`); continue; }
        const executionWarnings = outcome.warning ? [outcome.warning] : []; summary.executionWarnings.push(...executionWarnings.map((warning) => `${route} sample ${sampleIndex}: ${warning}`));
        samples.push({ sampleIndex, reportPath, executionExitCode: exitCode, executionWarnings, scores: Object.fromEntries(['performance', 'accessibility', 'best-practices', 'seo'].map((category) => [category, score(result, category)])), lab: { lcp: numeric(result, 'largest-contentful-paint'), cls: numeric(result, 'cumulative-layout-shift'), tbt: numeric(result, 'total-blocking-time'), inp: numeric(result, 'interaction-to-next-paint') } });
      }
      if (samples.length !== sampleCount) routeFailures.push(`Expected ${sampleCount} complete samples but retained ${samples.length}.`);
      const medianResult = samples.length === sampleCount ? aggregateLighthouseSamples(samples) : undefined;
      if (medianResult) for (const [category, budget] of Object.entries(BUDGETS)) {
        const value = medianResult.scores[category] ?? medianResult.lab[category];
        if (value !== null && value !== undefined && value < budget && !['lcp', 'cls', 'tbt'].includes(category)) routeFailures.push(`median ${category} ${value} is below ${budget}`);
        if (['lcp', 'cls', 'tbt'].includes(category) && (value === null || value > budget)) routeFailures.push(`median lab ${category} ${value ?? 'unavailable'} exceeds or misses ${budget}`);
      }
      summary.routes.push({ route, sampleCount, samples, median: medianResult, failures: routeFailures, warnings: samples.flatMap((sample) => sample.executionWarnings), reportPaths: samples.map((sample) => sample.reportPath) });
      summary.failures.push(...routeFailures.map((failure) => `${route}: ${failure}`));
    }
  } catch (error) { summary.failures.push(error.message); } finally {
    try { await stopPreview(); } catch (error) { summary.executionWarnings.push(`Preview cleanup failed: ${error.message}`); }
    try { await rm(PROFILE_DIR, { recursive: true, force: true, maxRetries: 4, retryDelay: 250 }); } catch (error) { summary.executionWarnings.push(`Lighthouse temporary cleanup failed: ${error.message}`); }
    await mkdir(OUTPUT_DIR, { recursive: true }); const summaryPath = join(OUTPUT_DIR, 'summary.json'); await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`Lighthouse mobile summary: ${summaryPath}`); console.log(`Lighthouse mobile result: ${summary.routes.length}/${ROUTES.length} routes, ${summary.sampleCount} samples each, ${summary.failures.length} failure(s), ${summary.executionWarnings.length} execution warning(s)`); if (summary.failures.length) process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
