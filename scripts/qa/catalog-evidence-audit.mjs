import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { getIdentityRows } from '../../src/lib/product-identity.ts';
import { getInstallationEvidence } from '../../src/lib/product-installation.ts';

// Read-only audit of the built contract, not an automatic fact checker.
const root = new URL('../../', import.meta.url);
const products = new URL('src/content/products/', root);
const now = new Date();
const results = [];
for (const file of readdirSync(products).filter(name => name.endsWith('.yaml'))) {
  const product = parse(readFileSync(new URL(file, products), 'utf8'));
  assert.match(product.slug, /^[a-z0-9-]+$/);
  const html = readFileSync(new URL(`dist/product/${product.slug}/index.html`, root), 'utf8');
  const section = html.match(/<section[^>]*id="identity-evidence"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(section, `${product.slug}: missing identity section`);
  const rows = getIdentityRows(product, now);
  const blocks = section.split('data-identity-field="').slice(1);
  assert.equal(blocks.length, rows.length, `${product.slug}: field count`);
  for (const row of rows) {
    const block = blocks.find(value => value.startsWith(`${row.field}"`));
    assert.ok(block, `${product.slug}: ${row.field}`);
    if (row.claim) {
      assert.ok(block.includes('Documented:'), `${product.slug}: missing documented state`);
      assert.ok(!block.includes('Not verified for this catalog identity.'), `${product.slug}: contradictory state`);
      const plain = block.replace(/<[^>]*>/g, ' ').replace(/&(amp|lt|gt|quot|#39|#x27);/g, (_, key) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", '#x27': "'" })[key]).replace(/\s+/g, ' ');
      for (const value of [row.claim.value, row.claim.conditions]) assert.ok(plain.includes(value.replace(/\s+/g, ' ')), `${product.slug}: missing value or conditions`);
      for (const source of row.claim.sources) {
        assert.ok(block.includes(`href="${source.url.replaceAll('&', '&amp;')}"`) || block.includes(`href="${source.url}"`), `${product.slug}: missing source link`);
        assert.ok(block.includes(source.accessedAt), `${product.slug}: missing source date`);
      }
    } else {
      assert.ok(block.includes('Not verified for this catalog identity.'), `${product.slug}: unknown not explicit`);
      assert.ok(!block.includes('Documented:'), `${product.slug}: unsupported documented label`);
    }
  }
  const installation = getInstallationEvidence(product, now);
  assert.ok(installation && html.includes('id="installation-checks"'), `${product.slug}: separate installation`);
  results.push({ slug: product.slug, documented: rows.filter(row => row.claim).map(row => row.field), unknown: rows.filter(row => !row.claim).map(row => row.field), installation: installation.assessment });
}
assert.equal(results.length, 28);
console.log(JSON.stringify({ scope: 'Built identity states and source links; not semantic source verification or publication approval', products: results.length, documented: results.reduce((sum, row) => sum + row.documented.length, 0), unknown: results.reduce((sum, row) => sum + row.unknown.length, 0), results }, null, 2));
