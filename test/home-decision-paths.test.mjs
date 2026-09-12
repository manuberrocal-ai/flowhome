import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const home = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

test('home partitions the editorial selection without repeating hero products in the grid', () => {
  assert.match(home, /showcaseProducts = featuredProducts\.slice\(0, 4\)/);
  assert.match(home, /additionalProducts = featuredProducts\.slice\(4\)/);
  assert.match(home, /additionalProducts\.map\(\(product\) => <ProductCard/);
  assert.doesNotMatch(home, /categories\.map/);
});

test('compact mobile privacy choices retain both actions and details', async () => {
  const banner = await readFile(new URL('../src/components/ConsentBanner.astro', import.meta.url), 'utf8');
  assert.match(banner, /Analytics are optional/);
  assert.match(banner, /Essential storage/);
  assert.match(banner, /href="\/privacy\/"/);
  assert.match(banner, /grid-cols-2/);
  for (const action of ['accepted', 'rejected']) {
    assert.match(banner, new RegExp(`min-h-11[^>]*data-consent-action="${action}"`));
  }
});

test('home offers three crawlable, existing buying-guide paths by setup need', async () => {
  const section = home.match(/<section[^>]*data-home-guide-paths>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'setup guide section is rendered without client JavaScript');
  assert.match(section, /aria-labelledby="home-start-heading"/);
  assert.match(section, /id="home-start-heading"/);
  assert.match(section, /<nav aria-label="Buying guides by setup need"/);
  assert.equal((home.match(/data-home-guide-paths/g) ?? []).length, 1);
  assert.equal((home.match(/id="home-start-heading"/g) ?? []).length, 1);
  assert.ok(home.indexOf('data-fh-home-primary-cta') < home.indexOf('data-home-guide-paths'));
  assert.ok(home.indexOf('data-home-guide-paths') > home.indexOf('data-hero-showcase'), 'the product demonstration precedes the full guide paths on mobile');
  assert.doesNotMatch(section, /md:grid-cols-3|\border-|line-clamp|truncate/);
  assert.match(home, /lg:items-start/);
  const slugs = [...section.matchAll(/href="\/best\/([^/]+)\/"/g)].map((match) => match[1]);
  assert.equal(slugs.length, 3);
  assert.equal(new Set(slugs).size, 3);
  for (const slug of slugs) {
    const guide = await readFile(new URL(`../src/content/best-of/${slug}.yaml`, import.meta.url), 'utf8');
    assert.match(guide, new RegExp(`^slug: ${slug}$`, 'm'));
    assert.match(guide, /buyingConsiderations:/);
    assert.match(guide, /sources:/);
  }
  const route = await readFile(new URL('../src/pages/best/[slug].astro', import.meta.url), 'utf8');
  assert.match(route, /getCollection\('best-of'\)/);
  assert.match(route, /params: \{ slug: list.data.slug \}/);
});

test('home distinguishes research from physical testing and retains evaluation access', async () => {
  assert.match(home, /Research-based guidance, not hands-on testing\./);
  assert.match(home, /href="\/about\/#editorial-team"/);
  const about = await readFile(new URL('../src/pages/about.astro', import.meta.url), 'utf8');
  assert.match(about, /id="editorial-team"/);
  assert.match(home, /research-based reviews/);
  assert.doesNotMatch(home, /What readers check before buying|actually fits your home/);
  assert.match(home, /href="\/quiz\/"[^>]*data-fh-home-primary-cta/);
  assert.match(home, /rel="nofollow sponsored noopener noreferrer"/);
  assert.match(home, /getCommerceData\(data, now\)/);
});
