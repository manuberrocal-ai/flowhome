import { readDeals, writeText } from '../lib/content-utils.mjs';

const now = new Date();
const deals = readDeals();
const active = deals.filter((d) => new Date(d.endDate) >= now);
const expiring = active.filter((d) => (new Date(d.endDate) - now) / 86400000 <= 3);
writeText('data/deal-report.json', JSON.stringify({ generatedAt: now.toISOString(), active: active.length, expiring }, null, 2));
console.log(`Active deals: ${active.length}. Expiring within 3 days: ${expiring.length}.`);
