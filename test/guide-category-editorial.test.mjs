import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { generateBreadcrumbSchema, generateItemListSchema } from '../src/lib/seo.ts';
import { getEditorialMetadata, getEvidenceLevel, EDITORIAL_TEAM } from '../src/lib/editorial.ts';

const pages = {
  guide: await readFile(new URL('../src/pages/best/[slug].astro', import.meta.url), 'utf8'),
  category: await readFile(new URL('../src/pages/category/[slug].astro', import.meta.url), 'utf8'),
};

// Execute each real template's data preparation with isolated collection fixtures.
// Markup contracts below also ensure that the computed data reaches visible HTML and JSON-LD.
async function preparePage(kind, props, collections = {}) {
  const source = pages[kind].match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/)[1]
    .replace(/^import .+;\r?$/gm, '')
    .replace(/export async function getStaticPaths\(\) \{[\s\S]*?^\}/m, '');
  const script = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const keys = ['Astro', 'getCollection', 'generateBreadcrumbSchema', 'generateItemListSchema', 'getEditorialMetadata', 'getEvidenceLevel', 'EDITORIAL_TEAM'];
  const values = [{ props }, async (name) => collections[name] ?? [], generateBreadcrumbSchema, generateItemListSchema, getEditorialMetadata, getEvidenceLevel, EDITORIAL_TEAM];
  const returned = kind === 'guide'
    ? '{ canonicalURL, breadcrumbItems, breadcrumbSchema, itemListSchema, selected, editorial, evidenceLabel, publicationDate, publicationLabel }'
    : '{ canonicalURL, breadcrumbItems, breadcrumbSchema, itemListSchema, products }';
  return new AsyncFunction(...keys, `${script}\nreturn ${returned};`)(...values);
}

const product = (slug, overrides = {}) => ({ data: { slug, name: `Product ${slug}`, category: 'smart-hub', catalogActive: true, ownerRating: 4, ownerRatingCount: 100, ...overrides } });
const guide = (overrides = {}) => ({ list: { data: { slug: 'test-guide', title: 'Test buying guide', category: 'smart-hub', productSlugs: ['beta', 'alpha'], pubDate: new Date('2026-06-28T00:00:00Z'), ...overrides } } });

test('guide breadcrumbs and ItemList preserve visible selection order and canonical destinations', async () => {
  const result = await preparePage('guide', guide(), { products: [product('alpha'), product('beta')] });
  assert.equal(result.canonicalURL, 'https://flowhome.dev/best/test-guide/');
  assert.deepEqual(result.breadcrumbSchema.itemListElement.map((item) => [item.name, item.item]), result.breadcrumbItems.map((item) => [item.name, item.url]));
  assert.deepEqual(result.breadcrumbItems.map((item) => item.href), ['/', '/best/', undefined]);
  assert.deepEqual(result.itemListSchema.itemListElement.map((item) => item.name), result.selected.map((entry) => entry.data.name));
  assert.deepEqual(result.itemListSchema.itemListElement.map((item) => item.position), [1, 2]);
});

test('guide sources use only recorded HTTPS references and never infer current verification', async () => {
  const result = await preparePage('guide', guide({ buyingConsiderations: [{ label: 'Source', detail: 'Recorded at https://vendor.example/product. Again https://vendor.example/product; untrusted http://vendor.example/insecure and javascript:alert(1).' }] }), { products: [product('alpha')] });
  assert.deepEqual(result.editorial.sources, [{ label: 'https://vendor.example/product', url: 'https://vendor.example/product' }]);
  assert.equal(result.editorial.author, EDITORIAL_TEAM);
  assert.equal(result.editorial.humanReviewedDate, undefined);
  assert.equal(result.evidenceLabel, 'data evaluated');
  assert.equal(result.publicationLabel, 'June 28, 2026');
  assert.equal(result.publicationDate.toISOString(), '2026-06-28T00:00:00.000Z');
});

test('guide missing sources, products, and publication date stay explicitly unverified', async () => {
  const result = await preparePage('guide', guide({ pubDate: undefined }));
  assert.deepEqual(result.editorial.sources, []);
  assert.equal(result.evidenceLabel, 'not verified');
  assert.equal(result.publicationDate, undefined);
  assert.equal(result.publicationLabel, undefined);
  assert.deepEqual(result.itemListSchema.itemListElement, []);
  const invalid = await preparePage('guide', guide({ pubDate: new Date('invalid') }));
  assert.equal(invalid.publicationDate, undefined);
});

test('structured guide references preserve documentation access dates without creating a human review', async () => {
  const reference = { label: 'Manufacturer compatibility notes', url: 'https://vendor.example/product', accessedAt: '2026-09-04' };
  const result = await preparePage('guide', guide({ sources: [reference], intro: 'Reference: https://vendor.example/product.' }));
  assert.deepEqual(result.editorial.sources, [reference]);
  assert.equal(result.editorial.humanReviewedDate, undefined);
  assert.equal(result.publicationLabel, 'June 28, 2026');
  assert.match(pages.guide, /documentation accessed \{source\.accessedAt\}/);
});

test('category structured list contains only rendered active category products', async () => {
  const result = await preparePage('category', { category: { data: { slug: 'smart-hub', name: 'Smart hubs' } } }, { products: [product('alpha'), product('beta', { ownerRating: 5 }), product('inactive', { catalogActive: false }), product('other', { category: 'smart-lock' })] });
  assert.equal(result.canonicalURL, 'https://flowhome.dev/category/smart-hub/');
  assert.deepEqual(result.breadcrumbItems.map((item) => item.href), ['/', '/products/', undefined]);
  assert.deepEqual(result.breadcrumbSchema.itemListElement.map((item) => item.item), result.breadcrumbItems.map((item) => item.url));
  assert.deepEqual(result.itemListSchema.itemListElement.map((item) => item.name), ['Product beta', 'Product alpha']);
});

test('both templates render shared breadcrumb data and serialize only visible product lists', () => {
  for (const [kind, page] of Object.entries(pages)) {
    assert.match(page, /<Breadcrumbs items=\{breadcrumbItems\.map\(\(\{ name, href \}\) => \(\{ name, href \}\)\)\} \/>/);
    assert.match(page, /set:html=\{serializeJsonLd\(breadcrumbSchema\)\}/);
    assert.match(page, /canonicalURL=\{canonicalURL\}/);
    const collection = kind === 'guide' ? 'selected' : 'products';
    assert.match(page, new RegExp(`\\{${collection}\\.length > 0 && <script[^>]+set:html=\\{serializeJsonLd\\(itemListSchema\\)\\}`));
    assert.match(page, new RegExp(`${collection}\\.map\\(\\(product\\) => <ProductCard product=\\{product\\}`));
  }
  assert.match(pages.guide, /href=\{editorial\.author\.profileUrl\}/);
  assert.match(pages.guide, /<time datetime=\{publicationDate\.toISOString\(\)\}>\{publicationLabel\}<\/time>/);
  assert.match(pages.guide, /Evidence basis: \{evidenceLabel\}/);
  assert.match(pages.guide, /No hands-on test or human review is recorded/);
  assert.match(pages.guide, /No source citations are recorded for this guide/);
  assert.match(pages.guide, /href=\{source\.url\}/);
  assert.match(pages.guide, /EDITORIAL_TEAM\.methodology/);
  assert.match(pages.guide, /EDITORIAL_TEAM\.disclosure/);
});
