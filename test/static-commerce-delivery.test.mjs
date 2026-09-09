import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { build } from 'vite';
import { COMMERCIAL_DATA_POLICY } from '../src/lib/commercial-policy.ts';
import { flowhomeEnvironment } from '../scripts/config/astro-environment.mjs';

const now = '2026-09-06T12:00:00Z';
const fresh = Object.freeze({
  asin: 'B012345678', affiliateUrl: 'https://www.amazon.com/dp/B012345678?tag=flowhome-20',
  price: 9876.54, originalPrice: 19753.08, discountPct: 50,
  priceSource: 'amazon-creators-api', priceLastChecked: '2026-09-06T11:00:00Z',
  availabilityStatus: 'in-stock', availabilitySource: 'amazon-creators-api', availabilityLastChecked: '2026-09-06T11:00:00Z',
  ownerRating: 4.9, ownerRatingCount: 987654,
  ratingSource: 'amazon-creators-api', ratingLastChecked: '2026-09-06T11:00:00Z',
});

function projection(staticDelivery) {
  const source = readFileSync(new URL('../src/lib/commerce-data.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const context = { exports: {}, URL, require: () => ({ COMMERCIAL_DATA_POLICY }) };
  if (staticDelivery !== undefined) context.__FLOWHOME_STATIC_COMMERCE__ = staticDelivery;
  vm.runInNewContext(compiled, context);
  return context.exports.getCommerceData(fresh, now);
}

test('static delivery omits even fresh API observations without mutating the catalog', () => {
  const result = projection(true);
  for (const field of ['displayPrice', 'displayOriginalPrice', 'displayDiscountPct', 'displayRating', 'displayRatingCount', 'availability', 'priceCapturedAt', 'priceExpiresAt', 'ratingCapturedAt', 'ratingExpiresAt', 'availabilityExpiresAt']) {
    assert.equal(result[field], undefined, field);
  }
  for (const field of ['hasOffer', 'showPromotion', 'isPriceFresh', 'isRatingFresh', 'isAvailabilityFresh']) assert.equal(result[field], false, field);
  assert.equal(result.priceLabel, 'Check price on Amazon');
  assert.equal(fresh.price, 9876.54);
  assert.ok(!JSON.stringify(result).includes('9876'));
});

test('unbundled observation policy remains testable, not proof of serving authorization', () => {
  assert.equal(projection(undefined).displayPrice, 9876.54);
  assert.equal(projection(undefined).hasOffer, true);
});

test('Astro defines static delivery unconditionally, independently of environment flags', () => {
  let plugin;
  flowhomeEnvironment().hooks['astro:config:setup']({ updateConfig: (config) => { plugin = config.vite.plugins[0]; } });
  const config = plugin.config({ root: fileURLToPath(new URL('../', import.meta.url)) }, { mode: 'test' });
  assert.equal(config.define.__FLOWHOME_STATIC_COMMERCE__, true);
  assert.equal(config.define.__FLOWHOME_STATIC_COMPATIBILITY__, true);
});

test('the real bundler omits fresh commercial data from rendered payload and Product schema', async () => {
  let environmentPlugin;
  flowhomeEnvironment().hooks['astro:config:setup']({ updateConfig: (config) => { environmentPlugin = config.vite.plugins[0]; } });
  const root = fileURLToPath(new URL('../', import.meta.url));
  const { define } = environmentPlugin.config({ root }, { mode: 'test' });
  const entry = 'virtual:static-commerce-probe';
  const artifact = await build({
    root, configFile: false, logLevel: 'silent', define,
    plugins: [{
      name: 'static-commerce-probe',
      resolveId: (id) => id === entry ? `\0${entry}` : undefined,
      load: (id) => id === `\0${entry}` ? `
        import { getCommerceData } from '/src/lib/commerce-data.ts';
        import { generateProductSchema } from '/src/lib/seo.ts';
        export function render(product, now) {
          return JSON.stringify({ payload: getCommerceData(product, now), schema: generateProductSchema(product, new Date(now)) });
        }
      ` : undefined,
    }],
    build: { ssr: true, write: false, rollupOptions: { input: entry } },
  });
  const chunks = artifact.output.filter((output) => output.type === 'chunk');
  assert.equal(chunks.length, 1);
  const compiled = await import(`data:text/javascript;base64,${Buffer.from(chunks[0].code).toString('base64')}`);
  const htmlPayload = compiled.render({ ...fresh, name: 'Synthetic product', slug: 'synthetic-product' }, now);
  const result = JSON.parse(htmlPayload);
  assert.equal(result.schema['@type'], 'Product');
  assert.equal(result.schema.offers, undefined);
  assert.equal(result.payload.displayPrice, undefined);
  assert.equal(result.payload.displayRating, undefined);
  assert.equal(result.payload.availability, undefined);
  assert.ok(!htmlPayload.includes('9876'));
  assert.equal(result.payload.priceLabel, 'Check price on Amazon');
});
