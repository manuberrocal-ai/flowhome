/**
 * Shared commercial-data ceilings, not proof of a source's publication rights.
 * Freshness is exclusive: 0 <= age < maximum. An earlier expiry or reviewed
 * permission may narrow these limits, never extend them. Editorial dates,
 * review approvals and operational reporting windows do not renew a capture.
 */
const HOUR_MS = 60 * 60 * 1000;

export const COMMERCIAL_DATA_POLICY = Object.freeze({
  priceMs: 24 * HOUR_MS,
  availabilityMs: 24 * HOUR_MS,
  ratingMs: 24 * HOUR_MS,
  // Historical use needs separate, source-specific documented rights.
  defaultHistoryRetentionMs: 0,
});
