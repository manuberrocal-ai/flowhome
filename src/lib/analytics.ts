import { hasAnalyticsConsent, shouldReloadOptionalAnalytics } from './consent';

const OPTIONAL_SCRIPT_SELECTOR = '[data-flowhome-optional-analytics]';
const RUNTIME_LOADED_FLAG = '__flowhomeOptionalAnalyticsLoaded';
const RELOAD_PENDING_FLAG = '__flowhomeOptionalAnalyticsReloadPending';
const GTM_INITIALIZED_FLAG = '__flowhomeGtmInitialized';
const SESSION_ID_KEY = 'flowhome-analytics-session-id';
const ATTRIBUTION_KEY = 'flowhome-analytics-attribution-v1';
const MAX_SEEN_EVENTS = 200;
const MAX_VALUE_LENGTH = 120;

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  [RUNTIME_LOADED_FLAG]?: boolean;
  [RELOAD_PENDING_FLAG]?: boolean;
  [GTM_INITIALIZED_FLAG]?: boolean;
};

const EVENT_FIELDS: Record<string, ReadonlySet<string>> = {
  affiliate_click: new Set(['page_type', 'cta_position', 'product_slug', 'category', 'discount']),
  list_add: new Set(['page_type', 'cta_position', 'product_slug', 'category']),
  quiz_start: new Set(['page_type']),
  quiz_complete: new Set(['page_type', 'goal', 'ecosystem', 'budget', 'installation', 'extra', 'result_count']),
  calculator_used: new Set(['page_type', 'device_type', 'estimated_savings']),
  compare_open: new Set(['page_type', 'cta_position']),
  feed_follow: new Set(['page_type', 'cta_position']),
  experiment_exposure: new Set(['page_type', 'experiment_id', 'variant_id', 'assignment_version', 'mutual_exclusion_group', 'assignment_bucket']),
};

const COMMON_FIELDS = new Set(['event_id', 'dedupe_key', 'campaign', 'experiment']);
const PII_OR_SECRET_PATTERN = /(?:\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\+?\d[ .()-]?){7,}\d\b|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b|\b(?:sk|pk|ghp|github_pat|AIza|xox[baprs])[_-][A-Za-z0-9_-]{12,}\b|\b(?:email|e-mail|phone|name|address|token|secret|password|authorization|bearer|session|cookie|referrer)\b|https?:\/\/|[?&](?:utm_|gclid|fbclid|msclkid))/i;
const URL_LIKE_PATTERN = /(?:\b[a-z][a-z0-9+.-]*:|\/\/[^\s/]+|\bwww\.|\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b)/i;
const SAFE_TEXT_PATTERN = /^[A-Za-z0-9._:/ -]+$/;
const SAFE_PATHNAME_PATTERN = /^\/[A-Za-z0-9._~/-]*$/;
const SAFE_CAMPAIGN_PATTERN = /^[A-Za-z0-9_-]+$/;
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const seenEventKeys = new Set<string>();
const deferredEventKeys = new Set<string>();
let delegationInstalled = false;
let consentListenerInstalled = false;
let runtimeConfig = { gtmId: '', clarityId: '' };

function getSessionStorage() {
  try { return window.sessionStorage; } catch { return null; }
}

function cleanText(value: unknown, maxLength = MAX_VALUE_LENGTH) {
  if (typeof value !== 'string') return undefined;
  const clean = value.trim().slice(0, maxLength);
  let decoded = clean;
  try { decoded = decodeURIComponent(clean); } catch { return undefined; }
  return clean && SAFE_TEXT_PATTERN.test(clean) && !PII_OR_SECRET_PATTERN.test(clean) && !PII_OR_SECRET_PATTERN.test(decoded) && !URL_LIKE_PATTERN.test(clean) && !URL_LIKE_PATTERN.test(decoded) ? clean : undefined;
}

function sanitizePathname(value: unknown) {
  if (typeof value !== 'string' || value.length > 240 || value.includes('?') || value.includes('#') || !SAFE_PATHNAME_PATTERN.test(value)) return '/redacted';
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { return '/redacted'; }
  if (decoded !== value || !SAFE_PATHNAME_PATTERN.test(decoded) || PII_OR_SECRET_PATTERN.test(decoded) || URL_LIKE_PATTERN.test(decoded)) return '/redacted';
  return value;
}

function cleanValue(key: string, value: unknown) {
  if (key === 'discount') return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined;
  if (key === 'result_count' || key === 'assignment_bucket') return typeof value === 'number' && Number.isInteger(value) && value >= 0 && (key === 'assignment_bucket' ? value <= 9999 : value <= 100) ? value : undefined;
  if (key === 'estimated_savings') return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000 ? value : undefined;
  if (key === 'campaign' || key === 'experiment') return typeof value === 'string' && SAFE_CAMPAIGN_PATTERN.test(value) && !PII_OR_SECRET_PATTERN.test(value) ? value.slice(0, 80) : undefined;
  return cleanText(value);
}

function createId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.().replace(/-/g, '');
  return `${prefix}-${(uuid || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`).slice(0, 32)}`;
}

function getSessionId() {
  const storage = getSessionStorage();
  const existing = storage?.getItem(SESSION_ID_KEY);
  if (existing && /^[a-z0-9-]{12,48}$/i.test(existing)) return existing;
  const sessionId = createId('fh');
  try { storage?.setItem(SESSION_ID_KEY, sessionId); } catch { /* Memory-only ID is still consent-gated. */ }
  return sessionId;
}

/** Returns the consent-gated, non-PII session identifier used for assignment. */
export function getAnalyticsClientId() {
  return typeof window !== 'undefined' && hasAnalyticsConsent() ? getSessionId() : undefined;
}

function normalizeAttribution(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  if (Object.keys(source).some((key) => !UTM_FIELDS.includes(key as typeof UTM_FIELDS[number]))) return null;
  const attribution: Record<string, string> = {};
  for (const field of UTM_FIELDS) {
    if (!(field in source)) continue;
    const raw = source[field];
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim().toLowerCase().slice(0, 80);
    if (!normalized || !/^[a-z0-9._-]+$/.test(normalized) || PII_OR_SECRET_PATTERN.test(normalized)) return null;
    attribution[field] = normalized;
  }
  return attribution;
}

function clearStoredAttribution(storage: Storage) {
  try { storage.removeItem(ATTRIBUTION_KEY); } catch { /* Storage can be unavailable. */ }
}

export function captureAttribution(location: Pick<Location, 'search'> = window.location, storage = getSessionStorage()) {
  if (!hasAnalyticsConsent() || !storage) return {};
  try {
    const existing = storage.getItem(ATTRIBUTION_KEY);
    if (existing) {
      let trusted: Record<string, string> | null = null;
      try { trusted = normalizeAttribution(JSON.parse(existing)); } catch { /* Malformed storage is discarded below. */ }
      if (trusted) return trusted;
      clearStoredAttribution(storage);
    }
    const query = new URLSearchParams(location.search);
    const attribution = normalizeAttribution(Object.fromEntries(UTM_FIELDS.flatMap((field) => {
      const raw = query.get(field);
      return raw === null ? [] : [[field, raw]];
    }))) || {};
    storage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    clearStoredAttribution(storage);
    return {};
  }
}

export function clearAnalyticsSession() {
  const storage = getSessionStorage();
  try { storage?.removeItem(SESSION_ID_KEY); storage?.removeItem(ATTRIBUTION_KEY); } catch { /* Storage can be unavailable. */ }
  seenEventKeys.clear();
  deferredEventKeys.clear();
}

export function sanitizeEvent(name: string, parameters: Record<string, unknown> = {}) {
  const allowed = Object.prototype.hasOwnProperty.call(EVENT_FIELDS, name) ? EVENT_FIELDS[name] : undefined;
  if (!allowed || !parameters || typeof parameters !== 'object') return null;
  const output: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (!allowed.has(key) && !COMMON_FIELDS.has(key)) return null;
    if (value === undefined || value === '') continue;
    const clean = cleanValue(key, value);
    if (clean === undefined) return null;
    output[key] = clean;
  }
  return output;
}

function deviceClass() {
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  return width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
}

function pageContext() {
  const body = document.body;
  return {
    consent_state: 'accepted',
    session_id: getSessionId(),
    pathname: sanitizePathname(window.location.pathname),
    device_class: deviceClass(),
    market: cleanText(body.dataset.market || 'us', 24) || 'us',
    ...captureAttribution(),
  };
}

function rememberEvent(key: string) {
  if (seenEventKeys.has(key)) return false;
  seenEventKeys.add(key);
  if (seenEventKeys.size > MAX_SEEN_EVENTS) seenEventKeys.delete(seenEventKeys.values().next().value as string);
  return true;
}

function pushEvent(name: string, clean: Record<string, string | number>, eventId: string, dedupeKey: string) {
  if (!hasAnalyticsConsent()) return false;
  const dataLayer = (window as AnalyticsWindow).dataLayer;
  if (!dataLayer || typeof dataLayer.push !== 'function') return false;
  const seenKey = `${name}:${dedupeKey}`;
  if (deferredEventKeys.has(seenKey) || !rememberEvent(seenKey)) return false;
  try {
    dataLayer.push({ event: name, ...clean, event_id: eventId, ...pageContext() });
    return true;
  } catch {
    seenEventKeys.delete(seenKey);
    return false;
  }
}

export type EventQueueResult = { status: 'queued'; eventId: string } | { status: 'not_queued' };

/** `queued` confirms only the local dataLayer enqueue, never provider delivery. */
export function queueEvent(name: string, parameters: Record<string, unknown> = {}): EventQueueResult {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return { status: 'not_queued' };
  const clean = sanitizeEvent(name, parameters);
  if (!clean) return { status: 'not_queued' };
  const eventId = typeof clean.event_id === 'string' ? clean.event_id : createId('evt');
  const dedupeKey = typeof clean.dedupe_key === 'string' ? clean.dedupe_key : eventId;
  delete clean.dedupe_key;
  return pushEvent(name, clean, eventId, dedupeKey) ? { status: 'queued', eventId } : { status: 'not_queued' };
}

/** Synchronous, best-effort adapter for interactions that do not navigate. */
export function trackEvent(name: string, parameters: Record<string, unknown> = {}) {
  return queueEvent(name, parameters).status === 'queued';
}

/** Defers outbound-event delivery so a slow analytics provider cannot delay navigation. */
export function trackOutboundEvent(name: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return false;
  const clean = sanitizeEvent(name, parameters);
  if (!clean) return false;
  const eventId = typeof clean.event_id === 'string' ? clean.event_id : createId('evt');
  const dedupeKey = typeof clean.dedupe_key === 'string' ? clean.dedupe_key : eventId;
  delete clean.dedupe_key;
  const seenKey = `${name}:${dedupeKey}`;
  if (seenEventKeys.has(seenKey) || deferredEventKeys.has(seenKey)) return false;
  deferredEventKeys.add(seenKey);
  try {
    window.setTimeout(() => {
      deferredEventKeys.delete(seenKey);
      pushEvent(name, clean, eventId, dedupeKey);
    }, 0);
    return true;
  } catch {
    deferredEventKeys.delete(seenKey);
    return false;
  }
}

function injectScript(src: string, name: string) {
  if (document.querySelector(`${OPTIONAL_SCRIPT_SELECTOR}[data-service="${name}"]`)) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  script.dataset.flowhomeOptionalAnalytics = '';
  script.dataset.service = name;
  document.head.appendChild(script);
}

function loadOptionalAnalytics(gtmId: string, clarityId: string) {
  if (!hasAnalyticsConsent()) return;
  const analyticsWindow = window as AnalyticsWindow;
  let runtimeLoaded = false;
  if (gtmId && !analyticsWindow[GTM_INITIALIZED_FLAG]) {
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    try {
      analyticsWindow.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`, 'gtm');
      analyticsWindow[GTM_INITIALIZED_FLAG] = true;
      runtimeLoaded = true;
    } catch { /* Optional provider setup must not break page behavior. */ }
  }
  if (clarityId) {
    injectScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`, 'clarity');
    runtimeLoaded = true;
  }
  if (runtimeLoaded) analyticsWindow[RUNTIME_LOADED_FLAG] = true;
}

function stopOptionalAnalytics() {
  const analyticsWindow = window as AnalyticsWindow;
  const shouldReload = shouldReloadOptionalAnalytics(Boolean(analyticsWindow[RUNTIME_LOADED_FLAG]), Boolean(analyticsWindow[RELOAD_PENDING_FLAG]));
  clearAnalyticsSession();
  document.querySelectorAll(OPTIONAL_SCRIPT_SELECTOR).forEach((script) => script.remove());
  delete analyticsWindow.dataLayer;
  if (!shouldReload) return;
  analyticsWindow[RELOAD_PENDING_FLAG] = true;
  window.location.reload();
}

function pageParameters(element: HTMLElement) {
  const body = document.body;
  const parameters: Record<string, unknown> = {
    page_type: body.dataset.pageType || 'page',
    cta_position: element.dataset.ctaPosition || 'content',
    discount: element.dataset.discount === undefined ? undefined : Number(element.dataset.discount),
  };
  if (element.dataset.productSlug) parameters.product_slug = element.dataset.productSlug;
  if (element.dataset.category) parameters.category = element.dataset.category;
  if (element.dataset.campaign) parameters.campaign = element.dataset.campaign;
  if (element.dataset.experiment) parameters.experiment = element.dataset.experiment;
  return parameters;
}

function setupEventDelegation() {
  if (delegationInstalled) return;
  delegationInstalled = true;
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const element = target?.closest<HTMLElement>('[data-fh-amazon-cta], [data-fh-track]');
    if (!element) return;
    const eventName = element.hasAttribute('data-fh-amazon-cta') ? 'affiliate_click' : element.dataset.fhTrack;
    if (eventName) {
      const parameters = { ...pageParameters(element), dedupe_key: element.dataset.fhDedupeKey || undefined };
      if (element.hasAttribute('data-fh-amazon-cta')) trackOutboundEvent(eventName, parameters);
      else trackEvent(eventName, parameters);
    }
  });
}

export function setupAnalytics({ gtmId = '', clarityId = '' } = {}) {
  if (typeof window === 'undefined') return;
  runtimeConfig = { gtmId, clarityId };
  loadOptionalAnalytics(runtimeConfig.gtmId, runtimeConfig.clarityId);
  if (!consentListenerInstalled) {
    consentListenerInstalled = true;
    window.addEventListener('flowhome:consent-change', () => {
      if (hasAnalyticsConsent()) {
        captureAttribution();
        loadOptionalAnalytics(runtimeConfig.gtmId, runtimeConfig.clarityId);
      } else stopOptionalAnalytics();
    });
  }
  if (hasAnalyticsConsent()) captureAttribution();
  setupEventDelegation();
}
