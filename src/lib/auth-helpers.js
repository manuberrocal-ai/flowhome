export const AUTH_CHANGE_MESSAGE_TYPE = 'flowhome:auth-changed';

export function getSafeReturnPath(value, fallback = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;

  try {
    const origin = 'https://flowhome.invalid';
    const url = new URL(value, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function buildEmailCompleteUrl(origin, returnPath) {
  const url = new URL('/account/', origin);
  url.searchParams.set('mode', 'email-complete');
  url.searchParams.set('return', getSafeReturnPath(returnPath));
  return url.href;
}

export function buildEmailSignInUrl(origin, returnPath) {
  const url = new URL('/account/', origin);
  url.searchParams.set('mode', 'email');
  url.searchParams.set('return', getSafeReturnPath(returnPath));
  return url.href;
}

export function getUserInitials(user) {
  const metadata = user?.user_metadata || {};
  const name = String(metadata.full_name || metadata.name || user?.email?.split('@')[0] || '').trim();
  const words = name.split(/[\s._-]+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'A';
}

export function createAuthChangeMessage() {
  return { type: AUTH_CHANGE_MESSAGE_TYPE };
}
