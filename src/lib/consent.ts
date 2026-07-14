export const CONSENT_STORAGE_KEY = 'flowhome-consent';
export const CONSENT_VERSION = 1;

const validChoices = new Set(['accepted', 'rejected']);

function getStorage(storage?: Storage | null) {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getConsentPreference(storage?: Storage | null) {
  try {
    const saved = getStorage(storage)?.getItem(CONSENT_STORAGE_KEY);
    if (!saved) return 'unset';
    const preference = JSON.parse(saved);
    return preference.version === CONSENT_VERSION && validChoices.has(preference.choice)
      ? preference.choice
      : 'unset';
  } catch {
    return 'unset';
  }
}

export function hasAnalyticsConsent(storage?: Storage | null) {
  return getConsentPreference(storage) === 'accepted';
}

export function setConsentPreference(choice: 'accepted' | 'rejected', storage?: Storage | null) {
  if (!validChoices.has(choice)) return 'unset';
  const local = getStorage(storage);
  if (!local) return 'unset';
  try {
    local.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, choice }));
  } catch {
    return 'unset';
  }
  return choice;
}

export function revokeConsent(storage?: Storage | null) {
  return setConsentPreference('rejected', storage);
}

export function shouldReloadOptionalAnalytics(wasLoaded: boolean, reloadPending = false) {
  return wasLoaded && !reloadPending;
}
