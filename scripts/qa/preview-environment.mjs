// QA owns the child process; Astro's agent auto-background mode would detach it.
export function ownedPreviewEnvironment(env = process.env) {
  return { ...env, ASTRO_PREVIEW_BACKGROUND: '0' };
}
