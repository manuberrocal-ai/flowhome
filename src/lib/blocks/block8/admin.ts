/**
 * Block 8 — Admin review/override contract and audit trail.
 *
 * @packageDocumentation
 *
 * An admin can review flagged offers/trend signals/deal candidates and apply a
 * narrow set of override actions. The contract is fail-closed:
 *
 * - **`override_promote`** can only move an offer to `active` if the offer is
 *   already promotable (fresh, not expired, not suppressed by freshness). An
 *   admin cannot override a stale/expired offer into promotion; the action is
 *   rejected and recorded on the audit trail with `outcome=blocked_stale`.
 * - **`override_suppress`** can move any offer to `suppressed`; this never
 *   fabricates any claim and is always allowed.
 * - **`anomaly_acknowledge`** demotes a flagged anomalous signal so TrendScore
 *   stops ignoring it (only valid when anomaly was a soft false-positive).
 * - The admin can `expire_now` any offer (`expired` lifecycle) — terminal.
 * - `reset` reverts a partial override state to the ingestion baseline.
 *
 * An override never edits the score directly; the score is recomputed from the
 * updated offer inputs. The audit entry records the before/after field
 * snapshot of the *override target only*, so the trail is invariant across
 * replays. No PII; no production keys; no fabrication.
 */
import type {
  AdminActionType,
  AdminAuditEntry,
  Offer,
  OfferLifecycle,
  ReviewVerdict,
  TrendSignal,
} from './domain.ts';
import { toStrictUtc } from './domain.ts';
import { isOfferPromotable } from './freshness.ts';

export interface ApplyOverrideInput {
  targetId: string;
  targetType: 'offer' | 'trend_signal' | 'deal_candidate';
  action: AdminActionType;
  actorId: string;
  note: string | null;
  now?: Date | string;
}

export interface ApplyOverrideResult {
  /** New lifecycle applied to the target (or unchanged when blocked). */
  appliedLifecycle: OfferLifecycle | null;
  /** New review verdict applied to the target (or unchanged when blocked). */
  appliedReview: ReviewVerdict | null;
  /** True when the action changed either state field. */
  changed: boolean;
  /** Stable outcome code; surfaces to the audit trail. */
  outcome: 'applied' | 'blocked_stale' | 'blocked_unsupported_action' | 'no_change';
  /** The audit entry written for the action, even when blocked. */
  audit: AdminAuditEntry;
}

function isPromotableState(offer: Pick<Offer, 'capturedAt' | 'expiresAt' | 'availability' | 'availabilityCapturedAt' | 'lastSnapshotId' | 'lifecycle' | 'review'>, now: Date): boolean {
  return isOfferPromotable({ ...offer, lifecycle: 'active', review: 'approved' }, now).promotable;
}

function emptyAudit(input: ApplyOverrideInput, recordedAt: string): AdminAuditEntry {
  return {
    id: buildAuditId(input, recordedAt),
    targetId: input.targetId,
    targetType: input.targetType,
    action: input.action,
    fields: [],
    note: input.note,
    actorId: input.actorId,
    recordedAt,
    before: null,
    after: null,
  };
}

function buildAuditId(input: ApplyOverrideInput, recordedAt: string): string {
  let hash = 0x811c9dc5;
  const parts = [input.targetId, input.targetType, input.action, input.actorId, recordedAt];
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return `audit:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function snapshotFields<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in obj) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out;
}

/**
 * Apply an admin override. Pure and deterministic. Returns the resulting state
 * and an audit entry regardless of whether the action was applied or blocked.
 *
 * The caller is responsible for persisting the new state and the audit entry
 * atomically; this function only decides and describes the change.
 */
export function applyOverride(
  input: ApplyOverrideInput,
  target:
    | (Pick<Offer, 'capturedAt' | 'expiresAt' | 'availability' | 'availabilityCapturedAt' | 'lastSnapshotId' | 'lifecycle' | 'review'> & Record<string, unknown>)
    | (Pick<TrendSignal, 'anomaly'> & Record<string, unknown>)
    | Record<string, unknown>,
): ApplyOverrideResult {
  const ref = input.now instanceof Date ? input.now : input.now ? new Date(input.now) : new Date();
  const recordedAt = toStrictUtc(ref.toISOString()) ?? ref.toISOString();
  const baseAudit = emptyAudit(input, recordedAt);

  if (input.targetType === 'offer') {
    const offer = target as Pick<Offer, 'capturedAt' | 'expiresAt' | 'availability' | 'availabilityCapturedAt' | 'lastSnapshotId' | 'lifecycle' | 'review'> & Record<string, unknown>;
    const before = snapshotFields(offer, ['lifecycle', 'review']);
    let nextLifecycle: OfferLifecycle = offer.lifecycle;
    let nextReview: ReviewVerdict = offer.review;
    let outcome: ApplyOverrideResult['outcome'] = 'no_change';
    let changed = false;

    if (input.action === 'override_promote') {
      if (isPromotableState(offer, ref)) {
        nextLifecycle = 'active';
        nextReview = 'approved';
        changed = true;
        outcome = 'applied';
      } else {
        outcome = 'blocked_stale';
      }
    } else if (input.action === 'override_suppress') {
      nextLifecycle = 'suppressed';
      nextReview = 'rejected';
      if (offer.lifecycle !== nextLifecycle || offer.review !== nextReview) {
        changed = true;
        outcome = 'applied';
      }
    } else if (input.action === 'expire_now') {
      nextLifecycle = 'expired';
      nextReview = offer.review;
      if (offer.lifecycle !== nextLifecycle) {
        changed = true;
        outcome = 'applied';
      }
    } else if (input.action === 'reset') {
      nextLifecycle = 'pending_review';
      nextReview = 'unknown';
      if (offer.lifecycle !== nextLifecycle || offer.review !== nextReview) {
        changed = true;
        outcome = 'applied';
      }
    } else if (input.action === 'anomaly_acknowledge') {
      outcome = 'blocked_unsupported_action';
    } else {
      outcome = 'blocked_unsupported_action';
    }

    const after = snapshotFields({ ...offer, lifecycle: nextLifecycle, review: nextReview }, ['lifecycle', 'review']);
    const audit: AdminAuditEntry = {
      ...baseAudit,
      fields: changed ? ['lifecycle', 'review'] : [],
      before: changed ? before : null,
      after: changed ? after : null,
    };
    return {
      appliedLifecycle: changed || outcome === 'applied' ? nextLifecycle : null,
      appliedReview: changed || outcome === 'applied' ? nextReview : null,
      changed,
      outcome,
      audit,
    };
  }

  if (input.targetType === 'trend_signal') {
    const signal = target as Pick<TrendSignal, 'anomaly'> & Record<string, unknown>;
    const before = snapshotFields(signal, ['anomaly']);
    if (input.action === 'anomaly_acknowledge') {
      // Only valid when the anomaly is a documented false positive; the flag is
      // cleared but the original signal content stays unchanged.
      const after = { ...before, anomaly: false };
      return {
        appliedLifecycle: null,
        appliedReview: null,
        changed: Boolean(signal.anomaly),
        outcome: signal.anomaly ? 'applied' : 'no_change',
        audit: { ...baseAudit, fields: signal.anomaly ? ['anomaly'] : [], before: signal.anomaly ? before : null, after: signal.anomaly ? after : null },
      };
    }
    return {
      appliedLifecycle: null,
      appliedReview: null,
      changed: false,
      outcome: 'blocked_unsupported_action',
      audit: baseAudit,
    };
  }

  // deal_candidate: no actions supported except routine suppress; the score is
  // recomputed from inputs and not overridden here.
  return {
    appliedLifecycle: null,
    appliedReview: null,
    changed: false,
    outcome: 'blocked_unsupported_action',
    audit: baseAudit,
  };
}

/**
 * Replay a list of audit entries to verify the trail is self-contained. Pure
 * regression helper; returns `true` when every `before`/`after` field pair
 * is recorded with the fields the action says it touched.
 */
export function verifyAuditTrail(entries: AdminAuditEntry[]): { ok: boolean; reason: string | null } {
  for (const e of entries) {
    const expectedFields = new Set(e.fields);
    if (expectedFields.size === 0) continue;
    if (e.before == null || e.after == null) {
      return { ok: false, reason: `entry ${e.id} missing before/after for changed fields` };
    }
    for (const f of expectedFields) {
      if (!(f in (e.before as Record<string, unknown>)) || !(f in (e.after as Record<string, unknown>))) {
        return { ok: false, reason: `entry ${e.id} missing field ${f} in before/after` };
      }
    }
  }
  return { ok: true, reason: null };
}

// Convenience export for callers wanting a stable id constructor externally.
export { buildAuditId, snapshotFields };
