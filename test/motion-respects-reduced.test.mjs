import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

const baseLayout = read('src/layouts/BaseLayout.astro');
const footer = read('src/components/Footer.astro');
const indexPage = read('src/pages/index.astro');
const styleSheet = read('src/styles/global.css');
const heroCarousel = read('src/lib/hero-carousel.js');

test('BaseLayout flow-wave and product-zoom are guarded by prefers-reduced-motion', () => {
  assert.match(baseLayout, /const reduceMotion = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(baseLayout, /if \(!reduceMotion\) setupFlowWave\(\);/);
  assert.match(baseLayout, /if \(!reduceMotion\) setupProductZoom\(\);/);
});

test('BaseLayout scroll listeners use passive flag and requestAnimationFrame throttle', () => {
  assert.match(baseLayout, /window\.addEventListener\('scroll', queueSync, \{ passive: true \}\)/);
  assert.match(baseLayout, /window\.requestAnimationFrame\(/);
  assert.match(baseLayout, /syncQueued = true/);
});

test('Footer parallax is guarded by prefers-reduced-motion and uses passive scroll', () => {
  assert.match(footer, /const reduceMotion = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(footer, /if \(!footer \|\| reduceMotion\) return/);
  assert.match(footer, /window\.addEventListener\('scroll', requestParallax, \{ passive: true \}\)/);
  assert.match(footer, /window\.requestAnimationFrame\(updateParallax\)/);
});

test('index home parallax is guarded by prefers-reduced-motion and uses passive scroll', () => {
  assert.match(indexPage, /const reduceMotion = window\.matchMedia\('\(prefers-reduced-motion: reduce\)'\)\.matches/);
  assert.match(indexPage, /if \(!parallaxSections\.length \|\| reduceMotion\) return/);
  assert.match(indexPage, /window\.addEventListener\('scroll', requestParallax, \{ passive: true \}\)/);
});

test('heroStarPop keyframe animation is disabled under prefers-reduced-motion media query', () => {
  assert.match(indexPage, /@keyframes heroStarPop/);
  assert.match(indexPage, /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.hero-star\s*\{\s*animation:\s*none/);
});

test('hero carousel exposes eager/fetchpriority high for primary image and lazy for thumbnails', () => {
  assert.match(indexPage, /<img data-hero-image[^>]*loading="eager"[^>]*fetchpriority="high"/);
  assert.match(indexPage, /loading="lazy"[^>]*fetchpriority="low"/);
});

test('flow-wave CSS ribbon animation is declared and named consistently', () => {
  assert.match(styleSheet, /\.flow-wave-ribbon/);
  assert.match(styleSheet, /animation: fh-wave/);
});

test('hero carousel script honors prefers-reduced-motion via matchMedia', () => {
  assert.match(heroCarousel, /prefers-reduced-motion: reduce/);
  assert.match(heroCarousel, /matchMedia/);
});
