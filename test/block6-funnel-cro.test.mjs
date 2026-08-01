import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const files = {
  doc: await readFile(new URL('../docs/BLOCK6_FUNNEL_CRO.md', import.meta.url), 'utf8'),
  home: await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8'),
  layout: await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8'),
  analytics: await readFile(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'),
};

test('Block 6 contract documents the funnel, audit, safeguards, and unknown decision', () => {
  for (const term of ['TOFU', 'MOFU', 'BOFU', 'owner', 'exit criterion', 'cards', 'search', 'filters', 'comparisons', 'quiz', 'empty', 'error', 'confirmation', 'mobile', '44px', 'Hypothesis', 'Unknown', 'CTR-only']) assert.match(files.doc, new RegExp(term, 'i'));
});

test('home markup keeps the quiz href and accessible stable CTA without dark-pattern activation', () => {
  assert.match(files.home, /href="\/quiz\/"[^>]*data-fh-home-primary-cta/);
  assert.match(files.home, /data-fh-home-primary-cta[^>]*class="[^"]*min-h-12/);
  assert.doesNotMatch(files.home, /data-fh-home-primary-cta[^>]*target=/);
  assert.match(files.layout, /data-funnel-experiment-v1/);
  assert.match(files.layout, /FUNNEL_EXPERIMENT_V1 \? 'on' : 'off'/);
  assert.match(files.layout, /data-home-primary-cta-v1/);
  assert.match(files.layout, /HOME_PRIMARY_CTA_V1 \? 'on' : 'off'/);
});

test('analytics exposes only the allowlisted experiment fields and bounded bucket', () => {
  assert.match(files.analytics, /experiment_exposure: new Set\(\['page_type', 'experiment_id', 'variant_id', 'assignment_version', 'mutual_exclusion_group', 'assignment_bucket'\]\)/);
  assert.match(files.analytics, /assignment_bucket.*value <= 9999/);
});
