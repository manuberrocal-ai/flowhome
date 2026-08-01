interface CartStore {
  getSyncPayload(): unknown;
  applyRemoteState(state: unknown): unknown;
  setAuthenticatedUser(userId: string): unknown;
  setAnonymousNamespace(): unknown;
  subscribe(listener: () => void): () => void;
}

interface CartSession {
  user?: { id?: string } | null;
}

interface AuthSubscription {
  unsubscribe?: () => void;
}

interface CartSyncClient {
  rpc(name: 'sync_cart', args: { p_cart: unknown }): PromiseLike<{ data?: unknown; error?: unknown }>;
  auth?: {
    getSession?: () => Promise<{ data?: { session?: CartSession | null } }>;
    onAuthStateChange?: (callback: (event: string, session: CartSession | null) => void) => { data?: { subscription?: AuthSubscription } } | undefined;
  };
}

interface CartSyncEventTarget {
  navigator?: { onLine?: boolean };
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface CartSyncOptions {
  store?: CartStore;
  supabase?: CartSyncClient;
  eventTarget?: CartSyncEventTarget | null;
  debounceMs?: number;
}

export function createCartSync({ store, supabase, eventTarget = typeof window === 'undefined' ? null : window, debounceMs = 400 }: CartSyncOptions = {}) {
  let userId: string | null = null;
  let sessionGeneration = 0;
  let pendingGeneration: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let syncing = false;
  let applyingRemote = false;
  let unsubscribeStore = () => {};
  let authSubscription: AuthSubscription | null = null;

  const online = () => !eventTarget || eventTarget.navigator?.onLine !== false;
  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = async () => {
    clearTimer();
    if (!store || !supabase || !userId || !online()) return false;
    if (syncing) {
      pendingGeneration = sessionGeneration;
      return false;
    }
    const payload = store?.getSyncPayload?.();
    if (!payload) return false;
    const requestUserId = userId;
    const requestGeneration = sessionGeneration;
    if (pendingGeneration === requestGeneration) pendingGeneration = null;
    syncing = true;
    try {
      const { data, error } = await supabase.rpc('sync_cart', { p_cart: payload });
      if (error) throw error;
      if (data && userId === requestUserId && sessionGeneration === requestGeneration) {
        applyingRemote = true;
        try {
          store.applyRemoteState(data);
        } finally {
          applyingRemote = false;
        }
      }
      return true;
    } catch {
      applyingRemote = false;
      return false;
    } finally {
      syncing = false;
      if (userId && pendingGeneration === sessionGeneration) void flush();
    }
  };

  const schedule = () => {
    if (!userId) return;
    pendingGeneration = sessionGeneration;
    if (timer !== null) return;
    timer = setTimeout(() => { void flush(); }, debounceMs);
  };

  const handleSession = (session: CartSession | null | undefined) => {
    if (!store) return;
    const nextUserId = session?.user?.id || null;
    if (nextUserId === userId) return;
    sessionGeneration += 1;
    userId = nextUserId;
    if (userId) {
      store.setAuthenticatedUser(userId);
      schedule();
    } else {
      clearTimer();
      pendingGeneration = null;
      store.setAnonymousNamespace();
    }
  };

  const retry = () => { if (online()) void flush(); };

  return {
    start() {
      if (!store || !supabase) return this;
      unsubscribeStore = store.subscribe(() => { if (!applyingRemote) schedule(); });
      eventTarget?.addEventListener?.('online', retry);
      eventTarget?.addEventListener?.('focus', retry);
      const result = supabase.auth?.onAuthStateChange?.((_event, session) => handleSession(session));
      authSubscription = result?.data?.subscription || null;
      void supabase.auth?.getSession?.().then(({ data }: { data?: { session?: CartSession | null } }) => handleSession(data?.session)).catch(() => {});
      return this;
    },
    stop() {
      clearTimer();
      unsubscribeStore();
      eventTarget?.removeEventListener?.('online', retry);
      eventTarget?.removeEventListener?.('focus', retry);
      authSubscription?.unsubscribe?.();
    },
    flush,
    handleSession,
  };
}
