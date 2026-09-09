import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCompatibilityEnvelope } from '../src/lib/blocks/block9/delivery-envelope.ts';
import { serveCompatibilityRequest } from '../src/lib/blocks/block9/request-delivery.ts';
import { documentaryCandidateProvider } from '../src/lib/blocks/block9/documentary-provider.ts';
import { createTransientLease } from '../src/lib/blocks/block9/transient-lease.ts';

const context = { slug: 'tapo-c120-security-camera', surface: 'product', market: 'US' };
const graph = documentaryCandidateProvider.getGraph();
async function envelope(target = context) {
  return (await serveCompatibilityRequest(new Request(`https://flowhome.invalid/compatibility?${new URLSearchParams(target)}`), {
    enabled: true, clock: () => new Date('2026-09-07T01:40:00Z'),
    readAuthorizedSnapshot: async () => ({ graph, authorizationExpiresAt: '2026-10-01T00:00:00Z' }),
  })).json();
}

test('all documentary products and four surfaces survive the actual server JSON contract', async () => {
  for (const node of graph.nodes.filter(node => node.type === 'product')) {
    for (const surface of ['product', 'quiz', 'comparison', 'alternatives']) {
      const target = { ...context, slug: node.slug, surface };
      const body = await envelope(target);
      assert.ok(parseCompatibilityEnvelope(body, target), `${node.slug}/${surface}`);
    }
  }
});

test('wrong schema, context, deadline or private fields fail closed', async () => {
  const baseline = await envelope();
  const changes = [
    b => { b.schemaVersion = 1; }, b => { b.context.surface = 'quiz'; },
    b => { b.context.market = 'CA'; }, b => { b.context.slug = 'other'; },
    b => { b.product.slug = 'other'; }, b => { b.leaseMs = 60_001; },
    b => { b.leaseMs = 0; }, b => { b.validUntil = b.serverTime; },
    b => { b.serverTime = '2026-02-30T01:40:00.000Z'; },
    b => { b.graph = {}; }, b => { b.product.marketplaceId = 'private'; },
    b => { b.context.approved = true; },
  ];
  for (const change of changes) { const b = structuredClone(baseline); change(b); assert.equal(parseCompatibilityEnvelope(b, context), null); }
});

test('affirmations require matching sources and conditions; unknown never means false', async () => {
  const baseline = await envelope();
  for (const change of [
    b => { b.product.compatibilityConditions.alexaCompatible = ''; },
    b => { b.product.compatibilityProvenance.alexaCompatible = null; },
    b => { b.product.matter = false; }, b => { b.product.compatibilityVerified = false; },
    b => { b.product.compatibilityConditions.matter = 'unsupported assertion'; },
    b => { delete b.product.compatibilityConditions.matter; },
    b => { b.product.compatibilityVerificationEnabled = false; },
  ]) { const b = structuredClone(baseline); change(b); assert.equal(parseCompatibilityEnvelope(b, context), null); }
});

test('relation targets, notice labels and internal metadata are bounded', async () => {
  const baseline = await envelope();
  const notice = { relation: 'requires-hub', message: 'Requires the specified hub', confidence: 'high', evidence: 'research-verified', evidenceLabel: 'Research verified', sourceLabel: 'Manufacturer' };
  assert.ok(parseCompatibilityEnvelope({ ...baseline, notices: [notice] }, context));
  for (const change of [
    b => { b.substitutes = [context.slug]; }, b => { b.substitutes = ['other', 'other']; },
    b => { b.complements = ['../other']; }, b => { b.notices = [{ ...notice, evidenceLabel: 'Hands-on tested' }]; },
    b => { b.notices = [{ ...notice, edgeId: 'private' }]; },
    b => { b.notices = [{ ...notice, sourceLabel: 'x'.repeat(4097) }]; },
  ]) { const b = structuredClone(baseline); change(b); assert.equal(parseCompatibilityEnvelope(b, context), null); }
});

test('parsed server envelope enters transient lease and expires without retaining a shared mutable object', async () => {
  let time = 0;
  const lease = createTransientLease({ clock: { monotonic: () => time, wall: () => time } });
  try {
    const request = lease.begin(); const body = await envelope(); const parsed = parseCompatibilityEnvelope(body, context);
    time = 1000; assert.equal(lease.accept(request.token, parsed, parsed.leaseMs), true);
    body.product.alexaCompatible = false; parsed.product.alexaCompatible = false;
    assert.equal(lease.read().product.alexaCompatible, true);
    time = 60_000; assert.equal(lease.read(), null);
  } finally { lease.dispose(); }
});
