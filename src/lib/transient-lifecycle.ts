/** Shared lifecycle binding. Never fetches or restores a discarded value. */
export function bindTransientLifecycle(client: { setPermitted(value: boolean): void; dispose(): void }, doc: Document, win: Window) {
  let pageHidden = false;
  let frozen = false;
  let disposed = false;
  const sync = () => {
    if (!disposed) client.setPermitted(!pageHidden && !frozen && doc.visibilityState === 'visible' && win.navigator.onLine === true);
  };
  const freeze = () => { frozen = true; sync(); };
  const resume = () => { frozen = false; sync(); };
  const hide = () => { pageHidden = true; sync(); };
  const show = () => { pageHidden = false; sync(); };
  doc.addEventListener('visibilitychange', sync);
  doc.addEventListener('freeze', freeze);
  doc.addEventListener('resume', resume);
  win.addEventListener('pagehide', hide);
  win.addEventListener('pageshow', show);
  win.addEventListener('offline', sync);
  win.addEventListener('online', sync);
  sync();
  return () => {
    if (disposed) return;
    disposed = true;
    doc.removeEventListener('visibilitychange', sync);
    doc.removeEventListener('freeze', freeze);
    doc.removeEventListener('resume', resume);
    win.removeEventListener('pagehide', hide);
    win.removeEventListener('pageshow', show);
    win.removeEventListener('offline', sync);
    win.removeEventListener('online', sync);
    client.dispose();
  };
}
