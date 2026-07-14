import { hasAnalyticsConsent, shouldReloadOptionalAnalytics } from './consent';

const OPTIONAL_SCRIPT_SELECTOR = '[data-flowhome-optional-analytics]';
const RUNTIME_LOADED_FLAG = '__flowhomeOptionalAnalyticsLoaded';
const RELOAD_PENDING_FLAG = '__flowhomeOptionalAnalyticsReloadPending';

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  [RUNTIME_LOADED_FLAG]?: boolean;
  [RELOAD_PENDING_FLAG]?: boolean;
};

function cleanValue(value: unknown) {
  if (typeof value === 'string') return value.slice(0, 120);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  return undefined;
}

function cleanParameters(parameters: Record<string, unknown> = {}) {
  return Object.fromEntries(Object.entries(parameters)
    .map(([key, value]) => [key, cleanValue(value)])
    .filter(([, value]) => value !== undefined));
}

export function trackEvent(name: string, parameters: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return false;
  const dataLayer = (window as AnalyticsWindow).dataLayer;
  if (!dataLayer) return false;
  dataLayer.push({ event: name, ...cleanParameters(parameters) });
  return true;
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
  if (gtmId) {
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
    analyticsWindow.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`, 'gtm');
    runtimeLoaded = true;
  }
  if (clarityId) {
    injectScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`, 'clarity');
    runtimeLoaded = true;
  }
  if (runtimeLoaded) analyticsWindow[RUNTIME_LOADED_FLAG] = true;
}

function stopOptionalAnalytics() {
  const analyticsWindow = window as AnalyticsWindow;
  if (!shouldReloadOptionalAnalytics(Boolean(analyticsWindow[RUNTIME_LOADED_FLAG]), Boolean(analyticsWindow[RELOAD_PENDING_FLAG]))) return;
  analyticsWindow[RELOAD_PENDING_FLAG] = true;
  document.querySelectorAll(OPTIONAL_SCRIPT_SELECTOR).forEach((script) => script.remove());
  delete analyticsWindow.dataLayer;
  window.location.reload();
}

function pageParameters(element: HTMLElement) {
  const body = document.body;
  return {
    page_type: body.dataset.pageType || 'page',
    cta_position: element.dataset.ctaPosition || 'content',
    product_slug: element.dataset.productSlug || '',
    category: element.dataset.category || '',
    discount: element.dataset.discount || '',
  };
}

function setupEventDelegation() {
  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const element = target?.closest<HTMLElement>('[data-fh-amazon-cta], [data-fh-track]');
    if (!element) return;
    const eventName = element.hasAttribute('data-fh-amazon-cta') ? 'affiliate_click' : element.dataset.fhTrack;
    if (eventName) trackEvent(eventName, pageParameters(element));
  });
}

export function setupAnalytics({ gtmId = '', clarityId = '' } = {}) {
  if (typeof window === 'undefined') return;
  loadOptionalAnalytics(gtmId, clarityId);
  window.addEventListener('flowhome:consent-change', () => {
    if (hasAnalyticsConsent()) loadOptionalAnalytics(gtmId, clarityId);
    else stopOptionalAnalytics();
  });
  setupEventDelegation();
}
