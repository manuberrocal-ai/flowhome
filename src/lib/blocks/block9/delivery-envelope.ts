/** Public wire schema only; deliberately no runtime import of server/graph data. */
import type { CompatibilityRequestContext } from './request-delivery.ts';
import type { VerifiedProduct } from './compatibility-adapter.ts';
import type { VerifiedNotice, VerifiedRelation } from './resolver.ts';

const fields = ['alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'smartthingsIntegration', 'matter', 'thread', 'zigbee', 'wifi', 'bluetooth'] as const;
const relations = ['requires-hub', 'requires-bridge', 'requires-subscription', 'local-only', 'cloud-only', 'conflicts', 'requires-installation', 'requires-electrical', 'requires-housing', 'available-in', 'warranty-covered-in'];
const labels = { 'hands-on-tested': 'Hands-on tested', 'research-verified': 'Research verified', 'data-evaluated': 'Data evaluated' };
export interface CompatibilityEnvelope {
  schemaVersion: 2;
  context: CompatibilityRequestContext;
  serverTime: string;
  validUntil: string;
  leaseMs: number;
  product: VerifiedProduct<{ slug: string }>;
  substitutes: string[];
  complements: string[];
  relations: VerifiedRelation[];
  notices: Omit<VerifiedNotice, 'edgeId'>[];
}
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function keys(value: Record<string, unknown>, allowed: readonly string[], required = allowed) {
  return Object.keys(value).every(key => allowed.includes(key)) && required.every(key => Object.hasOwn(value, key));
}
function slug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function text(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 4096;
}
function timestamp(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return NaN;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value ? ms : NaN;
}

/** Call after JSON.parse of a size-bounded body from the trusted same-origin endpoint.
 * This validates shape/consistency, NOT the authenticity of evidence or approval.
 * All text remains untrusted text and must never be inserted as HTML.
 */
export function parseCompatibilityEnvelope(value: unknown, expected: CompatibilityRequestContext): CompatibilityEnvelope | null {
  if (!record(value) || !keys(value, ['schemaVersion', 'context', 'serverTime', 'validUntil', 'leaseMs', 'product', 'substitutes', 'complements', 'relations', 'notices']) || value.schemaVersion !== 2) return null;
  const context = value.context;
  if (!record(context) || !keys(context, ['slug', 'surface', 'market']) || !slug(context.slug)
    || !['product', 'quiz', 'comparison', 'alternatives'].includes(String(context.surface)) || context.market !== 'US'
    || context.slug !== expected.slug || context.surface !== expected.surface || context.market !== expected.market) return null;
  if (typeof value.leaseMs !== 'number' || !Number.isInteger(value.leaseMs) || value.leaseMs <= 0 || value.leaseMs > 60_000
    || timestamp(value.validUntil) - timestamp(value.serverTime) !== value.leaseMs) return null;
  const product = value.product;
  const required = ['slug', 'compatibilityVerificationEnabled', 'compatibilityVerified', 'compatibilityProvenance', 'compatibilityConditions'];
  if (!record(product) || !keys(product, [...required, ...fields], required) || product.slug !== context.slug || product.compatibilityVerificationEnabled !== true) return null;
  const sources = product.compatibilityProvenance;
  const conditions = product.compatibilityConditions;
  if (!record(sources) || !record(conditions) || !keys(sources, fields) || !keys(conditions, fields)) return null;
  let any = false;
  for (const field of fields) {
    if (product[field] === true) {
      if (!text(sources[field]) || !text(conditions[field])) return null;
      any = true;
    } else if (Object.hasOwn(product, field) || sources[field] !== null || conditions[field] !== null) return null;
  }
  if (product.compatibilityVerified !== any) return null;
  for (const list of [value.substitutes, value.complements]) {
    if (!Array.isArray(list) || list.length > 100 || !list.every(slug) || new Set(list).size !== list.length || list.includes(context.slug)) return null;
  }
  if (!Array.isArray(value.relations) || value.relations.length > 200) return null;
  const relationKeys = new Set<string>();
  const explained = { substitutes: new Set<string>(), complements: new Set<string>() };
  for (const relation of value.relations) {
    if (!record(relation) || !keys(relation, ['relation', 'targetSlug', 'targetType', 'condition', 'sourceLabel', 'evidence', 'evidenceLabel', 'confidence'])
      || (relation.relation !== 'substitutes' && relation.relation !== 'complements')
      || !slug(relation.targetSlug) || relation.targetSlug === context.slug
      || !['product', 'hardware'].includes(String(relation.targetType)) || (relation.relation === 'substitutes' && relation.targetType !== 'product')
      || !text(relation.condition) || !text(relation.sourceLabel)
      || !['high', 'medium', 'low'].includes(String(relation.confidence))
      || typeof relation.evidence !== 'string' || !Object.hasOwn(labels, relation.evidence)
      || relation.evidenceLabel !== labels[relation.evidence as keyof typeof labels]) return null;
    const key = JSON.stringify([relation.relation, relation.targetSlug, relation.targetType, relation.condition, relation.sourceLabel, relation.evidence, relation.confidence]);
    if (relationKeys.has(key)) return null;
    relationKeys.add(key); explained[relation.relation].add(relation.targetSlug);
  }
  for (const kind of ['substitutes', 'complements'] as const) {
    const targets = value[kind] as string[];
    if (targets.length !== explained[kind].size || targets.some(target => !explained[kind].has(target))) return null;
  }
  if (!Array.isArray(value.notices) || value.notices.length > 100) return null;
  for (const notice of value.notices) {
    if (!record(notice) || !keys(notice, ['relation', 'message', 'confidence', 'evidence', 'evidenceLabel', 'sourceLabel'])
      || !relations.includes(String(notice.relation)) || !['high', 'medium', 'low', 'unknown'].includes(String(notice.confidence))
      || typeof notice.evidence !== 'string' || !Object.hasOwn(labels, notice.evidence)
      || notice.evidenceLabel !== labels[notice.evidence as keyof typeof labels]
      || !text(notice.message) || !text(notice.sourceLabel)) return null;
  }
  return structuredClone(value) as unknown as CompatibilityEnvelope;
}
