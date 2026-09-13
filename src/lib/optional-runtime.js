/** Disabled services must not download or initialize their optional runtime. */
export async function initializeOptionalRuntime(config, loaders) {
  if (!config.analyticsEnabled) return { analytics: 'disabled', experiments: 'disabled' };
  try {
    const { setupAnalytics } = await loaders.analytics();
    setupAnalytics({ gtmId: config.gtmId, ga4Id: config.ga4Id, clarityId: config.clarityId });
  } catch {
    return { analytics: 'unavailable', experiments: 'disabled' };
  }
  if (!config.experimentsEnabled) return { analytics: 'ready', experiments: 'disabled' };
  try {
    const { setupExperiments } = await loaders.experiments();
    setupExperiments();
    return { analytics: 'ready', experiments: 'ready' };
  } catch {
    return { analytics: 'ready', experiments: 'unavailable' };
  }
}
