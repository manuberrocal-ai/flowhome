import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const cases = [
  ['aqara-hub-m2', ['Matter bridging', 'supported Zigbee', 'power', 'firmware']],
  ['switchbot-hub-2', ['Matter bridge', 'supported actions', 'sensor-equipped cable']],
  ['aeotec-smartthings-hub', ['GP-AEOHUBV3US', 'US regional', 'not Smart Home Hub 2']],
];

test('hub excerpts state documentary scope and exact decision differences without refreshing dates', () => {
  for (const [slug, expected] of cases) {
    const text = read(`src/content/reviews/${slug}-review.md`);
    const data = parse(text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
    assert.match(data.description, /^Document-based /);
    for (const term of expected) assert.ok(data.description.includes(term), `${slug}: ${term}`);
    assert.equal(data.pubDate, '2026-07-15');
    assert.equal(data.updatedDate, '2026-09-06');
    assert.equal(data.humanReviewedDate, undefined);
    assert.equal(data.reviewedBy, undefined);
    assert.match(text, /not a physical evaluation/);
    assert.doesNotMatch(data.description, /hands-on|human.reviewed|tested|best|cheapest/i);
  }
});

test('review descriptions remain the single source for RSS, visible excerpt and search/social metadata', () => {
  const rss = read('src/pages/rss.xml.js');
  assert.match(rss, /reviews\.map\([\s\S]*?description: item.data.description/);
  assert.match(rss, /pubDate: item.data.pubDate, link: `\/review\/\$\{item.id\}\//);
  const review = read('src/layouts/ReviewLayout.astro');
  assert.match(review, /description=\{review.description \|\| review.title\}/);
  assert.match(review, />\{review.description\}<\/p>/);
  const base = read('src/layouts/BaseLayout.astro');
  for (const key of ['description', 'og:description', 'twitter:description']) {
    assert.ok(base.includes(`="${key}" content={description}`), key);
  }
});
