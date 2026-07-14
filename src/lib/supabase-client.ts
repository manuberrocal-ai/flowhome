import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://lbiuwknkrbyzrujarslh.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaXV3a25rcmJ5enJ1amFyc2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNTQzNDgsImV4cCI6MjA5ODYzMDM0OH0.W_sqEbR0DIthUJqRzDRktXnRlw3CHkSrWYq9xy-1MfU';

export const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
export const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
export const googleClientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || '231826717362-i9uu1ppas7i6t2ls7552n3pa41ae0me8.apps.googleusercontent.com';
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

declare global {
  interface Window {
    __flowhomeSupabaseClient?: SupabaseClient;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;

  const publicConfig = document.querySelector<HTMLElement>('[data-supabase-url]')?.dataset;
  const config = {
    url: publicConfig?.supabaseUrl || supabaseUrl,
    anonKey: publicConfig?.supabaseAnonKey || supabaseAnonKey,
  };

  if (!config.url || !config.anonKey) return null;

  window.__flowhomeSupabaseClient ||= createClient(config.url, config.anonKey);
  return window.__flowhomeSupabaseClient;
}
