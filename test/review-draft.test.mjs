import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'yaml';
import { renderReviewDraft, writeReviewDraft } from '../scripts/content/generate-review.mjs';

const product = { slug: 'sample-device', name: 'Sample: "device"', price: 99.99, ownerRating: 4.9, category: 'smart-hub' };

test('review drafts contain no fabricated commercial, publication or quality evidence', () => {
  const content = renderReviewDraft(product);
  const metadata = parse(content.split('---\n')[1]);
  assert.equal(metadata.title, 'Sample: "device" — research draft');
  assert.equal(metadata.publication, 'blocked-pending-human-review');
  for (const field of ['pubDate', 'qualityScore', 'reviewedBy', 'author']) assert.equal(metadata[field], undefined);
  assert.doesNotMatch(content, /99\.99|4\.9|worth considering|known brand/);
  assert.match(content, /outside the published content/);
  assert.throws(() => renderReviewDraft({ ...product, slug: '../../escape' }));
});

test('draft output stays outside Astro collections and refuses to overwrite previous work', () => {
  const root = mkdtempSync(join(tmpdir(), 'flowhome-draft-test-'));
  try {
    const file = writeReviewDraft(product, root);
    assert.equal(file, join(root, 'reports', 'content-drafts', 'sample-device-review.md'));
    const original = readFileSync(file, 'utf8');
    assert.equal(existsSync(join(root, 'src')), false);
    assert.throws(() => writeReviewDraft(product, root), { code: 'EEXIST' });
    assert.equal(readFileSync(file, 'utf8'), original);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
