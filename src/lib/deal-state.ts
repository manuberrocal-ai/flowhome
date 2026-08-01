/**
 * Deal state utility - single source of truth for offer freshness.
 *
 * @packageDocumentation
 *
 * Deals are bucketed into one of four canonical statuses. Comparison is
 * performed in UTC so the result does not depend on the visitor's browser
 * timezone. Accepts only ISO-8601 strings (preferably with timezone offset)
 * or Date instances; ambiguous inputs fall back to "unknown" rather than
 * being silently treated as active.
 */

/** Canonical deal status used across home, deals, cards, and product pages. */
export type DealStatus = 'upcoming' | 'active' | 'expired' | 'unknown';

export interface DealWindow {
  start?: string | Date | null;
  end?: string | Date | null;
}

export interface DealStatusInfo {
  status: DealStatus;
  /** ISO reference timestamp used to compute the status. */
  referenceIso: string;
  /** Zoneless start ISO if available, otherwise null. */
  startIso: string | null;
  /** Zoneless end ISO if available, otherwise null. */
  endIso: string | null;
  /** Milliseconds until the next boundary (start or end). NaN for unknown. */
  msToNext: number;
}

const ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

function toDate(value: string | Date | null | undefined): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || !ISO_REGEX.test(trimmed)) return null;
  // Date-only ISO strings are parsed as UTC midnight by the Date constructor,
  // which is what we want for canonical deal windows ("2026-07-15" => 00:00 UTC).
  const parsed = new Date(trimmed.length === 10 ? `${trimmed}T00:00:00Z` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Compute the canonical status of a deal.
 *
 * Defaults to the provided `now` (UTC). When both start and end are missing or
 * unparseable, the result is "unknown" - we never pretend an offer is active.
 */
export function getDealStatus(
  window: DealWindow | null | undefined,
  now: Date | string = new Date(),
): DealStatusInfo {
  const reference = now instanceof Date ? now : new Date(now);
  const referenceIso = reference.toISOString();
  const start = toDate(window?.start ?? null);
  const end = toDate(window?.end ?? null);

  if (!start && !end) {
    return { status: 'unknown', referenceIso, startIso: null, endIso: null, msToNext: NaN };
  }

  const startMs = start ? start.getTime() - reference.getTime() : -Infinity;
  const endMs = end ? end.getTime() - reference.getTime() : Infinity;

  if (Number.isFinite(startMs) && startMs > 0) {
    return {
      status: 'upcoming',
      referenceIso,
      startIso: toIso(start),
      endIso: toIso(end),
      msToNext: startMs,
    };
  }
  if (Number.isFinite(endMs) && endMs <= 0) {
    return {
      status: 'expired',
      referenceIso,
      startIso: toIso(start),
      endIso: toIso(end),
      msToNext: NaN,
    };
  }
  return {
    status: 'active',
    referenceIso,
    startIso: toIso(start),
    endIso: toIso(end),
    msToNext: Number.isFinite(endMs) ? endMs : NaN,
  };
}

/** True when the deal is currently active. Unknown deals are never active. */
export function isDealActive(window: DealWindow | null | undefined, now?: Date | string): boolean {
  return getDealStatus(window, now).status === 'active';
}

/**
 * Filters deals that should be promoted as live offers. Upcoming deals can opt
 * in via `includeUpcoming`.
 */
export function filterLiveDeals<T extends { data: DealWindow }>(
  deals: T[],
  now: Date | string = new Date(),
  includeUpcoming = false,
): T[] {
  return deals.filter((deal) => {
    const status = getDealStatus(deal.data, now).status;
    if (status === 'active') return true;
    if (includeUpcoming && status === 'upcoming') return true;
    return false;
  });
}

/** Human-friendly switch used by UI copy. Treats `unknown` as `historic`. */
export function getDealUrgencyCopy(window: DealWindow | null | undefined, now?: Date | string): {
  status: DealStatus;
  label: string;
  canShowCountdown: boolean;
} {
  const info = getDealStatus(window, now);
  switch (info.status) {
    case 'upcoming':
      return { status: 'upcoming', label: 'Coming soon', canShowCountdown: true };
    case 'active':
      return { status: 'active', label: 'Live deal', canShowCountdown: true };
    case 'expired':
      return { status: 'expired', label: 'Deal ended', canShowCountdown: false };
    default:
      return { status: 'unknown', label: 'Price last checked', canShowCountdown: false };
  }
}

/**
 * Format `Price last checked [fecha]` with a stable, locale-independent
 * representation. Used when the deal window is unknown or expired and we still
 * want to communicate freshness to the visitor without false urgency.
 */
export function formatPriceLastChecked(date?: Date | string | null): string | null {
  if (!date) return null;
  const parsed = date instanceof Date ? date : toDate(date);
  if (!parsed) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', `Oct`, 'Nov', 'Dec'];
  return `Price last checked ${months[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`;
}
