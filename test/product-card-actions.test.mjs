import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const css = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const card = await readFile(new URL('../src/components/ProductCard.astro', import.meta.url), 'utf8');

test('product actions retain visible labels and stable two-column geometry', () => {
  assert.match(card, />View details<\/span>/);
  assert.match(card, />Add to list<\/span>/);
  assert.doesNotMatch(card, /amazon-cta-compact-icon/);
  assert.match(css, /\.product-card-amazon-action, \.product-card-side-action \{ position: relative; display: flex;/);
  const labels = css.match(/\.product-card-side-action-label \{([^}]+)\}/)[1];
  assert.doesNotMatch(labels, /opacity: 0|max-width: 0|overflow: hidden/);
  assert.doesNotMatch(css, /is-details-open|is-list-open/);
  assert.match(css, /grid-column: 1 \/ -1/);
});

test('individual focus cannot be erased by decorative box shadows', () => {
  assert.match(css, /\.product-card-action-row > :focus-visible \{ outline: 3px solid #12304f; outline-offset: 3px;/);
  assert.doesNotMatch(css, /\.product-card:focus-within \.product-card-side-action--details/);
  assert.match(css, /aria-pressed="true"\] svg \{ fill: currentColor/);
});
