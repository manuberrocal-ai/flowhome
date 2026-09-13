const text = (env, name) => typeof env[name] === 'string' ? env[name].trim() : '';
const fail = (name, reason) => { throw new Error(`FlowHome configuration: ${name} ${reason}`); };
const referencePattern = /^[a-z0-9]{20}$/;

function flag(env, name) {
  const value = text(env, name);
  if (!['', 'true', 'false'].includes(value)) fail(name, 'must be true or false');
  return value === 'true';
}

function jwtClaims(key, name) {
  try {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) throw new Error();
    return JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
  } catch { fail(name, 'must be a publishable key or legacy anon JWT'); }
}

export function resolveEnvironment(env) {
  const environment = text(env, 'PUBLIC_APP_ENV') || 'local';
  if (!['local', 'staging', 'production'].includes(environment)) fail('PUBLIC_APP_ENV', 'must be local, staging or production');
  const authEnabled = flag(env, 'PUBLIC_AUTH_ENABLED');
  const analyticsEnabled = flag(env, 'PUBLIC_ANALYTICS_ENABLED');
  if (analyticsEnabled && environment !== 'production') fail('PUBLIC_ANALYTICS_ENABLED', 'is only permitted in production');
  if (env.RELEASE_DEPLOY_PRODUCTION === 'true' && environment !== 'production') fail('PUBLIC_APP_ENV', 'must be production for a production release');

  // PUBLIC values are browser-visible by definition, even if a feature is off.
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('PUBLIC_') || !value) continue;
    if (/SECRET|SERVICE_ROLE|PRIVATE_KEY|ACCESS_TOKEN/.test(name) || String(value).startsWith('sb_secret_')) fail(name, 'must not contain a privileged credential');
    if (String(value).startsWith('eyJ')) {
      const claims = jwtClaims(String(value), name);
      if (claims?.role !== 'anon') fail(name, 'must not contain a privileged or user JWT');
    }
  }

  const config = { environment, authEnabled, analyticsEnabled, supabaseUrl: '', supabaseAnonKey: '', supabaseProjectRef: '', googleClientId: '', gtmId: '', ga4Id: '', clarityId: '' };
  if (authEnabled) {
    const urlValue = text(env, 'PUBLIC_SUPABASE_URL');
    let url;
    try { url = new URL(urlValue); } catch { fail('PUBLIC_SUPABASE_URL', 'is required and must be a valid origin'); }
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') fail('PUBLIC_SUPABASE_URL', 'must be an origin without credentials, path or query');
    if (environment === 'local') {
      if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || !['http:', 'https:'].includes(url.protocol)) fail('PUBLIC_SUPABASE_URL', 'must use loopback in local mode');
    } else {
      const refName = `FLOWHOME_SUPABASE_${environment.toUpperCase()}_REF`;
      const expectedRef = text(env, refName);
      if (!referencePattern.test(expectedRef)) fail(refName, 'requires an explicitly reviewed project reference');
      const otherRef = text(env, environment === 'production' ? 'FLOWHOME_SUPABASE_STAGING_REF' : 'FLOWHOME_SUPABASE_PRODUCTION_REF');
      if (expectedRef === otherRef) fail(refName, 'must differ from the other hosted environment');
      if (url.protocol !== 'https:' || url.port || url.hostname !== `${expectedRef}.supabase.co`) fail('PUBLIC_SUPABASE_URL', 'does not match the selected environment project');
      config.supabaseProjectRef = expectedRef;
    }
    const publishable = text(env, 'PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    const anon = text(env, 'PUBLIC_SUPABASE_ANON_KEY');
    if (publishable && anon) fail('PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'cannot be combined with PUBLIC_SUPABASE_ANON_KEY');
    const key = publishable || anon;
    if (!key) fail('PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'or PUBLIC_SUPABASE_ANON_KEY is required when auth is enabled');
    if (!/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) {
      const claims = jwtClaims(key, 'PUBLIC_SUPABASE_ANON_KEY');
      if (claims?.role !== 'anon') fail('PUBLIC_SUPABASE_ANON_KEY', 'must have the anon role');
      if (config.supabaseProjectRef && claims.ref !== config.supabaseProjectRef) fail('PUBLIC_SUPABASE_ANON_KEY', 'does not match the selected project');
    }
    config.supabaseUrl = url.origin;
    config.supabaseAnonKey = key;
    config.googleClientId = text(env, 'PUBLIC_GOOGLE_CLIENT_ID');
    if (config.googleClientId && !/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(config.googleClientId)) fail('PUBLIC_GOOGLE_CLIENT_ID', 'is not a valid Google client ID');
  }
  if (analyticsEnabled) {
    config.gtmId = text(env, 'PUBLIC_GTM_ID');
    config.ga4Id = text(env, 'PUBLIC_GA4_ID');
    config.clarityId = text(env, 'PUBLIC_CLARITY_ID');
    if (!/^GTM-[A-Z0-9]+$/.test(config.gtmId) || /^GTM-X+$/.test(config.gtmId)) fail('PUBLIC_GTM_ID', 'requires a real container ID when analytics is enabled');
    if (!/^G-[A-Z0-9]{10}$/.test(config.ga4Id) || /^G-X+$/.test(config.ga4Id)) fail('PUBLIC_GA4_ID', 'requires the reviewed measurement ID for immediate analytics opt-out');
    if (config.clarityId && !/^[a-z0-9]+$/.test(config.clarityId)) fail('PUBLIC_CLARITY_ID', 'has an invalid format');
  }
  return Object.freeze(config);
}

export function environmentEvidence(config) {
  return { schemaVersion: 1, environment: config.environment, authEnabled: config.authEnabled, analyticsEnabled: config.analyticsEnabled, supabaseProjectRef: config.supabaseProjectRef || null };
}

export function environmentHeaders(headers, config) {
  if (!headers.includes("connect-src 'self'")) throw new Error('FlowHome configuration: missing CSP connection directive');
  if (/https?:\/\/[^\s;]+\.supabase\.co/.test(headers)) throw new Error('FlowHome configuration: static CSP must not select a Supabase project');
  const connection = config.authEnabled ? ` ${config.supabaseUrl}` : '';
  return headers.replace("connect-src 'self'", `connect-src 'self'${connection}`)
    + (config.environment === 'staging' ? '\n/*\n  X-Robots-Tag: noindex, nofollow\n' : '');
}
