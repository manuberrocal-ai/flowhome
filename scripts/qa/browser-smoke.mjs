import { spawn } from 'node:child_process';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import ts from 'typescript';

const PROJECT_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PREVIEW_HOST = '127.0.0.1';
const PREVIEW_IDENTITY = 'FlowHome';
let BASE_URL = '';
const OUTPUT_DIR = resolve(process.env.BROWSER_QA_OUTPUT || join(tmpdir(), `flowhome-browser-qa-${new Date().toISOString().replace(/[:.]/g, '-')}`));
const PROFILE_DIR = join(tmpdir(), `flowhome-brave-cdp-${process.pid}-${Date.now()}`);
const REPORT_PATH = join(OUTPUT_DIR, 'report.json');
const VIEWPORT_HEIGHT = 900;
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);
const CASES = [
  ...[320, 375, 768, 1024, 1440].map((width) => ({ name: `home-${width}`, path: '/', width })),
  ...[320, 1440].map((width) => ({ name: `quiz-${width}`, path: '/quiz/', width })),
  ...[320, 1440].map((width) => ({ name: `preferences-${width}`, path: '/preferences/', width })),
  ...[375, 1024].map((width) => ({ name: `compare-${width}`, path: '/compare/amazon-smart-thermostat-vs-ecobee-smart-thermostat-premium/', width })),
  ...[375, 1440].map((width) => ({ name: `product-${width}`, path: '/product/amazon-smart-thermostat/', width })),
  { name: 'cart-375', path: '/cart/', width: 375 },
  { name: 'home-saved-375', path: '/', width: 375, setup: 'save-and-scroll-end' },
  { name: 'contract-anonymous-save', path: '/', width: 375, setup: 'anonymous-save' },
  { name: 'contract-amazon-cta', path: '/product/amazon-smart-thermostat/', width: 375, setup: 'amazon-cta' },
  { name: 'contract-consent-events', path: '/product/amazon-smart-thermostat/', width: 375, setup: 'consent-events' },
  { name: 'contract-home-experiment-inactive', path: '/', width: 375, setup: 'home-experiment-inactive' },
];

let previewProcess;
let previewReservation;
let braveProcess;
let browserClient;
let pageClient;
let targetId;
let profileCreated = false;
let createdPreview = false;
let experimentHarnessServer;
let experimentHarnessUrl = '';
let activeDiagnostics = [];
let externalAttempts = [];
const PASSIVE_EXTERNAL_RESOURCE_TYPES = new Set(['Image', 'Stylesheet', 'Font', 'Media']);
const HTTP_CHECKS = [
  { path: '/', expectedStatus: 200 },
  { path: '/robots.txt', expectedStatus: 200 },
  { path: '/sitemap-index.xml', expectedStatus: 200 },
  { path: '/__flowhome-block4-missing__/', expectedStatus: 404 },
];
const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  outputDir: OUTPUT_DIR,
  cases: [],
  httpChecks: [],
  setupErrors: [],
  cleanupErrors: [],
};

class CdpClient {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolvePromise, rejectPromise) => {
      const timeout = setTimeout(() => rejectPromise(new Error(`Timed out connecting to CDP: ${this.url}`)), 10000);
      this.socket.addEventListener('open', () => {
        clearTimeout(timeout);
        resolvePromise();
      }, { once: true });
      this.socket.addEventListener('error', () => {
        clearTimeout(timeout);
        rejectPromise(new Error(`Unable to connect to CDP: ${this.url}`));
      }, { once: true });
    });
    this.socket.addEventListener('message', (event) => this.handleMessage(event.data));
    this.socket.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('CDP connection closed'));
      this.pending.clear();
    });
  }

  handleMessage(data) {
    const message = JSON.parse(data);
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${message.error.message} (${message.error.code})`));
      else pending.resolve(message.result);
      return;
    }
    for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolvePromise, rejectPromise) => {
      this.pending.set(id, { resolve: resolvePromise, reject: rejectPromise });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.socket && this.socket.readyState < WebSocket.CLOSING) this.socket.close();
  }
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function truncate(value, length = 500) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, length);
}

function isLocalUrl(value) {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

function uniqueExternalAttempts(attempts) {
  const unique = new Map();
  for (const attempt of attempts) unique.set(`${attempt.resourceType}\u0000${attempt.url}`, attempt);
  return [...unique.values()];
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url, timeout = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { signal: controller.signal, redirect: 'manual' });
  } finally {
    clearTimeout(timer);
  }
}

async function reserveLoopbackPort() {
  const reservation = createServer();
  await new Promise((resolvePromise, rejectPromise) => {
    reservation.once('error', rejectPromise);
    reservation.listen(0, PREVIEW_HOST, resolvePromise);
  });
  const address = reservation.address();
  if (!address || typeof address === 'string') {
    await new Promise((resolvePromise) => reservation.close(resolvePromise));
    throw new Error('Could not reserve a loopback port for the preview server');
  }
  return { server: reservation, port: address.port };
}

async function closeServer(server) {
  if (!server?.listening) return;
  await new Promise((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()));
}

async function runHttpChecks() {
  for (const check of HTTP_CHECKS) {
    const url = new URL(check.path, `${BASE_URL}/`).href;
    try {
      const response = await fetchWithTimeout(url);
      const result = { path: check.path, url, expectedStatus: check.expectedStatus, actualStatus: response.status, status: response.status === check.expectedStatus ? 'PASS' : 'FAIL' };
      report.httpChecks.push(result);
      if (result.status === 'FAIL') throw new Error(`HTTP status mismatch for ${check.path}: expected ${check.expectedStatus}, received ${response.status}`);
    } catch (error) {
      if (!report.httpChecks.some((result) => result.path === check.path)) report.httpChecks.push({ path: check.path, url, expectedStatus: check.expectedStatus, actualStatus: null, status: 'FAIL', error: truncate(error.message || error) });
      throw error;
    }
  }
}

function spawnLogged(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  child.stdout?.on('data', () => {});
  child.stderr?.on('data', () => {});
  child.once('error', (error) => { child.spawnError = error; });
  return child;
}

async function startExperimentHarness() {
  const source = await readFile(join(PROJECT_ROOT, 'src', 'lib', 'experiments.ts'), 'utf8');
  const harnessSource = source.replace(
    "import { hasAnalyticsConsent } from './consent';\nimport { getAnalyticsClientId, queueEvent } from './analytics';",
    "const hasAnalyticsConsent = () => Boolean(window.__flowhomeExperimentQa?.consent); const getAnalyticsClientId = () => window.__flowhomeExperimentQa?.clientId; const queueEvent = (...args) => window.__flowhomeExperimentQa?.queue(...args) ?? { status: 'not_queued' };",
  );
  const moduleSource = ts.transpileModule(harnessSource, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  const page = `<!doctype html><html data-market="US"><body data-page-type="home" data-funnel-experiment-v1="on" data-home-primary-cta-v1="on"><a href="/quiz/" data-fh-home-primary-cta>Find my setup</a><script type="module">
    const parameters = new URLSearchParams(location.search);
    const qa = { consent: parameters.get('consent') !== 'off', clientId: 'browser-qa-client', calls: [], queue(name, payload) { this.calls.push([name, payload]); return { status: 'queued', eventId: 'browser-qa-event' }; } };
    window.__flowhomeExperimentQa = qa;
    const experiments = await import('/experiments.js');
    const primary = { ...experiments.HOME_PRIMARY_CTA_EXPERIMENT, state: 'active' };
    const excluded = { ...primary, id: 'home_secondary_cta_v1' };
    experiments.setExperimentRuntimeEnabled(true);
    qa.experiments = experiments;
    qa.rollback = experiments.setupExperiments({ registry: [excluded, primary], queue: qa.queue.bind(qa) });
    qa.snapshot = () => { const cta = document.querySelector('[data-fh-home-primary-cta]'); let exposureCount = 0; try { exposureCount = JSON.parse(sessionStorage.getItem(experiments.EXPERIMENT_STORAGE_KEY) || '[]').length; } catch {} return { text: cta?.textContent || '', id: cta?.getAttribute('data-experiment-id') || null, variant: cta?.getAttribute('data-experiment-variant') || null, queueState: cta?.getAttribute('data-experiment-queue-state') || null, calls: qa.calls.length, callIds: qa.calls.map(([, payload]) => payload.experiment_id), exposureCount }; };
  </script></body></html>`;
  experimentHarnessServer = createServer((request, response) => {
    const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    if (path === '/experiments.js') {
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' });
      response.end(moduleSource);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    response.end(page);
  });
  await new Promise((resolvePromise, rejectPromise) => {
    experimentHarnessServer.once('error', rejectPromise);
    experimentHarnessServer.listen(0, '127.0.0.1', () => resolvePromise());
  });
  const address = experimentHarnessServer.address();
  if (!address || typeof address === 'string') throw new Error('Local experiment harness did not expose a TCP port');
  experimentHarnessUrl = `http://127.0.0.1:${address.port}/`;
}

async function startPreview() {
  const reservation = await reserveLoopbackPort();
  previewReservation = reservation.server;
  BASE_URL = `http://${PREVIEW_HOST}:${reservation.port}`;
  report.baseUrl = BASE_URL;
  await closeServer(previewReservation);
  previewReservation = undefined;
  if (process.platform === 'win32') {
    previewProcess = spawnLogged(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run preview -- --host ${PREVIEW_HOST} --port ${reservation.port}`], { cwd: PROJECT_ROOT });
  } else {
    previewProcess = spawnLogged('npm', ['run', 'preview', '--', '--host', PREVIEW_HOST, '--port', String(reservation.port)], { cwd: PROJECT_ROOT });
  }
  createdPreview = true;
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (previewProcess.spawnError) throw previewProcess.spawnError;
    if (previewProcess.exitCode !== null) throw new Error(`Preview server exited early with code ${previewProcess.exitCode}`);
    try {
      const response = await fetchWithTimeout(BASE_URL);
      if (response.ok) {
        const body = await response.text();
        if (!body.includes(PREVIEW_IDENTITY)) throw new Error(`Preview identity verification failed at ${BASE_URL}`);
        return;
      }
    } catch (error) {
      if (error.message?.startsWith('Preview identity verification failed')) throw error;
    }
    await sleep(250);
  }
  throw new Error(`Owned preview server did not become healthy at ${BASE_URL} within 30 seconds`);
}

async function findBrave() {
  if (process.env.BRAVE_PATH) {
    if (await exists(process.env.BRAVE_PATH)) return process.env.BRAVE_PATH;
    throw new Error(`BRAVE_PATH does not exist: ${process.env.BRAVE_PATH}`);
  }
  const candidates = process.platform === 'win32'
    ? [
        join(process.env.PROGRAMFILES || 'C:\\Program Files', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
        join(process.env.LOCALAPPDATA || '', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      ]
    : ['/usr/bin/brave-browser', '/usr/bin/brave', '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'];
  for (const candidate of candidates) if (await exists(candidate)) return candidate;
  throw new Error('Brave was not found. Set BRAVE_PATH to the Brave executable.');
}

async function readDevToolsPort() {
  const file = join(PROFILE_DIR, 'DevToolsActivePort');
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const [port] = (await readFile(file, 'utf8')).trim().split(/\r?\n/);
      if (port && /^\d+$/.test(port)) return Number(port);
    } catch {
      // The DevToolsActivePort file may not exist until Brave finishes startup.
    }
    if (braveProcess?.spawnError) throw braveProcess.spawnError;
    if (braveProcess?.exitCode !== null && braveProcess?.exitCode !== undefined) {
      throw new Error(`Brave exited early with code ${braveProcess.exitCode}`);
    }
    await sleep(100);
  }
  throw new Error('Brave did not expose its CDP port through DevToolsActivePort.');
}

async function getJson(url) {
  const response = await fetchWithTimeout(url, 3000);
  if (!response.ok) throw new Error(`CDP endpoint returned ${response.status}: ${url}`);
  return response.json();
}

async function launchBrave() {
  const bravePath = await findBrave();
  await mkdir(PROFILE_DIR, { recursive: true });
  profileCreated = true;
  braveProcess = spawnLogged(bravePath, [
    '--headless=new',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-features=Signin,Sync',
    'about:blank',
  ], { cwd: PROJECT_ROOT });
  const port = await readDevToolsPort();
  const version = await getJson(`http://127.0.0.1:${port}/json/version`);
  browserClient = new CdpClient(version.webSocketDebuggerUrl);
  await browserClient.connect();
  ({ targetId } = await browserClient.send('Target.createTarget', { url: 'about:blank' }));
  const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
  const target = targets.find((item) => item.id === targetId);
  if (!target?.webSocketDebuggerUrl) throw new Error('Could not obtain the CDP target for the isolated Brave page.');
  pageClient = new CdpClient(target.webSocketDebuggerUrl);
  await pageClient.connect();
  await Promise.all([
    pageClient.send('Page.enable'),
    pageClient.send('Runtime.enable'),
    pageClient.send('Log.enable'),
    pageClient.send('Network.enable'),
    pageClient.send('Emulation.setFocusEmulationEnabled', { enabled: true }),
  ]);
  pageClient.on('Runtime.exceptionThrown', (params) => activeDiagnostics.push({ type: 'runtime', message: truncate(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text), url: params.exceptionDetails?.url || '' }));
  pageClient.on('Runtime.consoleAPICalled', (params) => {
    if (['error', 'assert'].includes(params.type)) activeDiagnostics.push({ type: 'console', message: truncate(params.args?.map((arg) => arg.value ?? arg.description).join(' ')), url: params.stackTrace?.callFrames?.[0]?.url || '' });
  });
  pageClient.on('Log.entryAdded', (params) => {
    if (params.entry?.level === 'error') activeDiagnostics.push({ type: 'log', message: truncate(params.entry.text), url: params.entry.url || '' });
  });
  pageClient.on('Network.requestWillBeSent', (params) => {
    const url = params.request?.url || '';
    if (!isLocalUrl(url)) externalAttempts.push({ url, resourceType: params.type || 'Unknown' });
  });
  // This remains active for every case: external HTTPS requests cannot complete.
  await pageClient.send('Network.setBlockedURLs', { urls: ['https://*/*'] });
}

async function evaluate(expression) {
  const result = await pageClient.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result.value;
}

async function waitForPageReady() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if (await evaluate('document.readyState') === 'complete') return;
    } catch {
      // Runtime evaluation can fail briefly while a navigation commits.
    }
    await sleep(100);
  }
  throw new Error('Page did not reach document.readyState="complete" within 15 seconds');
}

const INSPECTION_EXPRESSION = `(() => {
  const viewportWidth = document.documentElement.clientWidth;
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  };
  const locator = (element) => {
    const parts = [];
    for (let current = element; current && current.nodeType === 1 && parts.length < 5; current = current.parentElement) {
      const id = current.id ? '#' + CSS.escape(current.id) : '';
      const classes = [...current.classList].slice(0, 2).map((name) => '.' + CSS.escape(name)).join('');
      parts.unshift(current.tagName.toLowerCase() + id + classes);
    }
    return parts.join(' > ');
  };
  const clippedByAncestor = (element) => {
    for (let parent = element.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      if (!['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX)) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.left >= -1 && rect.right <= viewportWidth + 1) return true;
    }
    return false;
  };
  const jsonLdErrors = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script, index) => {
    try { JSON.parse(script.textContent || ''); return []; }
    catch (error) { return [{ index, message: String(error.message) }]; }
  });
  const smallControls = [...document.querySelectorAll('button, [role="button"]')]
    .filter(visible)
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width < 44 || rect.height < 44)
    .map(({ element, rect }) => ({ selector: locator(element), width: Math.round(rect.width * 10) / 10, height: Math.round(rect.height * 10) / 10 }));
  const overflow = [...document.querySelectorAll('body *')]
    .filter(visible)
    .filter((element) => !element.matches('.google-translate-hidden'))
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(({ element, rect }) => (rect.left < -1 || rect.right > viewportWidth + 1) && !clippedByAncestor(element))
    .map(({ element, rect }) => ({ selector: locator(element), left: Math.round(rect.left * 10) / 10, right: Math.round(rect.right * 10) / 10, viewportWidth }));
  const dockElement = document.querySelector('[data-flow-cart-dock]');
  const dockRect = dockElement?.getBoundingClientRect();
  const dockVisible = Boolean(dockElement && visible(dockElement));
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const protectedRegions = ['#language-options', 'footer'].map((selector) => document.querySelector(selector)).filter(Boolean);
  const dockOverlaps = dockVisible ? protectedRegions.filter(visible).filter((element) => intersects(dockRect, element.getBoundingClientRect())).map(locator) : [];
  const dock = {
    visible: dockVisible,
    height: dockVisible ? Math.round(dockRect.height * 10) / 10 : 0,
    bodyPaddingBottom: Number.parseFloat(getComputedStyle(document.body).paddingBottom) || 0,
    overlaps: dockOverlaps,
  };
  return { title: document.title, readyState: document.readyState, jsonLdErrors, smallControls, overflow, dock, documentScrollWidth: document.documentElement.scrollWidth, viewportWidth };
})()`;

async function runCase(testCase) {
  activeDiagnostics = [];
  externalAttempts = [];
  const url = new URL(testCase.path, `${BASE_URL}/`).href;
  const result = { ...testCase, url, startedAt: new Date().toISOString(), failures: [] };
  try {
    await pageClient.send('Emulation.setDeviceMetricsOverride', {
      width: testCase.width,
      height: VIEWPORT_HEIGHT,
      deviceScaleFactor: 1,
      mobile: testCase.width < 768,
      screenWidth: testCase.width,
      screenHeight: VIEWPORT_HEIGHT,
      positionX: 0,
      positionY: 0,
    });
    const navigation = await pageClient.send('Page.navigate', { url });
    if (navigation.errorText) result.failures.push(`Navigation failed: ${navigation.errorText}`);
    await waitForPageReady();
    await evaluate('document.fonts?.ready ? document.fonts.ready.then(() => true) : true');
    await sleep(250);
    if (testCase.setup === 'save-and-scroll-end') {
      const saved = await evaluate(`(() => { const button = document.querySelector('[data-flow-cart-add]'); if (!button) return false; button.click(); return true; })()`);
      if (!saved) result.failures.push('Could not activate a shortlist control for dock verification');
      await sleep(150);
      await evaluate(`new Promise((resolve) => { window.scrollTo(0, document.documentElement.scrollHeight); requestAnimationFrame(() => requestAnimationFrame(resolve)); })`);
    }
    if (testCase.setup === 'anonymous-save') {
      await evaluate(`localStorage.removeItem('flowhome-amazon-list')`);
      await pageClient.send('Page.reload', { ignoreCache: true });
      await waitForPageReady();
      await sleep(150);
      const state = await evaluate(`(() => { const button = document.querySelector('[data-flow-cart-add]'); if (!button) return { missing: true }; button.click(); let payload = null; try { payload = JSON.parse(localStorage.getItem('flowhome-amazon-list') || 'null'); } catch {} const activeEntry = Boolean(payload?.version === 2 && Array.isArray(payload.entries) && payload.entries.some((entry) => Number(entry?.quantity) > 0)); const pressed = button.getAttribute('aria-pressed') === 'true'; const countActive = [...document.querySelectorAll('[data-flow-cart-item-count], [data-cart-page-count]')].some((element) => Number(element.textContent || 0) > 0); const dock = document.querySelector('[data-flow-cart-dock]'); const dockActive = Boolean(dock && !dock.hidden && getComputedStyle(dock).display !== 'none'); return { missing: false, activeEntry, savedIndicator: pressed || countActive || dockActive, authPrompt: Boolean(document.querySelector('[data-fh-require-auth], [role="dialog"]')) }; })()`);
      if (state.missing || !state.activeEntry) result.failures.push('Anonymous save did not create an active persisted cart entry');
      if (!state.savedIndicator) result.failures.push('Anonymous save did not update a saved UI indicator');
      if (state.authPrompt) result.failures.push('Anonymous save opened an auth prompt');
    }
    if (testCase.setup === 'amazon-cta') {
      const contract = await evaluate(`(() => { const anchor = document.querySelector('[data-fh-amazon-cta]'); if (!anchor) return { missing: true }; let appPrevented = false; let href = ''; let target = ''; let rel = ''; const guard = (event) => { const clicked = event.target instanceof Element ? event.target.closest('[data-fh-amazon-cta]') : null; if (!clicked) return; appPrevented = event.defaultPrevented; href = clicked.href; target = clicked.target; rel = clicked.rel; event.preventDefault(); }; document.addEventListener('click', guard); try { anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); } finally { document.removeEventListener('click', guard); } let validUrl = false; try { const url = new URL(href); const parameters = [...url.searchParams.entries()]; const segments = url.pathname.split('/').filter(Boolean); validUrl = url.protocol === 'https:' && url.hostname === 'www.amazon.com' && !url.username && !url.password && !url.port && !url.hash && segments.length === 2 && segments[0] === 'dp' && /^[A-Z0-9]{10}$/.test(segments[1]) && parameters.length === 1 && parameters[0][0] === 'tag' && parameters[0][1] === 'flowhome-20'; } catch {} return { href, target, rel, appPrevented, validUrl }; })()`);
      if (contract.missing || !contract.validUrl) result.failures.push('Amazon CTA is not an exact direct tagged Amazon product URL');
      if (contract.target !== '_blank' || contract.rel !== 'nofollow sponsored noopener noreferrer') result.failures.push('Amazon CTA target or rel contract changed');
      if (contract.appPrevented) result.failures.push('Application prevented the Amazon CTA default action');
    }
    if (testCase.setup === 'consent-events') {
      const contract = await evaluate(`(async () => { const anchor = document.querySelector('[data-fh-amazon-cta]'); if (!anchor) return { missing: true }; let appPrevented = false; const guard = (event) => { const clicked = event.target instanceof Element ? event.target.closest('[data-fh-amazon-cta]') : null; if (!clicked) return; appPrevented ||= event.defaultPrevented; event.preventDefault(); }; const click = () => anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); const set = async (choice, waitForMacrotask = false) => { if (choice) localStorage.setItem('flowhome-consent', JSON.stringify({ version: 1, choice })); else localStorage.removeItem('flowhome-consent'); window.dataLayer = []; click(); if (waitForMacrotask) await new Promise((resolve) => setTimeout(resolve, 0)); return window.dataLayer.filter((entry) => entry.event === 'affiliate_click'); }; document.addEventListener('click', guard); try { const accepted = await set('accepted', true); const safe = accepted.length === 1 && accepted[0].consent_state === 'accepted' && Boolean(accepted[0].event_id) && accepted[0].pathname === location.pathname && !JSON.stringify(accepted[0]).includes('?'); return { accepted: accepted.length, rejected: (await set('rejected')).length, unset: (await set(null)).length, safe, appPrevented }; } finally { document.removeEventListener('click', guard); } })()`);
      if (contract.missing || contract.accepted !== 1 || contract.rejected !== 0 || contract.unset !== 0 || !contract.safe || contract.appPrevented) result.failures.push(`Consent event contract failed: ${JSON.stringify(contract)}`);
    }
    if (testCase.setup === 'home-experiment-inactive') {
      const contract = await evaluate(`(() => { window.dataLayer = []; const cta = document.querySelector('[data-fh-home-primary-cta]'); const before = cta?.textContent?.trim(); return { flag: document.body.dataset.homePrimaryCtaV1, funnelFlag: document.body.dataset.funnelExperimentV1, before, exposure: window.dataLayer.filter((entry) => entry.event === 'experiment_exposure').length, variant: cta?.getAttribute('data-experiment-variant') || null }; })()`);
      if (contract.flag !== 'off' || contract.funnelFlag !== 'off' || contract.before !== 'Find my setup' || contract.exposure !== 0 || contract.variant) result.failures.push(`Inactive default/build contract failed: ${JSON.stringify(contract)}`);
    }
    result.inspection = await evaluate(INSPECTION_EXPRESSION);
    result.diagnostics = activeDiagnostics;
    if (activeDiagnostics.length) result.failures.push(`${activeDiagnostics.length} console/runtime/log error(s)`);
    if (result.inspection.jsonLdErrors.length) result.failures.push(`${result.inspection.jsonLdErrors.length} invalid JSON-LD block(s)`);
    if (result.inspection.smallControls.length) result.failures.push(`${result.inspection.smallControls.length} control(s) smaller than 44px`);
    if (result.inspection.overflow.length) result.failures.push(`${result.inspection.overflow.length} uncontained horizontal overflow element(s)`);
    if (testCase.setup === 'save-and-scroll-end') {
      if (!result.inspection.dock.visible) result.failures.push('Shortlist dock did not become visible');
      if (result.inspection.dock.overlaps.length) result.failures.push(`Shortlist dock overlaps: ${result.inspection.dock.overlaps.join(', ')}`);
      if (result.inspection.dock.bodyPaddingBottom < result.inspection.dock.height + 16) result.failures.push('Document reservation is smaller than the visible dock plus safe gap');
    }
    const screenshot = await pageClient.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    result.screenshot = join(OUTPUT_DIR, `${testCase.name}.png`);
    await writeFile(result.screenshot, Buffer.from(screenshot.data, 'base64'));
  } catch (error) {
    result.failures.push(truncate(error.message || error));
    result.diagnostics = activeDiagnostics;
  }
  const uniqueAttempts = uniqueExternalAttempts(externalAttempts);
  result.blockedExternalAssets = uniqueAttempts.filter((attempt) => PASSIVE_EXTERNAL_RESOURCE_TYPES.has(attempt.resourceType));
  result.forbiddenExternalRequests = uniqueAttempts.filter((attempt) => !PASSIVE_EXTERNAL_RESOURCE_TYPES.has(attempt.resourceType));
  if (result.forbiddenExternalRequests.length) {
    result.failures.push(`Forbidden external network request(s): ${result.forbiddenExternalRequests.map((attempt) => `${attempt.resourceType} ${attempt.url}`).join(', ')}`);
  }
  result.status = result.failures.length ? 'FAIL' : 'PASS';
  result.finishedAt = new Date().toISOString();
  report.cases.push(result);
}

async function runExperimentHarnessCase() {
  activeDiagnostics = [];
  externalAttempts = [];
  const result = { name: 'contract-local-experiment-active-path', url: experimentHarnessUrl, startedAt: new Date().toISOString(), failures: [] };
  const navigate = async (query = '') => {
    const navigation = await pageClient.send('Page.navigate', { url: `${experimentHarnessUrl}${query}` });
    if (navigation.errorText) throw new Error(`Harness navigation failed: ${navigation.errorText}`);
    await waitForPageReady();
    await sleep(100);
    return evaluate('window.__flowhomeExperimentQa?.snapshot?.()');
  };
  try {
    const first = await navigate();
    if (first.id !== 'home_primary_cta_v1' || !first.variant || first.queueState !== 'queued' || first.calls !== 1 || first.exposureCount !== 1 || first.callIds.length !== 1 || first.callIds[0] !== 'home_primary_cta_v1') result.failures.push(`Active assignment, queued exposure, or mutual exclusion failed: ${JSON.stringify(first)}`);

    const killed = await evaluate(`(() => { const qa = window.__flowhomeExperimentQa; window.__flowhomeExperimentsRuntime?.setEnabled(false); return qa.snapshot(); })()`);
    if (killed.id || killed.variant || killed.queueState || killed.text !== 'Find my setup') result.failures.push(`Runtime kill switch did not restore the control: ${JSON.stringify(killed)}`);

    const restored = await evaluate(`(() => { const qa = window.__flowhomeExperimentQa; window.__flowhomeExperimentsRuntime?.setEnabled(true); return qa.snapshot(); })()`);
    if (restored.id !== first.id || restored.variant !== first.variant || restored.calls !== 1 || restored.exposureCount !== 1) result.failures.push(`Runtime restoration was not deterministic or requeued exposure: ${JSON.stringify(restored)}`);

    const directNavigation = await navigate();
    if (directNavigation.id !== first.id || directNavigation.variant !== first.variant || directNavigation.calls !== 0 || directNavigation.exposureCount !== 1) result.failures.push(`Direct navigation changed assignment or requeued exposure: ${JSON.stringify(directNavigation)}`);

    const noConsent = await navigate('?consent=off');
    if (noConsent.id || noConsent.variant || noConsent.queueState || noConsent.calls !== 0) result.failures.push(`Consent gate allowed an assignment or exposure: ${JSON.stringify(noConsent)}`);
  } catch (error) {
    result.failures.push(truncate(error.message || error));
  }
  const uniqueAttempts = uniqueExternalAttempts(externalAttempts);
  result.blockedExternalAssets = uniqueAttempts.filter((attempt) => PASSIVE_EXTERNAL_RESOURCE_TYPES.has(attempt.resourceType));
  result.forbiddenExternalRequests = uniqueAttempts.filter((attempt) => !PASSIVE_EXTERNAL_RESOURCE_TYPES.has(attempt.resourceType));
  if (result.forbiddenExternalRequests.length) result.failures.push(`Forbidden external network request(s): ${result.forbiddenExternalRequests.map((attempt) => `${attempt.resourceType} ${attempt.url}`).join(', ')}`);
  result.diagnostics = activeDiagnostics;
  if (activeDiagnostics.length) result.failures.push(`${activeDiagnostics.length} console/runtime/log error(s)`);
  result.status = result.failures.length ? 'FAIL' : 'PASS';
  result.finishedAt = new Date().toISOString();
  report.cases.push(result);
}

async function waitForExit(child, timeout = 10000) {
  if (!child?.pid || (child.exitCode !== null && child.exitCode !== undefined)) return;
  await new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(`Process ${child.pid} did not exit within ${timeout}ms`)), timeout);
    child.once('exit', () => {
      clearTimeout(timer);
      resolvePromise();
    });
  });
}

async function terminate(child) {
  if (!child?.pid || (child.exitCode !== null && child.exitCode !== undefined)) return;
  if (process.platform === 'win32') {
    await new Promise((resolvePromise) => {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
      killer.once('close', resolvePromise);
      killer.once('error', resolvePromise);
    });
  } else {
    child.kill('SIGTERM');
  }
  await waitForExit(child);
}

async function removeProfileWithRetry() {
  const attempts = process.platform === 'win32' ? 5 : 1;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await rm(PROFILE_DIR, { recursive: true, force: true });
      return;
    } catch (error) {
      const retryable = ['EBUSY', 'ENOTEMPTY', 'EPERM'].includes(error.code);
      if (!retryable || attempt === attempts) throw error;
      await sleep(100 * (2 ** (attempt - 1)));
    }
  }
}

async function cleanup() {
  try { if (browserClient && targetId) await browserClient.send('Target.closeTarget', { targetId }); } catch (error) { report.cleanupErrors.push(`Target cleanup: ${truncate(error.message)}`); }
  try { pageClient?.close(); browserClient?.close(); } catch (error) { report.cleanupErrors.push(`CDP cleanup: ${truncate(error.message)}`); }
  try { await terminate(braveProcess); } catch (error) { report.cleanupErrors.push(`Brave cleanup: ${truncate(error.message)}`); }
  try { if (createdPreview) await terminate(previewProcess); } catch (error) { report.cleanupErrors.push(`Preview cleanup: ${truncate(error.message)}`); }
  try { if (profileCreated) await removeProfileWithRetry(); } catch (error) { report.cleanupErrors.push(`Profile cleanup: ${truncate(error.message)}`); }
  try { await closeServer(previewReservation); } catch (error) { report.cleanupErrors.push(`Preview reservation cleanup: ${truncate(error.message)}`); }
  try { await closeServer(experimentHarnessServer); } catch (error) { report.cleanupErrors.push(`Experiment harness cleanup: ${truncate(error.message)}`); }
}

async function main() {
  if (typeof WebSocket !== 'function') throw new Error('Node.js with the global WebSocket API is required. Use Node.js 22 or newer.');
  await mkdir(OUTPUT_DIR, { recursive: true });
  await startPreview();
  await runHttpChecks();
  await launchBrave();
  await startExperimentHarness();
  for (const testCase of CASES) await runCase(testCase);
  await runExperimentHarnessCase();
}

try {
  await main();
} catch (error) {
  report.setupErrors.push(truncate(error.message || error));
} finally {
  await cleanup();
  report.finishedAt = new Date().toISOString();
  report.summary = {
    total: report.cases.length,
    passed: report.cases.filter((item) => item.status === 'PASS').length,
    failed: report.cases.filter((item) => item.status === 'FAIL').length,
    setupErrors: report.setupErrors.length,
    cleanupErrors: report.cleanupErrors.length,
  };
  try { await mkdir(OUTPUT_DIR, { recursive: true }); await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`); } catch (error) { console.error(`Could not write browser QA report: ${error.message}`); }
  console.log(`Browser QA report: ${REPORT_PATH}`);
  console.log(`Browser QA screenshots: ${OUTPUT_DIR}`);
  console.log(`Browser QA summary: ${report.summary.passed}/${report.summary.total} PASS, ${report.summary.failed} FAIL, ${report.summary.setupErrors} setup error(s)`);
  if (report.summary.passed !== report.summary.total || report.summary.failed || report.summary.setupErrors || report.summary.cleanupErrors) process.exitCode = 1;
}
