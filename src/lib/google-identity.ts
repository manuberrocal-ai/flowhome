import { googleClientId } from './supabase-client';

export interface GoogleCredentialResponse {
  credential?: string;
}

type CredentialHandler = (response: GoogleCredentialResponse) => void | Promise<void>;

interface GoogleIdentityState {
  handlers: Map<string, CredentialHandler>;
  activeHandlerId: string | null;
  initialized: boolean;
  loadPromise?: Promise<void>;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (configuration: Record<string, unknown>) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
    __flowhomeGoogleIdentityState?: GoogleIdentityState;
  }
}

function getState(): GoogleIdentityState {
  window.__flowhomeGoogleIdentityState ||= {
    handlers: new Map(),
    activeHandlerId: null,
    initialized: false,
  };
  return window.__flowhomeGoogleIdentityState;
}

function loadGoogleIdentity(): Promise<void> {
  const state = getState();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (state.loadPromise) return state.loadPromise;

  state.loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not be loaded.'));
    document.head.appendChild(script);
  });
  state.loadPromise.catch(() => {
    state.loadPromise = undefined;
  });

  return state.loadPromise;
}

export async function registerGoogleCredentialHandler(id: string, handler: CredentialHandler) {
  const state = getState();
  state.handlers.set(id, handler);
  if (!state.activeHandlerId) state.activeHandlerId = id;

  await loadGoogleIdentity();
  const google = window.google;
  if (!google?.accounts?.id) throw new Error('Google sign-in is unavailable.');

  if (!state.initialized) {
    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: 'popup',
        callback: (response: GoogleCredentialResponse) => {
          const activeHandler = state.activeHandlerId ? state.handlers.get(state.activeHandlerId) : undefined;
          void activeHandler?.(response);
        },
      });
      state.initialized = true;
    } catch (error) {
      state.loadPromise = undefined;
      throw error;
    }
  }

  return {
    activate: () => {
      state.activeHandlerId = id;
    },
    deactivate: () => {
      if (state.activeHandlerId !== id) return;
      state.activeHandlerId = [...state.handlers.keys()].find((handlerId) => handlerId !== id) || id;
    },
    renderButton: (container: HTMLElement) => {
      container.replaceChildren();
      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.max(240, Math.floor(container.getBoundingClientRect().width) || 320),
      });
    },
  };
}
