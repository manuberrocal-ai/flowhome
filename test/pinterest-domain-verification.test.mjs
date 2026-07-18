import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const source = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const tag = '<meta name="p:domain_verify" content="6cf2c9a42f2aef69bebc982c82825143" />';

assert.ok(source.includes(tag), 'Pinterest domain verification meta tag is missing from BaseLayout.astro');
assert.equal(source.split(tag).length - 1, 1, 'Pinterest domain verification meta tag must appear exactly once in BaseLayout.astro');
