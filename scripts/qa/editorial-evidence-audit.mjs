import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const decode = value => value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code))).replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, code) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[code]);
const normalize = value => decode(value.replace(/<[^>]*>/g, '')).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const markdownText = value => value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^#{1,6}\s+/gm, '').replace(/\*\*|`/g, '');
const records = [];
for (const [collection, route] of [['reviews', 'review'], ['best-of', 'best']]) {
  for (const file of readdirSync(new URL(`src/content/${collection}/`, root)).sort()) {
    if (!/\.(md|yaml)$/.test(file)) continue;
    const source = read(`src/content/${collection}/${file}`);
    const match = collection === 'reviews' ? source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/) : null;
    const data = parse(match ? match[1] : source);
    const slug = route === 'review' ? file.replace(/\.md$/, '') : data.slug;
    assert.match(slug, /^[a-z0-9-]+$/);
    const path = `/${route}/${slug}/`;
    const html = read(`dist${path}index.html`);
    const text = normalize(html);
    const heading = normalize(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '');
    assert.equal(heading, data.title, `${path}: visible title`);
    assert.equal(normalize(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''), `${data.title} | FlowHome`, `${path}: document title`);
    assert.ok(html.includes(`content="${data.description.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`), `${path}: metadata description`);
    assert.ok(text.includes(normalize(data.description)), `${path}: visible description`);
    assert.ok(text.includes('FlowHome Editorial Team'), `${path}: organizational author`);
    assert.ok(text.includes('Editorial methodology'), `${path}: method`);
    assert.ok(text.includes('qualifying purchases'), `${path}: affiliate disclosure`);
    assert.ok(data.sources?.length, `${path}: sources`);
    for (const entry of data.sources) {
      assert.ok(html.includes(`href="${entry.url.replace(/&/g, '&amp;')}"`), `${path}: source URL`);
      assert.ok(text.includes(normalize(entry.label)), `${path}: source label`);
      assert.ok(text.includes(entry.accessedAt), `${path}: source date`);
    }
    const paragraphs = match ? match[2].trim().split(/\r?\n\s*\r?\n/).map(markdownText) : [data.intro, ...data.buyingConsiderations.flatMap(item => [item.label, item.detail])];
    for (const paragraph of paragraphs) assert.ok(text.includes(normalize(paragraph)), `${path}: missing content: ${paragraph.slice(0, 90)}`);
    records.push({ file: `src/content/${collection}/${file}`, path, title: data.title, description: data.description, sourceCount: data.sources.length, paragraphsChecked: paragraphs.length, status: 'source-render-match' });
  }
}
assert.equal(records.filter(record => record.path.startsWith('/review/')).length, 15);
assert.equal(records.filter(record => record.path.startsWith('/best/')).length, 8);
console.log(JSON.stringify({ scope: 'Local source/render parity, not independent source truth, physical testing, or publication approval.', total: records.length, records }, null, 2));
