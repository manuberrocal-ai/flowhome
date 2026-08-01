/** Least-privilege, fail-closed admin review decision with an atomic audit payload. */
import type { AuditLog } from './domain.ts';
import { traceFor } from './operations.ts';
import { strictUtc } from './domain.ts';
import { buildIdempotencyKey } from '../block8/ingestion.ts';
import type { HumanApproval } from './domain.ts';
import { isCurrentApproval } from './operations.ts';

export type AdminRole = 'viewer' | 'reviewer' | 'operator' | 'admin';
export interface AdminAction { requestId: string; actorId: string; role: AdminRole; action: 'review' | 'override' | 'replay' | 'kill_switch'; targetType: string; targetId: string; reason: string; approval: HumanApproval | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null; now: string; }
const FORBIDDEN = /(?:@|token|secret|password|authorization|bearer|cookie|https?:\/\/|\b\d{7,}\b)/i;
const ID = /^[A-Za-z0-9:_-]{1,160}$/;
const TARGET = /^[A-Za-z0-9:_-]{1,80}$/;
function safeSnapshot(value: unknown): value is Record<string, unknown> | null {
  if (value === null) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value as Record<string, unknown>).every(([key, entry]) => /^[A-Za-z0-9_-]{1,80}$/.test(key) && !FORBIDDEN.test(key) && (entry === null || typeof entry === 'boolean' || (typeof entry === 'number' && Number.isFinite(entry)) || (typeof entry === 'string' && entry.length <= 240 && !FORBIDDEN.test(entry)) || safeSnapshot(entry)));
}

export function decideAdminAction(input: AdminAction): { allowed: boolean; audit: AuditLog } {
  const trace = traceFor('admin', input.actorId);
  const recordedAt = strictUtc(input.now) ?? '1970-01-01T00:00:00.000Z';
  const approvalAction = input.action === 'replay' ? 'replay' : input.action === 'kill_switch' ? 'kill_switch' : 'destructive';
  const valid = ID.test(input.requestId) && ID.test(input.actorId) && TARGET.test(input.targetType) && ID.test(input.targetId) && Boolean(input.reason.trim()) && input.reason.length <= 240 && !FORBIDDEN.test(input.reason) && Boolean(strictUtc(input.now)) && safeSnapshot(input.before) && safeSnapshot(input.after);
  const allowedRole = input.action === 'review' ? input.role === 'reviewer' || input.role === 'admin' : input.role === 'admin';
  const requiresApproval = input.action === 'override' || input.action === 'replay' || input.action === 'kill_switch';
  const allowed = valid && allowedRole && (!requiresApproval || isCurrentApproval(input.approval, approvalAction, recordedAt));
  return { allowed, audit: { id: buildIdempotencyKey('audit', [input.requestId]), actorId: ID.test(input.actorId) ? input.actorId : 'unknown', action: input.action, targetType: TARGET.test(input.targetType) ? input.targetType : 'unknown', targetId: ID.test(input.targetId) ? input.targetId : 'unknown', reason: valid ? input.reason.trim().slice(0, 240) : 'redacted_invalid_reason', approvalId: allowed ? input.approval?.id ?? null : null, outcome: allowed ? 'applied' : 'blocked', traceId: trace.traceId, source: 'block10-admin', recordedAt, before: allowed ? input.before : null, after: allowed ? input.after : null } };
}
