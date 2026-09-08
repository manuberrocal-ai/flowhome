import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicConfig } from './public-config';

export const supabaseUrl = publicConfig.supabaseUrl;
export const supabaseAnonKey = publicConfig.supabaseAnonKey;
export const googleClientId = publicConfig.googleClientId;
export const isSupabaseConfigured = publicConfig.authEnabled;

declare global {
  interface Window {
    __flowhomeSupabaseClient?: SupabaseClient;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined' || !isSupabaseConfigured) return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  window.__flowhomeSupabaseClient ||= createClient(supabaseUrl, supabaseAnonKey);
  return window.__flowhomeSupabaseClient;
}
