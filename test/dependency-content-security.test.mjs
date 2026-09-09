import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const { load } = require('js-yaml');
const { optimize } = require('svgo');
const { gte } = require('semver');

test('resolved content toolchain excludes the September 2026 vulnerable versions', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  for (const [name, minimum] of Object.entries({ astro: '7.2.8', sharp: '0.35.4', 'js-yaml': '4.3.2', svgo: '4.1.0' })) {
    const copies = Object.entries(lock.packages).filter(([path]) => path.endsWith(`node_modules/${name}`));
    assert.ok(copies.length, name);
    for (const [path, entry] of copies) assert.ok(gte(entry.version, minimum), `${path}: ${entry.version}`);
  }
  assert.ok(gte(sharp.versions.sharp, '0.35.4'));
});

test('YAML empty merge sources consume the configured budget', () => {
  const input = 'sources: &s [{}, {}, {}, {}]\ntarget:\n  <<: *s\n';
  assert.throws(() => load(input, { maxTotalMergeKeys: 2 }), /merge/i);
  const alternate = 'a: &a {}\nb: &b {}\ntarget: {<<: [*a, *b, *a, *b]}\n';
  assert.throws(() => load(alternate, { maxTotalMergeKeys: 2 }), /merge/i);
  assert.deepEqual(load('name: Example\ncategory: smart-plug\n'), { name: 'Example', category: 'smart-plug' });
  assert.deepEqual(load('defaults: &d {market: US}\nproduct: {<<: *d, name: Example}\n').product, { market: 'US', name: 'Example' });
});

test('SVGO removeScripts removes namespace and control-character executable links', () => {
  const wrappers = [
    '<s:a xmlns:s="http://www.w3.org/2000/svg" href="javascript:alert(1)"><text>Label</text></s:a>',
    '<a href="java&#9;script:alert(1)"><text>Label</text></a>',
    '<a href="java&#10;script:alert(1)"><text>Label</text></a>',
    '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml" onclick="alert(1)">Label</div></foreignObject>',
  ];
  for (const content of wrappers) {
    const output = optimize(`<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`, { plugins: ['removeScripts'] }).data;
    assert.doesNotMatch(output.replace(/[\t\n\r]/g, ''), /javascript:|onclick=/i);
  }
  const ordinary = optimize('<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com/"><text>Label</text></a></svg>', { plugins: ['removeScripts'] }).data;
  assert.match(ordinary, /https:\/\/example\.com\//);
  assert.match(ordinary, /Label/);
});
