// Official REST contract checked 2026-09-04. No scraping, persistent token cache,
// arbitrary endpoint, raw-response logging or production publication here.
const TOKEN_ENDPOINTS = Object.freeze({
  '3.1': 'https://api.amazon.com/auth/o2/token',
  '3.2': 'https://api.amazon.co.uk/auth/o2/token',
  '3.3': 'https://api.amazon.co.jp/auth/o2/token',
});
const CATALOG = 'https://creatorsapi.amazon/catalog/v1/';
export const ASIN_PATTERN = /^[A-Z0-9]{10}$/;
const RESOURCES = ['itemInfo.title', 'parentASIN', 'offersV2.listings.price',
  'offersV2.listings.condition', 'offersV2.listings.availability',
  'offersV2.listings.dealDetails', 'offersV2.listings.isBuyBoxWinner'];
const validBrowseNode = (value) => typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
const validPage = (value) => Number.isInteger(value) && value >= 1 && value <= 10;

export class AmazonApiError extends Error {
  constructor(code, status = 0) {
    super(code); // Never include provider body, credentials or an echoed request.
    this.name = 'AmazonApiError';
    this.code = code;
    this.status = status;
  }
}

export function amazonConfiguration(env = process.env) {
  const keys = ['AMAZON_CREATORS_CLIENT_ID', 'AMAZON_CREATORS_CLIENT_SECRET', 'AMAZON_CREATORS_VERSION', 'AMAZON_PARTNER_TAG'];
  const missing = keys.filter((key) => !env[key] || /^(SERVER_ONLY|Unknown|REPLACE_ME)$/i.test(env[key]));
  if (missing.length) return { status: 'not_configured', missing };
  if (!TOKEN_ENDPOINTS[env.AMAZON_CREATORS_VERSION]) return { status: 'invalid_configuration', reason: 'unsupported_credential_version' };
  // The current catalog/site is US/USD. Additional marketplaces need an explicit
  // currency, partner-tag and localization mapping before activation.
  if ((env.AMAZON_MARKETPLACE || 'www.amazon.com') !== 'www.amazon.com') return { status: 'invalid_configuration', reason: 'unsupported_marketplace' };
  if (!/^[a-zA-Z0-9-]+-20$/.test(env.AMAZON_PARTNER_TAG)) return { status: 'invalid_configuration', reason: 'invalid_us_partner_tag' };
  return { status: 'configured', config: {
    clientId: env.AMAZON_CREATORS_CLIENT_ID, clientSecret: env.AMAZON_CREATORS_CLIENT_SECRET,
    tokenEndpoint: TOKEN_ENDPOINTS[env.AMAZON_CREATORS_VERSION],
    marketplace: 'www.amazon.com', partnerTag: env.AMAZON_PARTNER_TAG,
  } };
}

export function retryDelay(value, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Number.isFinite(delay) && delay >= 0 ? delay : null;
}

export function createAmazonClient(config, {
  fetchImpl = fetch, clock = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  timeoutMs = 15000, minIntervalMs = 1100, maxAttempts = 3, maxRequests = 20,
} = {}) {
  if (!Object.values(TOKEN_ENDPOINTS).includes(config.tokenEndpoint) || config.marketplace !== 'www.amazon.com') throw new AmazonApiError('invalid_configuration');
  if (!Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 100 || !Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5 || !Number.isFinite(minIntervalMs) || minIntervalMs < 0 || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new AmazonApiError('invalid_limits');
  let token;
  let tokenExpires = 0;
  let lastRequest = -Infinity;
  let requests = 0;
  let deferredUntil = 0;
  let catalogTail = Promise.resolve();
  async function request(url, payload, authenticated) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (clock() < deferredUntil) throw new AmazonApiError('retry_deferred', 429);
      if (requests >= maxRequests) throw new AmazonApiError('request_budget_exhausted');
      if (authenticated && (!token || clock() >= tokenExpires)) {
        const auth = await request(config.tokenEndpoint, { grant_type: 'client_credentials', client_id: config.clientId, client_secret: config.clientSecret, scope: 'creatorsapi::default' }, false);
        if (typeof auth.access_token !== 'string' || !auth.access_token || !Number.isFinite(auth.expires_in) || auth.expires_in <= 60) throw new AmazonApiError('invalid_token_response');
        token = auth.access_token;
        tokenExpires = clock() + Math.min(auth.expires_in - 60, 3540) * 1000;
      }
      if (requests >= maxRequests) throw new AmazonApiError('request_budget_exhausted');
      const pause = minIntervalMs - (clock() - lastRequest);
      if (pause > 0) await sleep(pause);
      lastRequest = clock();
      requests += 1;
      let response;
      try {
        response = await fetchImpl(url, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Agent/FlowHomeCatalogReview',
            ...(authenticated ? { Authorization: `Bearer ${token}`, 'x-marketplace': config.marketplace } : {}) },
          body: JSON.stringify(payload),
        });
      } catch {
        if (attempt + 1 < maxAttempts) { await sleep(500 * 2 ** attempt); continue; }
        throw new AmazonApiError('network_or_timeout');
      }
      if (response.status === 401 && authenticated && attempt + 1 < maxAttempts) { token = undefined; continue; }
      if ([429, 500, 502, 503, 504].includes(response.status)) {
        const delay = retryDelay(response.headers.get('retry-after'), clock()) ?? 500 * 2 ** attempt;
        // Never retry earlier than Retry-After. Long delays are deferred to a
        // future run instead of keeping a worker alive or violating a quota.
        deferredUntil = clock() + delay;
        if (delay > 30000) throw new AmazonApiError('retry_deferred', response.status);
        if (attempt + 1 < maxAttempts) { await sleep(delay); continue; }
      }
      if (!response.ok) throw new AmazonApiError('http_error', response.status);
      try { return await response.json(); } catch { throw new AmazonApiError('invalid_json'); }
    }
    throw new AmazonApiError('attempts_exhausted');
  }
  async function catalogRequest(operation, input, resources) {
    const payload = { ...input, marketplace: config.marketplace, partnerTag: config.partnerTag, resources };
    if (Buffer.byteLength(JSON.stringify(payload)) > 40000) throw new AmazonApiError('request_too_large');
    const response = await request(`${CATALOG}${operation}`, payload, true);
    if (operation === 'getBrowseNodes') {
      const nodes = response?.browseNodesResult?.browseNodes;
      if (!Array.isArray(nodes)) throw new AmazonApiError('invalid_catalog_response');
      return { nodes, partialErrors: Array.isArray(response.errors) ? response.errors.length : 0 };
    }
    // Official examples currently contain both itemResults and itemsResult.
    const container = operation === 'getVariations' ? response?.variationsResult : operation === 'searchItems' ? response?.searchResult : response?.itemsResult ?? response?.itemResults;
    const items = container?.items;
    if (!Array.isArray(items)) {
      if (Array.isArray(response?.errors) && response.errors.length) throw new AmazonApiError('item_lookup_failed');
      throw new AmazonApiError('invalid_catalog_response');
    }
    return { items, partialErrors: Array.isArray(response.errors) ? response.errors.length : 0,
      ...(operation === 'getVariations' ? { pageCount: Number.isSafeInteger(container?.variationSummary?.pageCount) && container.variationSummary.pageCount > 0 ? container.variationSummary.pageCount : null } : {}) };
  }
  function catalog(operation, input, resources = RESOURCES) {
    // A shared client serializes callers so token, spacing and quota remain valid.
    const pending = catalogTail.then(() => catalogRequest(operation, input, resources));
    catalogTail = pending.catch(() => undefined);
    return pending;
  }
  return {
    getItems(itemIds) {
      if (!Array.isArray(itemIds) || !itemIds.length || itemIds.length > 10 || itemIds.some((id) => typeof id !== 'string' || !ASIN_PATTERN.test(id))) throw new AmazonApiError('invalid_item_ids');
      return catalog('getItems', { itemIds: [...new Set(itemIds)], itemIdType: 'ASIN', condition: 'New' });
    },
    searchItems(keywords, { page = 1, browseNodeId } = {}) {
      if (typeof keywords !== 'string' || !keywords.trim() || keywords.length > 120) throw new AmazonApiError('invalid_keywords');
      if (!validPage(page) || (browseNodeId !== undefined && !validBrowseNode(browseNodeId))) throw new AmazonApiError('invalid_search_scope');
      return catalog('searchItems', { keywords: keywords.trim(), searchIndex: 'All', itemCount: 10, itemPage: page, condition: 'New', ...(browseNodeId ? { browseNodeId } : {}) });
    },
    getVariations(asin, { page = 1 } = {}) {
      if (typeof asin !== 'string' || !ASIN_PATTERN.test(asin) || !validPage(page)) throw new AmazonApiError('invalid_variation_scope');
      return catalog('getVariations', { asin, variationCount: 10, variationPage: page, condition: 'New' }, [...RESOURCES, 'itemInfo.productInfo', 'variationSummary.variationDimension']);
    },
    getBrowseNodes(browseNodeIds) {
      if (!Array.isArray(browseNodeIds) || !browseNodeIds.length || browseNodeIds.length > 10 || browseNodeIds.some((id) => !validBrowseNode(id))) throw new AmazonApiError('invalid_browse_node_ids');
      return catalog('getBrowseNodes', { browseNodeIds: [...new Set(browseNodeIds)] }, ['browseNodes.ancestor', 'browseNodes.children']);
    },
  };
}
