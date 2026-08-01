const encoder = new TextEncoder();
const b64encode = (bytes) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const b64decode = (value) => Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=')), (char) => char.charCodeAt(0));

export function constantTimeEqual(a, b) {
  const left = typeof a === 'string' ? encoder.encode(a) : a;
  const right = typeof b === 'string' ? encoder.encode(b) : b;
  let difference = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) difference |= (left[index % Math.max(left.length, 1)] || 0) ^ (right[index % Math.max(right.length, 1)] || 0);
  return difference === 0;
}

export function hasConfiguredSecret(secret, minimumLength = 32) {
  return typeof secret === 'string' && secret.length >= minimumLength;
}

export async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64encode(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

export async function verifyHmac({ secret, value, signature, timestamp, maxAgeSeconds = 300, now = Date.now() }) {
  const numericTimestamp = Number(timestamp);
  if (!hasConfiguredSecret(secret) || !Number.isInteger(numericTimestamp) || Math.abs(now - numericTimestamp * 1000) > maxAgeSeconds * 1000) return false;
  return constantTimeEqual(await hmac(secret, `${timestamp}.${value}`), signature || '');
}

export async function verifyUnsubscribeToken(token, secret, now = Date.now()) {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || !hasConfiguredSecret(secret) || !constantTimeEqual(await hmac(secret, payload), signature)) return null;
  try { const decoded = JSON.parse(new TextDecoder().decode(b64decode(payload))); return typeof decoded.userId === 'string' && Number.isInteger(decoded.exp) && decoded.exp * 1000 >= now ? decoded : null; } catch { return null; }
}

export async function createUnsubscribeToken({ userId, exp }, secret) {
  if (!hasConfiguredSecret(secret) || typeof userId !== 'string' || !Number.isInteger(exp)) throw new Error('Invalid unsubscribe token input.');
  const payload = b64encode(encoder.encode(JSON.stringify({ userId, exp })));
  return `${payload}.${await hmac(secret, payload)}`;
}
