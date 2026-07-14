export const CART_STORAGE_KEY = 'flowhome-amazon-list';
export const CART_STORAGE_VERSION = 2;
export const CART_CHANGE_EVENT = 'flowhome:cart-change';

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const USER_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
const MAX_TEXT_LENGTH = 500;
const MAX_URL_LENGTH = 2_000;

function cleanText(value, fallback = '') {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_TEXT_LENGTH) || fallback;
}

function cleanUrl(value) {
  const url = cleanText(value).slice(0, MAX_URL_LENGTH);
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
}

function cleanAsin(value) {
  const asin = cleanText(value).toUpperCase();
  return ASIN_PATTERN.test(asin) ? asin : '';
}

function cleanQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity >= 1 ? Math.floor(quantity) : 1;
}

function cleanTombstoneQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && Number.isInteger(quantity) && quantity >= 0 ? quantity : null;
}

function cleanClock(value) {
  const clock = Number(value);
  return Number.isSafeInteger(clock) && clock >= 0 ? clock : null;
}

function cleanPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function createDeviceId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function cleanDeviceId(value, fallback = '') {
  const deviceId = cleanText(value, fallback);
  return DEVICE_ID_PATTERN.test(deviceId) ? deviceId : fallback;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeCartItem(value) {
  if (!value || typeof value !== 'object') return null;
  const asin = cleanAsin(value.asin);
  if (!asin) return null;

  return {
    asin,
    quantity: cleanQuantity(value.quantity),
    slug: cleanText(value.slug),
    name: cleanText(value.name, asin),
    price: cleanPrice(value.price),
    image: cleanUrl(value.image),
    url: cleanUrl(value.url),
  };
}

export function normalizeCartItems(values) {
  if (!Array.isArray(values)) return [];
  const itemsByAsin = new Map();
  values.forEach((value) => {
    const item = normalizeCartItem(value);
    if (!item) return;
    const existing = itemsByAsin.get(item.asin);
    if (existing) existing.quantity += item.quantity;
    else itemsByAsin.set(item.asin, item);
  });
  return [...itemsByAsin.values()];
}

function normalizeEntry(value, fallbackDeviceId = '') {
  if (!value || typeof value !== 'object') return null;
  const item = normalizeCartItem({ ...value, quantity: value.quantity || 1 });
  const quantity = cleanTombstoneQuantity(value.quantity);
  const clock = cleanClock(value.clock);
  const deviceId = cleanDeviceId(value.deviceId, fallbackDeviceId);
  if (!item || quantity === null || clock === null || !deviceId) return null;
  return { ...item, quantity, clock, deviceId };
}

function compareEntries(left, right) {
  if (left.clock !== right.clock) return left.clock - right.clock;
  return left.deviceId.localeCompare(right.deviceId);
}

export function chooseCartEntry(left, right) {
  if (!left) return right ? { ...right } : null;
  if (!right) return { ...left };
  return compareEntries(left, right) >= 0 ? { ...left } : { ...right };
}

function createEmptyState(deviceId = createDeviceId()) {
  return { version: CART_STORAGE_VERSION, deviceId, clock: 0, entries: [] };
}

function normalizeState(value, fallbackDeviceId = createDeviceId()) {
  if (!value || typeof value !== 'object' || value.version !== CART_STORAGE_VERSION || !Array.isArray(value.entries)) return null;
  const deviceId = cleanDeviceId(value.deviceId, fallbackDeviceId);
  const clock = cleanClock(value.clock);
  if (!deviceId || clock === null) return null;
  const entriesByAsin = new Map();
  for (const rawEntry of value.entries) {
    const entry = normalizeEntry(rawEntry, deviceId);
    if (!entry) return null;
    entriesByAsin.set(entry.asin, chooseCartEntry(entriesByAsin.get(entry.asin), entry));
  }
  const entries = [...entriesByAsin.values()].sort((left, right) => left.asin.localeCompare(right.asin));
  return { version: CART_STORAGE_VERSION, deviceId, clock: Math.max(clock, ...entries.map((entry) => entry.clock), 0), entries };
}

function stateItems(state) {
  return state.entries.filter((entry) => entry.quantity > 0).map(({ clock, deviceId, ...item }) => item);
}

function statesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function migrateV1(items, deviceId = createDeviceId()) {
  const entries = normalizeCartItems(items).map((item, index) => ({ ...item, clock: index + 1, deviceId }));
  return { version: CART_STORAGE_VERSION, deviceId, clock: entries.length, entries };
}

export function parseCartPayload(rawValue) {
  const empty = { state: null, items: [], needsMigration: false, needsRepair: false, hasCorruptSavedList: false };
  if (rawValue === null || typeof rawValue === 'undefined') return empty;
  if (typeof rawValue !== 'string') return { ...empty, needsRepair: true };
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      const state = migrateV1(parsed);
      return { state, items: stateItems(state), needsMigration: true, needsRepair: false, hasCorruptSavedList: false };
    }
    if (parsed && typeof parsed === 'object' && parsed.version === 1 && Array.isArray(parsed.items)) {
      const state = migrateV1(parsed.items);
      return { state, items: stateItems(state), needsMigration: true, needsRepair: false, hasCorruptSavedList: false };
    }
    if (parsed && typeof parsed === 'object' && parsed.version === CART_STORAGE_VERSION) {
      const state = normalizeState(parsed);
      if (!state) return { ...empty, hasCorruptSavedList: true };
      return { state, items: stateItems(state), needsMigration: false, needsRepair: !statesEqual(parsed, state), hasCorruptSavedList: false };
    }
  } catch {
    return { ...empty, hasCorruptSavedList: true };
  }
  return { ...empty, needsRepair: true };
}

export function serializeCartPayload(items) {
  const state = migrateV1(items);
  return JSON.stringify(state);
}

export function getCartQuantity(items) {
  return normalizeCartItems(items).reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items) {
  return normalizeCartItems(items).reduce((total, item) => total + item.price * item.quantity, 0);
}

export function buildAmazonCartUrl(items, associateTag = 'flowhome-20') {
  const normalizedItems = normalizeCartItems(items);
  if (!normalizedItems.length) return null;
  const params = new URLSearchParams({ AssociateTag: cleanText(associateTag, 'flowhome-20') });
  normalizedItems.forEach((item, index) => {
    const position = index + 1;
    params.set(`ASIN.${position}`, item.asin);
    params.set(`Quantity.${position}`, String(item.quantity));
  });
  return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
}

function getBrowserStorage() {
  try { return window.localStorage; } catch { return null; }
}

function namespaceKey(namespace) {
  return namespace === 'anonymous' ? CART_STORAGE_KEY : `${CART_STORAGE_KEY}:${namespace}`;
}

function userNamespace(userId) {
  return USER_ID_PATTERN.test(String(userId)) ? `user:${userId}` : 'anonymous';
}

export function mergeCartStates(left, right) {
  const local = normalizeState(left);
  const remote = normalizeState(right);
  if (!local) return remote ? clone(remote) : null;
  if (!remote) return clone(local);
  const byAsin = new Map(local.entries.map((entry) => [entry.asin, entry]));
  remote.entries.forEach((entry) => byAsin.set(entry.asin, chooseCartEntry(byAsin.get(entry.asin), entry)));
  const entries = [...byAsin.values()].sort((a, b) => a.asin.localeCompare(b.asin));
  return { version: CART_STORAGE_VERSION, deviceId: local.deviceId, clock: Math.max(local.clock, remote.clock, ...entries.map((entry) => entry.clock), 0), entries };
}

export function createCartStore({ storage = null, eventTarget = null } = {}) {
  const target = eventTarget || (typeof window !== 'undefined' ? window : null);
  const persistentStorage = storage || (typeof window !== 'undefined' ? getBrowserStorage() : null);
  let namespace = 'anonymous';
  const memoryStates = new Map([['anonymous', createEmptyState()]]);
  let memoryState = clone(memoryStates.get('anonymous'));
  const mergedNamespaces = new Set();
  let useMemoryFallback = false;
  let hasCorruptSavedList = false;

  const getMemoryState = (requestedNamespace = namespace) => {
    const key = requestedNamespace || 'anonymous';
    if (!memoryStates.has(key)) memoryStates.set(key, createEmptyState());
    return clone(memoryStates.get(key));
  };

  const rememberState = (state, requestedNamespace = namespace) => {
    const key = requestedNamespace || 'anonymous';
    const snapshot = clone(state);
    memoryStates.set(key, snapshot);
    if (key === namespace) memoryState = clone(snapshot);
    return snapshot;
  };

  const getStorageItem = (key) => {
    if (!persistentStorage || useMemoryFallback) return null;
    try {
      return persistentStorage.getItem(key);
    } catch {
      useMemoryFallback = true;
      return null;
    }
  };

  const readState = (requestedNamespace = namespace) => {
    if (!persistentStorage || useMemoryFallback) return getMemoryState(requestedNamespace);
    try {
      const rawValue = getStorageItem(namespaceKey(requestedNamespace));
      if (rawValue === null) return getMemoryState(requestedNamespace);
      const payload = parseCartPayload(rawValue);
      hasCorruptSavedList = payload.hasCorruptSavedList;
      if (payload.hasCorruptSavedList) return null;
      const state = payload.state || createEmptyState();
      rememberState(state, requestedNamespace);
      if (payload.needsMigration || payload.needsRepair) {
        try {
          persistentStorage.setItem(namespaceKey(requestedNamespace), JSON.stringify(state));
        } catch {
          useMemoryFallback = true;
        }
      }
      return state;
    } catch {
      useMemoryFallback = true;
      return getMemoryState(requestedNamespace);
    }
  };

  const emit = () => {
    if (!target?.dispatchEvent) return;
    try {
      const event = typeof CustomEvent === 'function' ? new CustomEvent(CART_CHANGE_EVENT) : { type: CART_CHANGE_EVENT };
      target.dispatchEvent(event);
    } catch { /* A custom target may not support CustomEvent. */ }
  };

  const load = () => {
    const state = readState();
    memoryState = state || getMemoryState(namespace);
    return clone(memoryState);
  };

  const persist = (state, requestedNamespace = namespace) => {
    rememberState(state, requestedNamespace);
    let persisted = !persistentStorage || useMemoryFallback;
    if (persistentStorage && !useMemoryFallback) {
      try {
        persistentStorage.setItem(namespaceKey(requestedNamespace), JSON.stringify(state));
        persisted = true;
      } catch { useMemoryFallback = true; }
    }
    if (!persistentStorage || useMemoryFallback) persisted = true;
    if (persisted) hasCorruptSavedList = false;
    emit();
    return stateItems(state);
  };

  const mutate = (mutator) => {
    const state = load();
    if (hasCorruptSavedList) return stateItems(state);
    const next = mutator(clone(state));
    return persist(next);
  };

  const updateEntry = (state, asin, updater) => {
    const entries = new Map(state.entries.map((entry) => [entry.asin, entry]));
    const existing = entries.get(asin);
    const clock = Math.max(state.clock, ...state.entries.map((entry) => entry.clock), 0) + 1;
    const next = updater(existing, clock);
    if (next) entries.set(asin, { ...next, asin, clock, deviceId: state.deviceId });
    return { ...state, clock, entries: [...entries.values()].sort((a, b) => a.asin.localeCompare(b.asin)) };
  };

  return {
    initialize() { return stateItems(load()); },
    getItems() { return stateItems(load()); },
    getRecoveryState() { load(); return { hasCorruptSavedList }; },
    getNamespace() { return namespace; },
    getSyncPayload() {
      const state = load();
      return hasCorruptSavedList ? null : clone(state);
    },
    setAuthenticatedUser(userId) {
      const nextNamespace = userNamespace(userId);
      if (nextNamespace === 'anonymous') return this.setAnonymousNamespace();
      const markerKey = `${CART_STORAGE_KEY}:merged:${userId}`;
      const anonymousState = readState('anonymous');
      let userState = readState(nextNamespace);
      const hasMerged = mergedNamespaces.has(nextNamespace) || getStorageItem(markerKey) === '1';
      if (anonymousState && userState && !hasMerged) {
        const merged = mergeCartStates(userState, anonymousState);
        userState = merged;
        rememberState(merged, nextNamespace);
        if (persistentStorage && !useMemoryFallback) {
          try {
            persistentStorage.setItem(namespaceKey(nextNamespace), JSON.stringify(merged));
            persistentStorage.setItem(markerKey, '1');
          } catch { useMemoryFallback = true; }
        }
        mergedNamespaces.add(nextNamespace);
      }
      namespace = nextNamespace;
      memoryState = userState || getMemoryState(nextNamespace);
      rememberState(memoryState);
      hasCorruptSavedList = false;
      emit();
      return stateItems(memoryState);
    },
    setAnonymousNamespace() {
      namespace = 'anonymous';
      const state = readState(namespace);
      memoryState = state || getMemoryState(namespace);
      if (state) rememberState(state);
      emit();
      return stateItems(memoryState);
    },
    applyRemoteState(remoteState) {
      const remote = normalizeState(remoteState);
      const local = load();
      if (!remote || hasCorruptSavedList) return stateItems(local);
      const merged = mergeCartStates(local, remote);
      return persist(merged);
    },
    add(item) {
      const normalized = normalizeCartItem(item);
      if (!normalized) return this.getItems();
      return mutate((state) => updateEntry(state, normalized.asin, (existing) => ({ ...normalized, quantity: (existing?.quantity || 0) + normalized.quantity })));
    },
    increment(asin) {
      const normalizedAsin = cleanAsin(asin);
      if (!normalizedAsin) return this.getItems();
      return mutate((state) => updateEntry(state, normalizedAsin, (existing) => existing ? { ...existing, quantity: existing.quantity + 1 } : null));
    },
    decrement(asin) {
      const normalizedAsin = cleanAsin(asin);
      if (!normalizedAsin) return this.getItems();
      return mutate((state) => updateEntry(state, normalizedAsin, (existing) => existing ? { ...existing, quantity: Math.max(0, existing.quantity - 1) } : null));
    },
    remove(asin) {
      const normalizedAsin = cleanAsin(asin);
      if (!normalizedAsin) return this.getItems();
      return mutate((state) => updateEntry(state, normalizedAsin, (existing) => existing ? { ...existing, quantity: 0 } : null));
    },
    clear() {
      return mutate((state) => state.entries.filter((entry) => entry.quantity > 0).reduce((next, entry) => updateEntry(next, entry.asin, (existing) => ({ ...existing, quantity: 0 })), state));
    },
    resetCorruptSavedList() {
      const state = createEmptyState();
      persist(state);
      return !hasCorruptSavedList;
    },
    subscribe(listener) {
      if (typeof listener !== 'function' || !target?.addEventListener) return () => {};
      const notify = () => listener(this.getItems());
      const onStorage = (event) => {
        if (event.key === namespaceKey(namespace) && event.storageArea === persistentStorage) notify();
      };
      target.addEventListener(CART_CHANGE_EVENT, notify);
      target.addEventListener('storage', onStorage);
      return () => {
        target.removeEventListener(CART_CHANGE_EVENT, notify);
        target.removeEventListener('storage', onStorage);
      };
    },
  };
}

export function getCartStore() {
  if (typeof window === 'undefined') return createCartStore();
  if (!window.__flowhomeCartStore) window.__flowhomeCartStore = createCartStore();
  return window.__flowhomeCartStore;
}
