import assert from 'node:assert/strict';
import test from 'node:test';
import { createTransientLease } from '../src/lib/blocks/block9/transient-lease.ts';

function fixture() {
  let mono = 0;
  let wall = 100_000;
  let changes = 0;
  const timers = new Map();
  let id = 0;
  const lease = createTransientLease({
    clock: { monotonic: () => mono, wall: () => wall },
    changed: () => changes++,
    schedule: callback => { timers.set(++id, callback); return id; },
    cancel: timer => timers.delete(timer),
  });
  return { lease, timers, changes: () => changes, advance: (m, w = m) => { mono += m; wall += w; } };
}

test('network duration is subtracted and exact deadline clears even without a timer tick', () => {
  const f = fixture(); const request = f.lease.begin();
  f.advance(1000);
  assert.equal(f.lease.accept(request.token, { verified: true }, 2000), true);
  f.advance(999); assert.deepEqual(f.lease.read(), { verified: true });
  f.advance(1); assert.equal(f.lease.read(), null);
  assert.equal(f.timers.size, 0); assert.equal(request.signal.aborted, true);
  assert.equal(f.changes(), 2);
});

test('superseded results and errors cannot replace or clear a newer request', () => {
  const f = fixture(); const old = f.lease.begin(); const current = f.lease.begin();
  assert.equal(old.signal.aborted, true);
  assert.equal(f.lease.accept(old.token, { old: true }, 1000), false);
  assert.equal(f.lease.accept(current.token, { current: true }, 1000), true);
  f.lease.fail(old.token); assert.deepEqual(f.lease.read(), { current: true });
  f.lease.fail(current.token); assert.equal(f.lease.read(), null);
});

test('begin clears previous success; hide and resume never resurrect it', () => {
  const f = fixture(); const first = f.lease.begin();
  f.lease.accept(first.token, { ok: true }, 1000);
  const second = f.lease.begin(); assert.equal(f.lease.read(), null);
  f.lease.setPermitted(false); assert.equal(second.signal.aborted, true);
  assert.equal(f.lease.begin(), null);
  assert.equal(f.lease.accept(second.token, { ok: true }, 1000), false);
  f.lease.setPermitted(true); assert.equal(f.lease.read(), null);
  assert.ok(f.lease.begin()); f.lease.dispose(); assert.equal(f.lease.begin(), null);
});

test('sleep and regressing clocks invalidate rather than extending validity', () => {
  for (const [mono, wall] of [[0, 1000], [1000, 0], [-1, 0], [0, -1], [NaN, 0]]) {
    const f = fixture(); const request = f.lease.begin();
    f.lease.accept(request.token, { ok: true }, 1000);
    f.advance(mono, wall); assert.equal(f.lease.read(), null);
  }
});

test('invalid, excessive, or already consumed leases never become available', () => {
  for (const ttl of [0, -1, Infinity, NaN, 60_001, 500]) {
    const f = fixture(); const request = f.lease.begin(); f.advance(500);
    assert.equal(f.lease.accept(request.token, { ok: true }, ttl), false);
    assert.equal(f.lease.read(), null);
  }
});

test('payload mutation and duplicate delivery cannot renew the lease', () => {
  const f = fixture(); const request = f.lease.begin(); const payload = { nested: { ok: true } };
  f.lease.accept(request.token, payload, 1000); payload.nested.ok = false;
  const copy = f.lease.read(); copy.nested.ok = false;
  assert.equal(f.lease.read().nested.ok, true);
  assert.equal(f.lease.accept(request.token, {}, 60_000), false);
  f.advance(1000); assert.equal(f.lease.read(), null);
});

test('early timer rearms and due timer removes data without a reader', () => {
  const f = fixture(); const request = f.lease.begin(); f.lease.accept(request.token, {}, 1000);
  const callback = f.timers.values().next().value; f.timers.clear();
  f.advance(250); callback(); assert.equal(f.timers.size, 1);
  f.advance(750); f.timers.values().next().value();
  assert.equal(f.lease.read(), null); assert.equal(f.changes(), 2);
});
