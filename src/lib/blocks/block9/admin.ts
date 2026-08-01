/**
 * Block 9 — Admin review/override contract and audit trail for claims.
 *
 * @packageDocumentation
 *
 * An admin reviews ledger entries and edges and applies a narrow set of
 * override actions. The contract is fail-closed and mirrors the Block 8
 * discipline:
 *
 * - **`approve`** can move a claim to `active` only when it is still fresh
 *   and not expired. Admin cannot force an expired/stale claim through;
 *   the action is rejected with `blocked_stale` and still audited.
 * - **`suppress`** can move any claim to `suppressed`; never fabricates.
 * - **`dispute`** moves any claim to `disputed`; surfaced content degrades.
 * - **`expire_now`** terminates a claim (`expired`).
 * - **`reinstate`** returns a claim to `active` only if it is still fresh.
 * - **`reset`** reverts to `unknown` (needs review).
 *
 * Every action writes an immutable `ClaimAdminAuditEntry` with before/after
 * snapshots of the touched fields. Blocked actions still record an entry.
 */
import type {
  ClaimAdminAction,
  ClaimAdminAuditEntry,
  ClaimReviewEntry,
  ClaimStatus,
} from './domain.ts';
import { toStrictUtc } from './domain.ts';
import { evaluateClaimFreshness } from './freshness.ts';

export interface ClaimOverrideInput {
  targetId: string;
  targetType: 'claim' | 'edge';
  action: ClaimAdminAction;
  actorId: string;
  note: string | null;
  now?: Date | string;
}

export interface ClaimOverrideResult {
  appliedStatus: ClaimStatus | null;
  changed: boolean;
  outcome: 'applied' | 'blocked_stale' | 'blocked_unsupported_action' | 'no_change';
  audit: ClaimAdminAuditEntry;
}

function buildAuditId(input: ClaimOverrideInput, recordedAt: string): string {
  let hash = 0x811c9dc5;
  const parts = [input.targetId, input.targetType, input.action, input.actorId, recordedAt];
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  return `claim-audit:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function emptyAudit(input: ClaimOverrideInput, recordedAt: string): ClaimAdminAuditEntry {
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

function snapshotFields<T extends Record<string, unknown>>(obj: T, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in obj) out[k] = (obj as Record<string, unknown>)[k];
  }
  return out;
}

type Claimish = { status: ClaimStatus; verifiedAt: string; expiry: string | null } & Record<string, unknown>;

function isFreshClaim(target: Claimish, ref: Date): boolean {
  const f = evaluateClaimFreshness({ verifiedAt: target.verifiedAt, expiry: target.expiry }, ref);
  return f.reason === 'fresh';
}

/**
 * Apply an admin override to a claim or edge. Pure and deterministic; the
 * caller persists the new state and the audit entry atomically.
 */
export function applyClaimOverride(
  input: ClaimOverrideInput,
  target: Claimish,
): ClaimOverrideResult {
  const ref = input.now instanceof Date ? input.now : input.now ? new Date(input.now) : new Date();
  const recordedAt = toStrictUtc(ref.toISOString()) ?? ref.toISOString();
  const baseAudit = emptyAudit(input, recordedAt);

  const before = snapshotFields(target, ['status']);
  let nextStatus: ClaimStatus = target.status;
  let outcome: ClaimOverrideResult['outcome'] = 'no_change';
  let changed = false;

  if (input.action === 'approve' || input.action === 'reinstate') {
    if (isFreshClaim(target, ref)) {
      nextStatus = 'active';
      if (target.status !== nextStatus) {
        changed = true;
        outcome = 'applied';
      } else {
        outcome = 'no_change';
      }
    } else {
      outcome = 'blocked_stale';
    }
  } else if (input.action === 'suppress') {
    nextStatus = 'suppressed';
    if (target.status !== nextStatus) {
      changed = true;
      outcome = 'applied';
    } else {
      outcome = 'no_change';
    }
  } else if (input.action === 'dispute') {
    nextStatus = 'disputed';
    if (target.status !== nextStatus) {
      changed = true;
      outcome = 'applied';
    } else {
      outcome = 'no_change';
    }
  } else if (input.action === 'expire_now') {
    nextStatus = 'expired';
    if (target.status !== nextStatus) {
      changed = true;
      outcome = 'applied';
    } else {
      outcome = 'no_change';
    }
  } else if (input.action === 'reset') {
    nextStatus = 'unknown';
    if (target.status !== nextStatus) {
      changed = true;
      outcome = 'applied';
    } else {
      outcome = 'no_change';
    }
  } else {
    outcome = 'blocked_unsupported_action';
  }

  const after = snapshotFields({ ...target, status: nextStatus }, ['status']);
  const audit: ClaimAdminAuditEntry = {
    ...baseAudit,
    fields: changed ? ['status'] : [],
    before: changed ? before : null,
    after: changed ? after : null,
  };
  return {
    appliedStatus: outcome === 'applied' || changed ? nextStatus : null,
    changed,
    outcome,
    audit,
  };
}

/** Append a review-history entry to an edge or ledger row (pure). */
export function appendReviewHistory(
  history: ReadonlyArray<ClaimReviewEntry>,
  entry: ClaimReviewEntry,
): ClaimReviewEntry[] {
  return [...history, entry];
}

/** Verify a claim audit trail is self-contained (mirrors Block 8). */
export function verifyClaimAuditTrail(entries: ClaimAdminAuditEntry[]): { ok: boolean; reason: string | null } {
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
