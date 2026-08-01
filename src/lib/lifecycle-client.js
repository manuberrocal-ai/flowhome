import { normalizeLifecyclePreferences } from './lifecycle-preferences.js';

const functionError = (error) => new Error(error?.message || 'Lifecycle service is unavailable.');
const requireClient = (client) => {
  if (!client) throw new Error('A lifecycle client is required.');
  return client;
};

export async function getLifecyclePreferences(client) {
  const { data, error } = await requireClient(client).rpc('get_lifecycle_preferences');
  if (error) throw functionError(error);
  return normalizeLifecyclePreferences(data || {});
}

export async function saveLifecyclePreferences(input, client) {
  requireClient(client);
  if (input?.consent !== true) throw new Error('Explicit lifecycle consent is required.');
  const preferences = normalizeLifecyclePreferences({ ...input, consented: true });
  const { error } = await client.rpc('save_lifecycle_preferences', { p_preferences: preferences, p_consent_version: preferences.version });
  if (error) throw functionError(error);
  return preferences;
}

export async function unsubscribeLifecyclePreferences(reason = 'account', client) {
  const { error } = await requireClient(client).rpc('unsubscribe_lifecycle_preferences', { p_reason: reason });
  if (error) throw functionError(error);
  return true;
}

export async function exportLifecycleData(client) {
  const { data, error } = await requireClient(client).rpc('export_lifecycle_data');
  if (error) throw functionError(error);
  return data || { preferences: {}, consent_history: [] };
}

export async function deleteLifecycleData(client) {
  const { error } = await requireClient(client).rpc('delete_lifecycle_data');
  if (error) throw functionError(error);
  return true;
}

export async function unsubscribeLifecycleToken(token, client) {
  requireClient(client);
  if (!token) throw new Error('An unsubscribe token is required.');
  const { error } = await client.functions.invoke('lifecycle-unsubscribe', { body: { token } });
  if (error) throw functionError(error);
  return true;
}

export function consumeUnsubscribeFragment(location = window.location, history = window.history) {
  const token = new URLSearchParams(location.hash.slice(1)).get('u');
  if (token) history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  return token;
}
