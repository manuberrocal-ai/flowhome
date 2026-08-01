export const LIFECYCLE_PREFERENCE_VERSION = 1;
export const LIFECYCLE_CATEGORIES = Object.freeze(['video-doorbell', 'smart-thermostat', 'smart-speaker', 'smart-plug', 'smart-lock', 'smart-lighting', 'smart-hub', 'smart-display', 'security-camera', 'robot-vacuum', 'motion-sensor', 'air-purifier', 'garage-door-opener', 'smart-blinds']);
export const LIFECYCLE_MARKETS = Object.freeze(['US']);
export const LIFECYCLE_FREQUENCIES = Object.freeze(['weekly', 'monthly', 'important-only']);
export const LIFECYCLE_TYPES = Object.freeze(['onboarding', 'digest', 'price-drop', 'restock', 'comparison-follow-up', 'recommendation', 'reactivation']);

const allowed = (values, input) => [...new Set((Array.isArray(input) ? input : []).filter((value) => values.includes(value)))];

export function defaultLifecyclePreferences() {
  return { version: LIFECYCLE_PREFERENCE_VERSION, categories: [], market: 'US', frequency: 'weekly', types: [], consented: false, status: 'unset', suppressed: false, suppressionReason: null };
}

export function normalizeLifecyclePreferences(input = {}) {
  const base = defaultLifecyclePreferences();
  const suppressed = input.suppressed === true || input.status === 'unsubscribed';
  const consented = input.consented === true && !suppressed;
  return { version: LIFECYCLE_PREFERENCE_VERSION, categories: allowed(LIFECYCLE_CATEGORIES, input.categories), market: LIFECYCLE_MARKETS.includes(input.market) ? input.market : base.market, frequency: LIFECYCLE_FREQUENCIES.includes(input.frequency) ? input.frequency : base.frequency, types: allowed(LIFECYCLE_TYPES, input.types), consented, status: suppressed ? 'unsubscribed' : consented ? 'active' : 'unset', suppressed, suppressionReason: suppressed && typeof input.suppressionReason === 'string' ? input.suppressionReason.slice(0, 48) : null };
}

export function canReceiveLifecycle(preferences, type) {
  const normalized = normalizeLifecyclePreferences(preferences);
  return normalized.consented && normalized.status === 'active' && !normalized.suppressed && normalized.types.includes(type) && LIFECYCLE_TYPES.includes(type);
}
