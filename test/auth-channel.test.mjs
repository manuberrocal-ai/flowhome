import assert from 'node:assert/strict';
import test from 'node:test';
import {
  announceAuthChange,
  subscribeToAuthChanges,
} from '../src/lib/auth-channel.js';
import { AUTH_CHANGE_MESSAGE_TYPE } from '../src/lib/auth-helpers.js';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');

function installWindow(fakeWindow) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: fakeWindow,
    writable: true,
  });
}

function restoreWindow() {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
}

function createWindow(BroadcastChannel) {
  const listeners = new Map();
  const storageWrites = [];

  return {
    BroadcastChannel,
    storageWrites,
    localStorage: {
      setItem(key, value) {
        storageWrites.push([key, value]);
      },
    },
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || new Set();
      callbacks.add(callback);
      listeners.set(type, callbacks);
    },
    dispatch(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback(event);
    },
  };
}

function createAuthClient() {
  let onAuthStateChange;
  return {
    client: {
      auth: {
        onAuthStateChange(callback) {
          onAuthStateChange = callback;
          return { data: { subscription: {} } };
        },
      },
    },
    notifyAuthChange() {
      onAuthStateChange();
    },
  };
}

test.afterEach(() => restoreWindow());

test('keeps auth change dispatch working when BroadcastChannel construction fails', () => {
  let constructorCalls = 0;
  const fakeWindow = createWindow(class {
    constructor() {
      constructorCalls += 1;
      throw new Error('BroadcastChannel is unavailable');
    }
  });
  const { client, notifyAuthChange } = createAuthClient();
  let notifications = 0;
  installWindow(fakeWindow);

  assert.doesNotThrow(() => subscribeToAuthChanges(client, () => { notifications += 1; }));
  assert.equal(constructorCalls, 1);

  notifyAuthChange();
  fakeWindow.dispatch('storage', { key: 'flowhome-auth-change' });
  fakeWindow.dispatch('focus');

  assert.equal(notifications, 3);
  assert.deepEqual(fakeWindow.storageWrites, [['flowhome-auth-change', fakeWindow.storageWrites[0][1]]]);
  assert.match(fakeWindow.storageWrites[0][1], /^\d+$/);
});

test('broadcasts and dispatches only the token-free auth change message', () => {
  const channels = [];
  const fakeWindow = createWindow(class {
    constructor(name) {
      this.name = name;
      this.messages = [];
      channels.push(this);
    }

    postMessage(message) {
      this.messages.push(message);
    }
  });
  const { client } = createAuthClient();
  let notifications = 0;
  installWindow(fakeWindow);

  subscribeToAuthChanges(client, () => { notifications += 1; });
  channels[0].onmessage({ data: { type: AUTH_CHANGE_MESSAGE_TYPE } });
  channels[0].onmessage({ data: { type: 'unrelated-event' } });
  announceAuthChange();

  assert.equal(channels[0].name, 'flowhome-auth');
  assert.equal(notifications, 1);
  assert.deepEqual(channels[0].messages, [{ type: AUTH_CHANGE_MESSAGE_TYPE }]);
  assert.deepEqual(Object.keys(channels[0].messages[0]), ['type']);
  assert.doesNotMatch(JSON.stringify(channels[0].messages[0]), /token|email|user|session/i);
  assert.equal(fakeWindow.storageWrites[0][0], 'flowhome-auth-change');
  assert.match(fakeWindow.storageWrites[0][1], /^\d+$/);
});
