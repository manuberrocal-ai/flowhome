import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8');
const executable = ts.transpileModule(source.replace('./analytics-fields.js', new URL('../src/lib/analytics-fields.js', import.meta.url).href).replace(
  "import { hasAnalyticsConsent, shouldReloadOptionalAnalytics } from './consent';",
  'const hasAnalyticsConsent = () => Boolean(globalThis.__analyticsConsent); const shouldReloadOptionalAnalytics = (loaded, pending = false) => loaded && !pending;',
), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const analytics = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}`);

function createStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

function installBrowser({ consent = true, search = '?utm_source=Newsletter&utm_campaign=spring' } = {}) {
  const sessionStorage = createStorage();
  const listeners = [];
  const scripts = [];
  globalThis.__analyticsConsent = consent;
  globalThis.window = {
    innerWidth: 375,
    location: { pathname: '/quiz/', search, reload() {} },
    sessionStorage,
    dataLayer: [],
    addEventListener: (name, listener) => listeners.push({ name, listener }),
  };
  globalThis.document = {
    body: { dataset: { market: 'us', pageType: 'quiz' } },
    documentElement: { clientWidth: 375 },
    addEventListener: (name, listener) => listeners.push({ name, listener }),
    querySelector: (selector) => scripts.find((script) => selector.includes(`data-service="${script.dataset.service}"`)) ?? null,
    querySelectorAll: () => scripts,
    head: { appendChild(script) { scripts.push(script); } },
    createElement: () => ({ dataset: {}, remove() {} }),
  };
  return { sessionStorage, listeners, scripts, dataLayer: globalThis.window.dataLayer };
}

test('analytics contract gates consent, rejects unsafe input, preserves first touch, and deduplicates', () => {
  const browser = installBrowser();
  const firstTouch = analytics.captureAttribution();
  assert.deepEqual(firstTouch, { utm_source: 'newsletter', utm_campaign: 'spring' });
  globalThis.window.location.search = '?utm_source=replaced&utm_term=ignored';
  assert.deepEqual(analytics.captureAttribution(), firstTouch, 'first touch survives later query changes');

  assert.equal(analytics.trackEvent('unknown_event', {}), false);
  assert.doesNotThrow(() => analytics.trackEvent('toString', {}));
  assert.equal(analytics.trackEvent('constructor', {}), false);
  assert.equal(analytics.trackEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: 'thermostat', email: 'a@example.test' }), false);
  for (const value of ['owner@example.test', '+1 (555) 123-4567', 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature', 'sk_live_abcdefghijklmnop']) {
    assert.equal(analytics.sanitizeEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: value }), null, value);
  }
  for (const value of ['ftp://example.test/file', 'file:///tmp/private', 'data:text/plain,private', 'javascript:alert(1)', 'about:blank', 'blob:https://tracker.test/id', 'custom-scheme:payload', '//tracker.test/path', 'www.tracker.test', 'example.com/path', 'example.xyz', 'tracker.internal', 'smart.home', 'example%2Exyz', 'mailto:owner@example.test', 'tel:+15551234567', 'https%3A%2F%2Ftracker.test', 'data%3Atext%2Fplain%2Cprivate']) {
    assert.equal(analytics.sanitizeEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: value }), null, value);
  }
  assert.deepEqual(analytics.sanitizeEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: 'zigbee.3.0', category: 'smart-home' }), { page_type: 'quiz', cta_position: 'quiz_result', product_slug: 'zigbee.3.0', category: 'smart-home' });
  assert.equal(analytics.sanitizeEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', discount: 101 }), null);
  assert.equal(analytics.sanitizeEvent('quiz_complete', { page_type: 'quiz', result_count: -1 }), null);
  assert.equal(analytics.sanitizeEvent('calculator_used', { page_type: 'calculator', estimated_savings: 1_000_001 }), null);
  assert.deepEqual(analytics.sanitizeEvent('experiment_exposure', { page_type: 'home', experiment_id: 'home_primary_cta_v1', variant_id: 'control', assignment_version: 'v1', mutual_exclusion_group: 'home-primary-cta', assignment_bucket: 9999 }), { page_type: 'home', experiment_id: 'home_primary_cta_v1', variant_id: 'control', assignment_version: 'v1', mutual_exclusion_group: 'home-primary-cta', assignment_bucket: 9999 });
  assert.equal(analytics.sanitizeEvent('experiment_exposure', { page_type: 'home', experiment_id: 'home_primary_cta_v1', variant_id: 'control', assignment_version: 'v1', mutual_exclusion_group: 'home-primary-cta', assignment_bucket: 10000 }), null);
  assert.equal(analytics.sanitizeEvent('experiment_exposure', { page_type: 'home', experiment_id: 'home_primary_cta_v1', unexpected: 'field' }), null);
  assert.equal(analytics.trackEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: 'thermostat', dedupe_key: 'click-1' }), true);
  assert.equal(analytics.trackEvent('affiliate_click', { page_type: 'quiz', cta_position: 'quiz_result', product_slug: 'thermostat', dedupe_key: 'click-1' }), false);
  assert.equal(browser.dataLayer.length, 1);
  const event = browser.dataLayer[0];
  assert.equal(event.pathname, '/quiz/');
  assert.equal(event.device_class, 'mobile');
  assert.equal(event.utm_source, 'newsletter');
  assert.ok(event.event_id);
  assert.equal('dedupe_key' in event, false);
  assert.equal(JSON.stringify(event).includes('?'), false, 'raw query strings never reach events');

  assert.equal(analytics.trackEvent('feed_follow', { page_type: 'page', cta_position: 'newsletter_footer', dedupe_key: 'feed-follow' }), true);
  assert.equal(browser.dataLayer.at(-1).event, 'feed_follow');

  delete globalThis.window.dataLayer;
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: 'late-provider' }), false);
  globalThis.window.dataLayer = [];
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: 'late-provider' }), true, 'missing providers do not poison dedupe keys');
  globalThis.window.dataLayer = { push() { throw new Error('provider unavailable'); } };
  assert.doesNotThrow(() => analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: 'retry-provider' }));
  globalThis.window.dataLayer = [];
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: 'retry-provider' }), true, 'failed pushes do not poison dedupe keys');
  globalThis.__analyticsConsent = false;
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz' }), false);
  analytics.clearAnalyticsSession();
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1'), null);
});

test('analytics emits only safe pathnames', () => {
  installBrowser();
  globalThis.window.location.pathname = '/product/amazon-smart-thermostat/';
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: 'safe-path' }), true);
  assert.equal(globalThis.window.dataLayer.at(-1).pathname, '/product/amazon-smart-thermostat/');
  for (const [index, pathname] of ['/product/owner%40example.test/', '/contact/%2B1%20(555)%20123-4567/', '/token/%65%79%4A%68%62%47%63%69%4F%69%4A%49%55%7A%49%31%4E%69%4A%39.eyJzdWIiOiIxIn0.signature'].entries()) {
    globalThis.window.location.pathname = pathname;
    assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz', dedupe_key: `unsafe-path-${index}` }), true);
    assert.equal(globalThis.window.dataLayer.at(-1).pathname, '/redacted');
  }
});

test('successive events explicitly replace optional field values instead of retaining prior product data', () => {
  const browser = installBrowser({ search: '' });
  const model = {};
  globalThis.window.dataLayer = { push: message => { Object.assign(model, message); browser.dataLayer.push(message); } };
  assert.equal(analytics.trackEvent('affiliate_click', { product_slug: 'thermostat', category: 'smart-thermostat', discount: 20, campaign: 'spring' }), true);
  assert.equal(model.discount, 20);
  assert.equal(analytics.trackEvent('affiliate_click', { product_slug: 'smart-plug' }), true);
  assert.equal(model.product_slug, 'smart-plug');
  for (const key of ['category', 'discount', 'campaign']) {
    assert.equal(Object.hasOwn(browser.dataLayer.at(-1), key), true, `${key} explicitly replaces its previous value`);
    assert.equal(model[key], undefined);
  }
  assert.equal(analytics.trackEvent('quiz_start', { page_type: 'quiz' }), true);
  assert.equal(model.product_slug, undefined);
  assert.equal(model.page_type, 'quiz');
  assert.equal('dedupe_key' in model, false);
  assert.doesNotMatch(JSON.stringify(browser.dataLayer.at(-1)), /thermostat|smart-plug|spring|discount/);
});

test('experiment exposure accepts only its exact bounded, non-PII contract and tracks once', () => {
  const browser = installBrowser({ search: '' });
  const exposure = { page_type: 'home', experiment_id: 'home_primary_cta_v1', variant_id: 'control', assignment_version: 'v1', mutual_exclusion_group: 'home-primary-cta', assignment_bucket: 4312, dedupe_key: 'exposure-home_primary_cta_v1-v1-control' };
  assert.deepEqual(analytics.sanitizeEvent('experiment_exposure', exposure), exposure);
  assert.equal(analytics.trackEvent('experiment_exposure', exposure), true);
  assert.equal(browser.dataLayer.filter((event) => event.event === 'experiment_exposure').length, 1);
  assert.equal(analytics.trackEvent('experiment_exposure', exposure), false);
  assert.equal(browser.dataLayer.filter((event) => event.event === 'experiment_exposure').length, 1);
  assert.equal(analytics.sanitizeEvent('experiment_exposure', { ...exposure, assignment_bucket: 10000 }), null);
  assert.equal(analytics.sanitizeEvent('experiment_exposure', { ...exposure, unexpected: 'field' }), null);
  assert.equal(analytics.sanitizeEvent('experiment_exposure', { ...exposure, experiment_id: 'owner@example.test' }), null);
});

test('local event enqueue reports queued without claiming provider delivery', () => {
  installBrowser({ search: '' });
  assert.deepEqual(analytics.queueEvent('quiz_complete', { page_type: 'quiz', goal: 'comfort', ecosystem: 'alexa', budget: 'open', installation: 'plug-and-play', extra: 'open', result_count: 2, dedupe_key: 'quiz-complete-local' }), { status: 'queued', eventId: globalThis.window.dataLayer[0].event_id });
  delete globalThis.window.dataLayer;
  assert.deepEqual(analytics.queueEvent('quiz_complete', { page_type: 'quiz', dedupe_key: 'no-provider' }), { status: 'not_queued' });
});

test('attribution treats sessionStorage as untrusted input', () => {
  const browser = installBrowser({ search: '?utm_source=trusted' });
  browser.sessionStorage.setItem('flowhome-analytics-attribution-v1', JSON.stringify({ utm_source: 'old', pathname: '/leak', consent_state: 'accepted', email: 'owner@example.test' }));
  assert.deepEqual(analytics.captureAttribution(), { utm_source: 'trusted' });
  assert.deepEqual(JSON.parse(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1')), { utm_source: 'trusted' });
  browser.sessionStorage.setItem('flowhome-analytics-attribution-v1', '{not-json');
  assert.deepEqual(analytics.captureAttribution(), { utm_source: 'trusted' });
  assert.deepEqual(JSON.parse(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1')), { utm_source: 'trusted' });
});

test('analytics setup installs consent and CTA delegation once', () => {
  const browser = installBrowser();
  analytics.setupAnalytics();
  analytics.setupAnalytics();
  assert.equal(browser.listeners.filter((entry) => entry.name === 'click').length, 1);
  assert.equal(browser.listeners.filter((entry) => entry.name === 'flowhome:list-added').length, 1);
  assert.equal(browser.listeners.filter((entry) => entry.name === 'flowhome:consent-change').length, 1);
  analytics.setupAnalytics({ gtmId: 'GTM-TEST', ga4Id: 'G-TEST123456' });
  analytics.setupAnalytics({ gtmId: 'GTM-TEST', ga4Id: 'G-TEST123456' });
  assert.equal(globalThis.window.dataLayer.filter((entry) => entry.event === 'gtm.js').length, 1);
  assert.equal(globalThis.window.dataLayer.filter((entry) => entry.event === 'page_view').length, 1);
});

test('real delegated CTAs omit absent discount fields and shortlist tracking requires a confirmed addition', async () => {
  const browser = installBrowser({ search: '' });
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#delegated-cta-fields`);
  isolated.setupAnalytics();
  const click = browser.listeners.find(entry => entry.name === 'click').listener;
  const added = browser.listeners.find(entry => entry.name === 'flowhome:list-added').listener;
  const element = { dataset: { ctaPosition: 'home_tools', fhTrack: 'compare_open' }, hasAttribute: () => false };
  const event = { target: { closest: () => element } };
  click(event);
  assert.equal(browser.dataLayer.at(-1).event, 'compare_open');
  element.dataset = { ctaPosition: 'newsletter_footer', fhTrack: 'feed_follow' };
  click(event);
  assert.equal(browser.dataLayer.at(-1).event, 'feed_follow');
  element.dataset = { ctaPosition: 'product_card_list', fhTrack: 'list_add', productSlug: 'aqara-hub-m2', category: 'Smart Hub' };
  click(event);
  assert.equal(browser.dataLayer.length, 2, 'toggle click does not infer a successful addition');
  added({ detail: { product_slug: 'aqara-hub-m2', category: 'Smart Hub', cta_position: 'product_card_list' } });
  assert.equal(browser.dataLayer.at(-1).event, 'list_add');
  assert.equal(browser.dataLayer.at(-1).product_slug, 'aqara-hub-m2');
  assert.equal(browser.dataLayer.at(-1).discount, undefined);
  assert.equal(browser.dataLayer.length, 3);
  added({ detail: { product_slug: 'owner@example.test' } });
  added({ detail: { product_slug: 'safe-product', email: 'owner@example.test' } });
  globalThis.__analyticsConsent = false;
  added({ detail: { product_slug: 'safe-product' } });
  assert.equal(browser.dataLayer.length, 3, 'unsafe payloads and rejected consent remain suppressed');
  assert.equal(isolated.sanitizeEvent('compare_open', { discount: undefined }), null, 'raw API still rejects unknown keys');
});

test('provider startup is consent-gated and receives safe context before GTM initialization', async () => {
  const browser = installBrowser({ consent: false, search: '?email=private%40example.test#secret' });
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#provider-startup`);
  const config = { gtmId: 'GTM-TEST', ga4Id: 'G-TEST123456' };
  globalThis.document.title = 'private@example.test';
  globalThis.document.referrer = 'https://private.example.test/?secret=private';
  isolated.setupAnalytics(config);
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.dataLayer.length, 0);
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-session-id'), null);
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1'), null);
  assert.equal(globalThis.window['ga-disable-G-TEST123456'], true);
  const consentChange = browser.listeners.find(({ name }) => name === 'flowhome:consent-change').listener;
  consentChange();
  assert.equal(browser.dataLayer.length, 0, 'rejection sends no denied cookieless command');
  globalThis.__analyticsConsent = true;
  consentChange();
  assert.equal(globalThis.window['ga-disable-G-TEST123456'], false);
  const acceptedLayer = globalThis.window.dataLayer;
  assert.deepEqual(Array.from(acceptedLayer[0]), ['consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  assert.equal(acceptedLayer[1].page_location, 'https://flowhome.dev/quiz/');
  assert.equal(acceptedLayer[1].page_referrer, '');
  assert.equal(acceptedLayer[1].page_title, 'FlowHome');
  assert.equal(acceptedLayer[1].send_page_view, false);
  assert.equal(acceptedLayer[1].allow_google_signals, false);
  assert.equal(acceptedLayer[1].allow_ad_personalization_signals, false);
  assert.equal(acceptedLayer[2].event, 'gtm.js');
  assert.equal(acceptedLayer[3].event, 'page_view');
  assert.equal(browser.scripts.length, 1);
  assert.doesNotMatch(JSON.stringify(acceptedLayer), /private|secret|\?|#/);
  consentChange();
  assert.equal(acceptedLayer.length, 4, 'repeated consent does not duplicate initialization or page views');

  let reloads = 0;
  const assertDisabled = () => assert.equal(globalThis.window['ga-disable-G-TEST123456'], true);
  browser.scripts[0].remove = assertDisabled;
  globalThis.window.location.reload = () => { assertDisabled(); reloads += 1; };
  globalThis.__analyticsConsent = false;
  consentChange();
  assert.equal(reloads, 1);
  assert.equal(globalThis.window.dataLayer, undefined);
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-session-id'), null);
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1'), null);
  consentChange();
  assert.equal(reloads, 1);
  globalThis.__analyticsConsent = true;
  consentChange();
  assert.equal(globalThis.window['ga-disable-G-TEST123456'], true, 'pending reload cannot reactivate the provider');
  assert.equal(browser.scripts.length, 1);
  assert.equal(browser.sessionStorage.getItem('flowhome-analytics-attribution-v1'), null, 'pending reload cannot recreate attribution');
});

test('runtime rejects a GTM destination without a valid opt-out ID before any provider load', async () => {
  const browser = installBrowser();
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#provider-validation`);
  for (const ga4Id of ['', 'G-XXXXXXXXXX', 'G-TEST123456?secret', 'GTM-TEST']) {
    assert.throws(() => isolated.setupAnalytics({ gtmId: 'GTM-TEST', ga4Id }), /reviewed GA4 destination/);
  }
  assert.equal(browser.scripts.length, 0);
  assert.equal(browser.dataLayer.length, 0);
});

test('deferred outbound events are discarded when consent is revoked before delivery', async () => {
  const browser = installBrowser();
  const isolated = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#outbound-revocation`);
  const queued = [];
  globalThis.window.setTimeout = callback => queued.push(callback);
  assert.equal(isolated.trackOutboundEvent('affiliate_click', { product_slug: 'thermostat' }), true);
  globalThis.__analyticsConsent = false;
  queued.shift()();
  assert.equal(browser.dataLayer.length, 0);
});

test('outbound CTA defers a slow dataLayer push without preventing retailer navigation', async () => {
  const browser = installBrowser({ search: '' });
  const outboundAnalytics = await import(`data:text/javascript;base64,${Buffer.from(executable).toString('base64')}#outbound-cta`);
  const queued = [];
  let pushes = 0;
  globalThis.window.setTimeout = (callback) => {
    queued.push(callback);
    return queued.length;
  };
  globalThis.window.dataLayer = {
    push() {
      pushes += 1;
      const until = Date.now() + 25;
      while (Date.now() < until) { /* Simulate a slow third-party dataLayer. */ }
    },
  };
  outboundAnalytics.setupAnalytics();
  const click = browser.listeners.find((entry) => entry.name === 'click').listener;
  const retailerCta = {
    dataset: { ctaPosition: 'product_profile', productSlug: 'thermostat', category: 'smart-home', fhDedupeKey: 'slow-retailer-cta' },
    hasAttribute: (name) => name === 'data-fh-amazon-cta',
  };
  const event = {
    target: { closest: () => retailerCta },
    preventDefault() { throw new Error('retailer navigation must remain the default action'); },
  };

  click(event);
  click(event);
  assert.equal(pushes, 0, 'the click handler never calls a slow analytics provider');
  assert.equal(queued.length, 1, 'pending outbound events retain deduplication');

  queued.shift()();
  assert.equal(pushes, 1);
});
