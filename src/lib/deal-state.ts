/**
 * Deal state utility - single source of truth for offer freshness.
 *
 * @packageDocumentation
 *
 * Deals are bucketed into one of four canonical statuses. Comparison is
 * performed in UTC so the result does not depend on the visitor's browser
 * timezone. Timestamps require an explicit Z or numeric offset. Legacy
 * date-only deal boundaries mean UTC midnight, never the visitor's timezone.
 * Invalid calendars, unknown end dates and invalid reference times fail closed.
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
  /** Normalized UTC start ISO if available, otherwise null. */
  startIso: string | null;
  /** Normalized UTC end ISO if available, otherwise null. */
  endIso: string | null;
  /** Milliseconds until the next boundary (start or end). NaN for unknown. */
  msToNext: number;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

function toDate(value: string | Date | null | undefined, allowDateOnly = true): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value !== 'string') return null;
  const normalized = allowDateOnly && DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value;
  const match = ISO_REGEX.exec(normalized);
  if (!match) return null;
  // Validate the local calendar independently: Date.parse otherwise rolls
  // February 30 and 24:00 into a different, apparently valid date.
  const localUtc = `${match[1]}.${(match[2] ?? '').padEnd(3, '0')}Z`;
  const localDate = new Date(localUtc);
  if (!Number.isFinite(localDate.valueOf()) || localDate.toISOString() !== localUtc) return null;
  if (match[3] !== 'Z') {
    const hours = Number(match[3].slice(1, 3));
    const minutes = Number(match[3].slice(4, 6));
    if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return null;
  }
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function toIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Compute the canonical status of a deal.
 *
 * A valid end is mandatory: an open-ended claim cannot establish an active
 * promotion. End-only windows remain supported for the client expiry check.
 * `referenceIso` is empty when `now` is invalid; no timestamp is fabricated.
 */
export function getDealStatus(
  window: DealWindow | null | undefined,
  now: Date | string = new Date(),
): DealStatusInfo {
  const reference = toDate(now, false);
  const referenceIso = reference?.toISOString() ?? '';
  const start = toDate(window?.start ?? null);
  const end = toDate(window?.end ?? null);

  if (!reference || !end || (window?.start != null && !start) || (start && start.getTime() >= end.getTime())) {
    return { status: 'unknown', referenceIso, startIso: toIso(start), endIso: toIso(end), msToNext: NaN };
  }

  const startMs = start ? start.getTime() - reference.getTime() : -Infinity;
  const endMs = end.getTime() - reference.getTime();

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
  const parsed = toDate(date);
  if (!parsed) return null;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', `Oct`, 'Nov', 'Dec'];
  return `Price last checked ${months[parsed.getUTCMonth()]} ${parsed.getUTCDate()}, ${parsed.getUTCFullYear()}`;
}
