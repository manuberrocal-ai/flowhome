/** Server-only deterministic keys. No I/O; legacy keys are never silently upgraded. */
import { createHash } from 'node:crypto';

export function canonicalContent(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('invalid_idempotency_number');
    return Object.is(value, -0) ? '-0' : String(value);
  }
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalContent).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalContent((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  throw new Error('invalid_idempotency_content');
}

export function buildIdempotencyKey(prefix: string, parts: readonly (string | number)[]): string {
  if (!/^[a-z0-9_-]{1,40}$/i.test(prefix) || !parts.every((part) => typeof part === 'string' || typeof part === 'number')) throw new Error('invalid_idempotency_parts');
  const canonical = canonicalContent(parts.map((part) => [typeof part, part]));
  return `${prefix}:v2:${createHash('sha256').update(canonical).digest('hex')}`;
}

export function hasLegacyIdempotencyKeys(keys: Iterable<string>): boolean {
  return [...keys].some((key) => !/^[a-z0-9_-]{1,40}:v2:[0-9a-f]{64}$/i.test(key));
}
