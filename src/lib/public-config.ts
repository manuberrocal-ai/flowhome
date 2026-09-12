declare const __FLOWHOME_PUBLIC_CONFIG__: Readonly<{
  environment: 'local' | 'staging' | 'production';
  authEnabled: boolean;
  analyticsEnabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseProjectRef: string;
  googleClientId: string;
  gtmId: string;
  ga4Id: string;
  clarityId: string;
}>;

// Replaced by the build only after validation; never read configuration from DOM attributes.
export const publicConfig = __FLOWHOME_PUBLIC_CONFIG__;
