export const CART_STORAGE_KEY = 'flowhome-amazon-list';
export const CART_STORAGE_VERSION = 1;
export const CART_CHANGE_EVENT = 'flowhome:cart-change';

const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
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

function cleanPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : 0;
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
    if (existing) {
      existing.quantity += item.quantity;
      return;
    }
    itemsByAsin.set(item.asin, item);
  });

  return [...itemsByAsin.values()];
}

function areJsonValuesEqual(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => areJsonValuesEqual(value, right[index]));
  }

  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key, index) => key === rightKeys[index] && areJsonValuesEqual(left[key], right[key]));
}

export function parseCartPayload(rawValue) {
  if (rawValue === null || typeof rawValue === 'undefined') return { items: [], needsMigration: false, needsRepair: false };
  if (typeof rawValue !== 'string' || !rawValue) return { items: [], needsMigration: false, needsRepair: true };
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return { items: normalizeCartItems(parsed), needsMigration: true, needsRepair: false };
    if (parsed && typeof parsed === 'object' && parsed.version === CART_STORAGE_VERSION && Array.isArray(parsed.items)) {
      const items = normalizeCartItems(parsed.items);
      const canonicalPayload = { version: CART_STORAGE_VERSION, items };
      return { items, needsMigration: false, needsRepair: !areJsonValuesEqual(parsed, canonicalPayload) };
    }
  } catch {
    // Corrupt browser storage is treated as an empty cart.
  }
  return { items: [], needsMigration: false, needsRepair: true };
}

export function serializeCartPayload(items) {
  return JSON.stringify({ version: CART_STORAGE_VERSION, items: normalizeCartItems(items) });
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
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function cloneItems(items) {
  return items.map((item) => ({ ...item }));
}

export function createCartStore({ storage = null, eventTarget = null } = {}) {
  const target = eventTarget || (typeof window !== 'undefined' ? window : null);
  const persistentStorage = storage || (typeof window !== 'undefined' ? getBrowserStorage() : null);
  let memoryItems = [];
  let useMemoryFallback = false;

  const read = () => {
    if (!persistentStorage || useMemoryFallback) return cloneItems(memoryItems);
    try {
      const payload = parseCartPayload(persistentStorage.getItem(CART_STORAGE_KEY));
      memoryItems = payload.items;
      if (payload.needsMigration || payload.needsRepair) {
        try {
          persistentStorage.setItem(CART_STORAGE_KEY, serializeCartPayload(memoryItems));
        } catch {
          // Keep the normalized in-memory state if browser storage is full or unavailable.
          useMemoryFallback = true;
        }
      }
      return cloneItems(memoryItems);
    } catch {
      useMemoryFallback = true;
      return cloneItems(memoryItems);
    }
  };

  const emit = () => {
    if (!target?.dispatchEvent) return;
    try {
      const event = typeof CustomEvent === 'function'
        ? new CustomEvent(CART_CHANGE_EVENT)
        : { type: CART_CHANGE_EVENT };
      target.dispatchEvent(event);
    } catch {
      // A custom target used outside the browser may not support CustomEvent.
    }
  };

  const write = (items) => {
    memoryItems = normalizeCartItems(items);
    if (persistentStorage) {
      try {
        persistentStorage.setItem(CART_STORAGE_KEY, serializeCartPayload(memoryItems));
      } catch {
        // The in-memory cart remains usable when storage writes fail.
        useMemoryFallback = true;
      }
    }
    emit();
    return cloneItems(memoryItems);
  };

  const update = (updater) => write(updater(read()));

  return {
    initialize: read,
    getItems: read,
    add(item) {
      const normalized = normalizeCartItem(item);
      if (!normalized) return read();
      return update((items) => {
        const existing = items.find((entry) => entry.asin === normalized.asin);
        if (existing) existing.quantity += normalized.quantity;
        else items.push(normalized);
        return items;
      });
    },
    increment(asin) {
      const normalizedAsin = cleanAsin(asin);
      if (!normalizedAsin) return read();
      return update((items) => items.map((item) => item.asin === normalizedAsin ? { ...item, quantity: item.quantity + 1 } : item));
    },
    decrement(asin) {
      const normalizedAsin = cleanAsin(asin);
      if (!normalizedAsin) return read();
      return update((items) => items.flatMap((item) => {
        if (item.asin !== normalizedAsin) return [item];
        return item.quantity === 1 ? [] : [{ ...item, quantity: item.quantity - 1 }];
      }));
    },
    remove(asin) {
      const normalizedAsin = cleanAsin(asin);
      return normalizedAsin ? update((items) => items.filter((item) => item.asin !== normalizedAsin)) : read();
    },
    clear() {
      return write([]);
    },
    subscribe(listener) {
      if (typeof listener !== 'function' || !target?.addEventListener) return () => {};
      const notify = () => listener(read());
      const onStorage = (event) => {
        if (event.key === CART_STORAGE_KEY && event.storageArea === persistentStorage) notify();
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
