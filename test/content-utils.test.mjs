import test from 'node:test';
import assert from 'node:assert/strict';
import { frontmatterMarkdown } from '../scripts/lib/content-utils.mjs';

test('frontmatter accepts LF and CRLF without losing metadata or rewriting the body', () => {
  for (const eol of ['\n', '\r\n']) {
    const body = `## Evidence${eol}Original text.${eol}`;
    const source = ['---', 'title: "Fixture"', 'slug: fixture', 'published: false', 'tags:', '  - smart-home', '---', ''].join(eol) + body;
    const parsed = frontmatterMarkdown(source);
    assert.deepEqual(parsed.data, { title: 'Fixture', slug: 'fixture', published: false, tags: ['smart-home'] });
    assert.equal(parsed.body, body);
  }
});

test('missing frontmatter boundaries retain the original body instead of inventing metadata', () => {
  for (const source of ['No metadata\r\n', '---\r\ntitle: unfinished', 'before\n---\ntitle: misplaced\n---\nbody']) {
    assert.deepEqual(frontmatterMarkdown(source), { data: {}, body: source });
  }
});
