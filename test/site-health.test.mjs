import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSiteHealth, inspectHealthHtml } from '../scripts/qa/site-health.mjs';

const cta = '<a href="https://www.amazon.com/dp/B08J4C8871?tag=flowhome-20" target="_blank" rel="nofollow sponsored noopener noreferrer" data-fh-amazon-cta data-cta-position="hero">Amazon</a>';
const html = (route) => `<html><head><title>FlowHome fixture</title><link rel="canonical" href="https://flowhome.dev${route}">${route === '/cart/' ? '<meta name="robots" content="noindex,follow">' : ''}</head><body><h1>Fixture</h1>${route.startsWith('/product/') ? cta : ''}</body></html>`;
const response = (body, options = {}) => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' }, ...options });

test('health checks exactly three GET sentinels without following retailer links or redirects', async () => {
  const calls = [];
  const report = await checkSiteHealth({ origin: 'https://flowhome.dev', fetcher: async (url, options) => {
    calls.push(url);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'manual');
    assert.equal(options.credentials, 'omit');
    return response(html(new URL(url).pathname));
  } });
  assert.equal(report.status, 'passed');
  assert.equal(calls.length, 3);
  assert.ok(calls.every((url) => new URL(url).origin === 'https://flowhome.dev'));
  assert.equal(report.checks[1].ctaCount, 1);
});

test('monitor rejects unsupported origins before any request', async () => {
  let calls = 0;
  for (const origin of ['https://example.com', 'https://user:password@flowhome.dev', 'https://flowhome.dev?token=fixture', 'http://localhost:80', 'https://flowhome.dev/path', 'https://flowhome.dev:444']) {
    await assert.rejects(checkSiteHealth({ origin, fetcher: () => { calls++; } }));
  }
  assert.equal(calls, 0);
});

test('HTTP errors, large bodies and transport failures are bounded and redact raw responses', async () => {
  const results = [response('secret-fixture', { status: 302, headers: { location: 'https://example.com' } }), response('x'.repeat(512001))];
  const report = await checkSiteHealth({ origin: 'http://127.0.0.1:4321', fetcher: async () => {
    if (results.length) return results.shift();
    throw new Error('secret-fixture');
  } });
  assert.deepEqual(report.checks.map((check) => check.codes[0]), ['http_status_unexpected', 'response_too_large', 'request_failed']);
  assert.ok(!JSON.stringify(report).includes('secret-fixture'));
});

test('missing, wrong-product and script-only links fail the product sentinel', () => {
  const route = '/product/amazon-smart-thermostat/';
  const withManual = html(route).replace('</body>', '<a href="https://m.media-amazon.com/manual.pdf">Manufacturer manual</a></body>');
  assert.deepEqual(inspectHealthHtml(withManual, route), { codes: [], ctaCount: 1 });
  assert.ok(inspectHealthHtml(html(route).replace(' data-fh-amazon-cta', ''), route).codes.includes('retailer_cta_invalid'));
  assert.ok(inspectHealthHtml(html(route).replace(cta, ''), route).codes.includes('retailer_cta_missing'));
  assert.ok(inspectHealthHtml(html(route).replace('B08J4C8871', 'B000000000'), route).codes.includes('retailer_cta_invalid'));
  assert.ok(inspectHealthHtml(html(route).replace(cta, `<script>${cta}</script><!--${cta}-->`), route).codes.includes('retailer_cta_missing'));
  assert.ok(inspectHealthHtml(html('/cart/').replace('noindex,follow', 'index'), '/cart/').codes.includes('indexing_policy_mismatch'));
});
