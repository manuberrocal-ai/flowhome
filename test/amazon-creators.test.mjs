import test from 'node:test';
import assert from 'node:assert/strict';
import { amazonConfiguration, createAmazonClient, retryDelay } from '../scripts/lib/amazon-creators.mjs';

const environment = { AMAZON_CREATORS_CLIENT_ID: 'fixture-id', AMAZON_CREATORS_CLIENT_SECRET: 'fixture-secret', AMAZON_CREATORS_VERSION: '3.1', AMAZON_PARTNER_TAG: 'fixture-20' };
const config = amazonConfiguration(environment).config;
const token = () => Response.json({ access_token: 'fixture-token', expires_in: 3600 });
const item = { asin: 'B000000001' };
function setup(responses, options = {}) {
  const requests = [];
  const pauses = [];
  let time = Date.parse('2026-09-04T12:00:00Z');
  const client = createAmazonClient(config, { minIntervalMs: 0, clock: () => time,
    sleep: async (ms) => { pauses.push(ms); time += ms; },
    fetchImpl: async (url, request) => { requests.push({ url, ...request }); const response = responses.shift(); if (response instanceof Error) throw response; return response; }, ...options });
  return { client, requests, pauses };
}
test('configuration fails closed without secrets and rejects unknown endpoints/marketplaces', () => {
  assert.equal(amazonConfiguration({}).status, 'not_configured');
  assert.equal(amazonConfiguration({ ...environment, AMAZON_MARKETPLACE: 'evil.example' }).status, 'invalid_configuration');
  assert.equal(amazonConfiguration({ ...environment, AMAZON_CREATORS_VERSION: '9' }).status, 'invalid_configuration');
  assert.throws(() => createAmazonClient({ ...config, tokenEndpoint: 'https://evil.example' }), /invalid_configuration/);
});
test('official OAuth and catalog requests, shared token and partial response', async () => {
  const { client, requests } = setup([token(), Response.json({ itemResults: { items: [item] }, errors: [{ code: 'ItemNotAccessible' }] }), Response.json({ searchResult: { items: [item] } })]);
  assert.equal((await client.getItems([item.asin])).partialErrors, 1);
  await client.searchItems('smart home thermostat');
  assert.equal(requests.length, 3);
  assert.equal(requests[0].url, 'https://api.amazon.com/auth/o2/token');
  assert.equal(JSON.parse(requests[0].body).scope, 'creatorsapi::default');
  assert.equal(requests[1].headers.Authorization, 'Bearer fixture-token');
  assert.equal(requests[1].headers['x-marketplace'], 'www.amazon.com');
  assert.equal(requests[1].headers['User-Agent'], 'Agent/FlowHomeCatalogReview');
  assert.equal(requests[1].redirect, 'error');
  assert.equal(JSON.parse(requests[1].body).partnerTag, 'fixture-20');
  assert.equal(requests[2].url, 'https://creatorsapi.amazon/catalog/v1/searchItems');
});
test('rate limit obeys Retry-After and long delays are deferred, not shortened', async () => {
  const { client, pauses } = setup([token(), new Response('', { status: 429, headers: { 'retry-after': '3' } }), Response.json({ itemsResult: { items: [] } })]);
  await client.getItems([item.asin]);
  assert.ok(pauses.includes(3000));
  const deferred = setup([token(), new Response('', { status: 429, headers: { 'retry-after': '120' } })]);
  await assert.rejects(deferred.client.getItems([item.asin]), /retry_deferred/);
  const calls = deferred.requests.length;
  await assert.rejects(deferred.client.searchItems('smart home'), /retry_deferred/);
  assert.equal(deferred.requests.length, calls);
  assert.equal(retryDelay('Fri, 04 Sep 2026 12:00:05 GMT', Date.parse('2026-09-04T12:00:00Z')), 5000);
});
test('unauthorized catalog refreshes token once; invalid JSON is sanitized', async () => {
  const { client } = setup([token(), new Response('', { status: 401 }), token(), new Response('fixture-secret', { status: 200 })]);
  await assert.rejects(client.getItems([item.asin]), (error) => error.code === 'invalid_json' && !error.message.includes('fixture-secret'));
});
test('Retry-After on the final attempt still blocks the next catalog operation', async () => {
  const { client, requests } = setup([token(), new Response('', { status: 503 }), new Response('', { status: 503 }), new Response('', { status: 429, headers: { 'retry-after': '120' } })]);
  await assert.rejects(client.getItems([item.asin]), /retry_deferred/);
  await assert.rejects(client.searchItems('smart home'), /retry_deferred/);
  assert.equal(requests.length, 4);
});
test('bounded outage retries, request quota, ID validation and malformed responses', async () => {
  const outage = setup([token(), new Response('', { status: 503 }), new Response('', { status: 503 }), new Response('', { status: 503 })]);
  await assert.rejects(outage.client.getItems([item.asin]), /http_error/);
  assert.equal(outage.requests.length, 4);
  const quota = setup([token()], { maxRequests: 1 });
  await assert.rejects(quota.client.getItems([item.asin]), /request_budget_exhausted/);
  assert.throws(() => quota.client.getItems(['invalid']), /invalid_item_ids/);
  const malformed = setup([token(), Response.json({ unexpected: [] })]);
  await assert.rejects(malformed.client.getItems([item.asin]), /invalid_catalog_response/);
});

test('variation, browse node and scoped search contracts preserve explicit page boundaries', async () => {
  const { client, requests } = setup([token(),
    Response.json({ variationsResult: { items: [item], variationSummary: { pageCount: 2 } } }),
    Response.json({ browseNodesResult: { browseNodes: [{ id: '3040' }] }, errors: [{ code: 'fixture-partial' }] }),
    Response.json({ searchResult: { items: [] } }),
  ]);
  assert.equal((await client.getVariations(item.asin, { page: 2 })).pageCount, 2);
  assert.equal((await client.getBrowseNodes(['3040'])).partialErrors, 1);
  await client.searchItems('smart lighting', { page: 2, browseNodeId: '3040' });
  assert.equal(requests[1].url, 'https://creatorsapi.amazon/catalog/v1/getVariations');
  assert.equal(JSON.parse(requests[1].body).variationPage, 2);
  assert.deepEqual(JSON.parse(requests[2].body).resources, ['browseNodes.ancestor', 'browseNodes.children']);
  assert.equal(JSON.parse(requests[3].body).browseNodeId, '3040');
  assert.equal(JSON.parse(requests[3].body).itemPage, 2);
  for (const id of ['0', '-1', '9223372036854775808', '1e3', 3040]) assert.throws(() => client.getBrowseNodes([id]), /invalid_browse_node_ids/);
  for (const page of [0, 11, 1.5, '2']) assert.throws(() => client.getVariations(item.asin, { page }), /invalid_variation_scope/);
  assert.throws(() => client.searchItems('smart', { browseNodeId: 'invalid' }), /invalid_search_scope/);
});

test('concurrent callers share one token and respect the total request budget', async () => {
  const { client, requests } = setup([token(), Response.json({ itemResults: { items: [] } })], { maxRequests: 2 });
  const results = await Promise.allSettled([client.getItems([item.asin]), client.searchItems('smart')]);
  assert.equal(results[0].status, 'fulfilled');
  assert.equal(results[1].reason.code, 'request_budget_exhausted');
  assert.equal(requests.length, 2);
  assert.throws(() => createAmazonClient(config, { maxRequests: Infinity }), /invalid_limits/);
});
