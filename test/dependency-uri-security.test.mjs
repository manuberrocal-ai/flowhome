import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Exercise the actual URI resolver reached by the development YAML validator.
const localRequire = createRequire(import.meta.url);
const yamlRequire = createRequire(localRequire.resolve('yaml-language-server/package.json'));
const ajvRequire = createRequire(yamlRequire.resolve('ajv'));
const uri = ajvRequire('fast-uri');

test('development URI resolution canonicalizes internationalized scheme-relative hosts', () => {
  assert.equal(uri.resolve('https://example.com/a', '//faß.de/'), 'https://xn--fa-hia.de/');
});
test('development URI normalization does not double-decode a nested hostname', () => {
  const nested = 'http://%256c%256f%2563%2561%256c%2568%256f%2573%2574/';
  assert.notEqual(uri.normalize(nested), 'http://localhost/');
  assert.notEqual(uri.resolve('http://example.com/', nested), 'http://localhost/');
});
test('ordinary same-host relative paths and external ASCII references keep their meaning', () => {
  assert.equal(uri.resolve('https://example.com/a', '../b'), 'https://example.com/b');
  assert.equal(uri.resolve('https://example.com/a', '//example.org/path'), 'https://example.org/path');
  assert.equal(uri.normalize('https://EXAMPLE.com:443/a'), 'https://example.com/a');
});
