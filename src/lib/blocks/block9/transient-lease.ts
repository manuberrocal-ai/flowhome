/** Memory-only lifetime control. Payload validation and transport belong to the caller. */
export interface LeaseClock {
  monotonic(): number;
  wall(): number;
}

export function createTransientLease<T>(options: {
  clock?: LeaseClock;
  changed?: () => void;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
} = {}) {
  const clock = options.clock ?? { monotonic: () => performance.now(), wall: () => Date.now() };
  const schedule = options.schedule ?? setTimeout;
  const cancel = options.cancel ?? clearTimeout;
  let generation = 0;
  let disposed = false;
  let permitted = true;
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let value: T | null = null;
  let started = [0, 0];
  let last = [0, 0];
  let lifetime = 0;

  function clear() {
    generation++;
    controller?.abort();
    controller = undefined;
    if (timer !== undefined) cancel(timer);
    timer = undefined;
    const hadValue = value !== null;
    value = null;
    if (hadValue) options.changed?.();
  }

  function elapsed() {
    const current = [clock.monotonic(), clock.wall()];
    if (current.some((time, index) => !Number.isFinite(time) || time < last[index])) return Infinity;
    last = current;
    // Wall time catches sleep on platforms whose monotonic clock stops in sleep.
    // Regressions invalidate instead of making a lease longer.
    return Math.max(current[0] - started[0], current[1] - started[1]);
  }

  function expire() {
    const remaining = lifetime - elapsed();
    if (remaining <= 0) clear();
    else timer = schedule(expire, remaining);
  }

  return {
    begin() {
      clear();
      if (disposed || !permitted) return null;
      started = [clock.monotonic(), clock.wall()];
      last = [...started];
      if (started.some(time => !Number.isFinite(time))) return null;
      controller = new AbortController();
      const token = generation;
      return { token, signal: controller.signal };
    },
    /** Accept only an already validated JSON payload. Token is never a server authorization. */
    accept(token: number, payload: T, leaseMs: number) {
      if (disposed || !permitted || !controller || controller.signal.aborted || token !== generation) return false;
      if (!Number.isFinite(leaseMs) || leaseMs <= 0 || leaseMs > 60_000 || elapsed() >= leaseMs) {
        clear();
        return false;
      }
      // A request can publish exactly once; repeated accept cannot renew its timer.
      if (value !== null) return false;
      const copy = structuredClone(payload);
      if (copy === null) return false;
      lifetime = leaseMs;
      value = copy;
      expire();
      if (value === null) return false;
      options.changed?.();
      return true;
    },
    read(): T | null {
      if (value !== null && elapsed() >= lifetime) clear();
      return value === null ? null : structuredClone(value);
    },
    fail(token: number) { if (token === generation) clear(); },
    invalidate: clear,
    /** Hide/freeze/offline: false. Resume only permits a new request, never restores data. */
    setPermitted(next: boolean) { permitted = next; if (!next) clear(); },
    dispose() { disposed = true; clear(); },
  };
}
