import { readProducts, readDeals } from '../lib/content-utils.mjs';

const bad = [];
for (const item of [...readProducts(), ...readDeals()]) {
  if (!item.affiliateUrl || !item.affiliateUrl.includes('tag=flowhome-20')) bad.push({ slug: item.slug, issue: 'missing affiliate tag' });
  if (item.affiliateUrl && !item.affiliateUrl.startsWith('https://www.amazon.com/')) bad.push({ slug: item.slug, issue: 'unexpected affiliate domain' });
}
if (bad.length) { console.error(JSON.stringify(bad, null, 2)); process.exit(1); }
console.log('Affiliate link check passed.');
