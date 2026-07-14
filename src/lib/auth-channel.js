import { AUTH_CHANGE_MESSAGE_TYPE, createAuthChangeMessage } from './auth-helpers.js';

const CHANNEL_NAME = 'flowhome-auth';
const STORAGE_KEY = 'flowhome-auth-change';

function getState() {
  window.__flowhomeAuthChannelState ||= {
    callbacks: new Set(),
    initialized: false,
    channel: null,
    subscription: null,
  };
  return window.__flowhomeAuthChannelState;
}

function emit(state) {
  state.callbacks.forEach((callback) => callback());
}

function publish(state) {
  state.channel?.postMessage(createAuthChangeMessage());
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage is an optional cross-tab fallback.
  }
}

function initialize(state, client) {
  if (state.initialized) return;
  state.initialized = true;

  if ('BroadcastChannel' in window) {
    try {
      state.channel = new window.BroadcastChannel(CHANNEL_NAME);
      state.channel.onmessage = (event) => {
        if (event.data?.type === AUTH_CHANGE_MESSAGE_TYPE) emit(state);
      };
    } catch {
      // Some privacy modes expose BroadcastChannel but reject construction.
      // Storage and focus listeners below remain the safe, token-free fallback.
      state.channel = null;
    }
  }

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) emit(state);
  });
  window.addEventListener('focus', () => emit(state));

  const { data: { subscription } } = client.auth.onAuthStateChange(() => {
    emit(state);
    publish(state);
  });
  state.subscription = subscription;
}

export function subscribeToAuthChanges(client, callback) {
  const state = getState();
  initialize(state, client);
  state.callbacks.add(callback);
  return () => state.callbacks.delete(callback);
}

export function announceAuthChange() {
  const state = getState();
  publish(state);
}
