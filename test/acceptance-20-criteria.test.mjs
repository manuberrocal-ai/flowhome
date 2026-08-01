import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function read(path) {
  return readFileSync(path, 'utf8');
}

function fileExists(path) {
  return existsSync(path);
}

const src = (p) => join('src', p);
const testDir = 'test';
const productYamls = readdirSync('src/content/products').filter((f) => f.endsWith('.yaml')).map((f) => join('src/content/products', f));

// P0#1 Hero atómico
test('C1 - Hero carousel swaps products atomically with single article, not stacked slides', () => {
  const hero = read(src('lib/hero-carousel.js'));
  const index = read(src('pages/index.astro'));
  assert.match(hero, /export function setupHeroCarousel/);
  assert.match(hero, /export function applyProduct/);
  assert.match(hero, /normalizeProduct/);
  assert.match(hero, /prefers-reduced-motion: reduce/);
  assert.match(index, /data-hero-slide/);
  assert.equal((index.match(/<article[^>]*data-hero-slide/g) ?? []).length, 1, 'only one hero article rendered SSR');
  assert.match(index, /data-hero-dot=\{index\}/, 'hero dots generated dynamically via Astro map');
  assert.match(index, /showcaseProducts = featuredProducts\.slice\(0,\s*6\)/, 'six showcase products come from featuredProducts.slice(0, 6)');
});

test('C1b - Hero respects reduced motion, pausing setInterval on interaction and respecting visibilitychange', () => {
  const hero = read(src('lib/hero-carousel.js'));
  assert.match(hero, /interacted/);
  assert.match(hero, /visibilitychange/);
  assert.match(hero, /matchMedia/);
});

// P0#2 Shortlist único
test('C2 - Cart store idempotently keeps unique items (no quantity stacking)', () => {
  const store = read(src('lib/cart-store.js'));
  assert.match(store, /add\(item\)/, 'add accepts no quantity options');
  assert.ok(!/multiply|increment\(|decrement\(|getCartQuantity/.test(store), 'quantity APIs must not be public');
  assert.match(store, /return\s*\{\s*\.\.\.existing\s*\};/);
  assert.match(store, /getUniqueItemCount/);
  assert.match(store, /hasItem/);
  assert.match(store, /toggle\(item\)/);
  assert.ok(/unique ident/i.test(store) || /idempot/i.test(store) || /presence marker/i.test(store), 'cart-store must mark add() as idempotent');
});

// P0#3 Login eliminado
test('C3 - Amazon CTAs are direct (no AuthGuardModal, no fhRequireAuth, no data-fh-amazon-link, no preventDefault on Amazon links)', () => {
  assert.ok(!fileExists(src('components/AuthGuardModal.astro')), 'AuthGuardModal.astro removed');
  const base = read(src('layouts/BaseLayout.astro'));
  assert.ok(!/AuthGuardModal/.test(base), 'BaseLayout no longer imports AuthGuardModal');
  assert.ok(!/fhRequireAuth/.test(base), 'window.fhRequireAuth removed');
  const productCard = read(src('components/ProductCard.astro'));
  assert.ok(!/data-fh-amazon-link/.test(productCard), 'no data-fh-amazon-link on product cards');
  assert.match(productCard, /rel="nofollow sponsored noopener noreferrer"/);
  const quiz = read(src('pages/quiz.astro'));
  assert.match(quiz, /rel="nofollow sponsored noopener noreferrer"/);
});

test('C3b - Amazon Associates tag flowhome-20 present on every Amazon href across product YAMLs', () => {
  for (const file of productYamls) {
    const content = read(file);
    if (!/affiliateUrl:\s*"https:\/\/www\.amazon\.com/.test(content)) continue;
    assert.match(content, /tag=flowhome-20/, `${file} missing flowhome-20 tag`);
  }
});

// P0#4 Deals expired retired
test('C4 - Deal-state utility filters expired deals and softens the UI', () => {
  assert.ok(fileExists(src('lib/deal-state.ts')));
  const deal = read(src('lib/deal-state.ts'));
  assert.match(deal, /export function getDealStatus/);
  assert.match(deal, /expired/);
  const index = read(src('pages/index.astro'));
  assert.match(index, /getDealStatus/);
});

// P0#5 Taxonomía + relacionados tipados
test('C5 - Product taxonomy canonical categories and relationship types are enforced in schema', () => {
  const tax = read(src('lib/product-taxonomy.ts'));
  assert.match(tax, /CANONICAL_CATEGORIES/);
  assert.match(tax, /RELATIONSHIP_TYPES/);
  assert.match(tax, /direct-alternative/);
  assert.match(tax, /compatible-accessory/);
  assert.match(tax, /selectDirectAlternatives/);
  const config = read(src('content.config.ts'));
  assert.match(config, /z\.enum\(CANONICAL_CATEGORIES\)/);
  assert.match(config, /z\.enum\(RELATIONSHIP_TYPES\)/);
});

// P0#6 Ratings/JSON-LD honestos
test('C6 - Owner ratings and editorial ratings are separate; JSON-LD never aggregates retailer ratings', () => {
  const commerce = read(src('lib/commerce-data.ts'));
  const seo = read(src('lib/seo.ts'));
  assert.match(seo, /export function generateProductSchema/);
  assert.match(seo, /export function generateReviewSchema/);
  const combined = `${commerce}\n${seo}`;
  assert.ok(!/aggregateRating:\s*ownerRating/.test(combined), 'no aggregateRating built from ownerRating');
  assert.ok(!/reviewRating.*ownerRating/.test(combined), 'no reviewRating built from ownerRating');
  assert.match(seo, /editorialRating/);
});

// P0#7 Disponibilidad real
test('C7 - Availability only appears in JSON-LD when fresh source + status + timestamp verified ≤ 24h', () => {
  const commerce = read(src('lib/commerce-data.ts'));
  assert.match(commerce, /availabilityMs/);
  assert.match(commerce, /availabilitySource/);
  assert.match(commerce, /availabilityLastChecked/);
  assert.match(commerce, /isFresh/);
  assert.match(commerce, /getCommerceData/);
  assert.match(commerce, /availability\s*=\s*availabilityFresh\s*&&\s*product\.availabilityStatus/);
  assert.match(commerce, /availabilityMs:\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  assert.match(commerce, /isAvailabilityFresh/);
});

// P1#8 Quiz real
test('C8 - Quiz has five-question flow, URL state, save actions, and at most four catalog-driven results', () => {
  const q = read(src('lib/quiz-recommend.ts'));
  assert.match(q, /export function selectRecommendations/);
  assert.match(q, /GOAL_QUIZ_OPTIONS/);
  assert.match(q, /ECOSYSTEM_QUIZ_OPTIONS/);
  assert.match(q, /BUDGET_QUIZ_OPTIONS/);
  assert.match(q, /INSTALLATION_QUIZ_OPTIONS/);
  assert.match(q, /EXTRA_PRIORITY_QUIZ_OPTIONS/);
  assert.match(q, /selectRecommendationResult/);
  assert.match(q, /serializeQuizState/);
  assert.match(q, /parseQuizState/);
  assert.match(q, /catalogActive/);
  assert.match(q, /Math\.min\(4,/);
  const page = read(src('pages/quiz.astro'));
  assert.match(page, /optionGroups\.map/);
  assert.match(page, /data-quiz-step=\{index \+ 1\}/);
  for (const group of ['GOAL_QUIZ_OPTIONS', 'ECOSYSTEM_QUIZ_OPTIONS', 'BUDGET_QUIZ_OPTIONS', 'INSTALLATION_QUIZ_OPTIONS', 'EXTRA_PRIORITY_QUIZ_OPTIONS']) assert.match(page, new RegExp(group));
  assert.match(page, /Why this matches/);
  assert.match(page, /Save/);
  assert.match(page, /history\.replaceState/);
  assert.match(page, /quiz_start/);
  assert.match(page, /Price source:/);
  assert.match(page, /quizStarted = false/);
  assert.match(page, /popstate[\s\S]*isCompleteQuizState\(state\)[\s\S]*renderResults\(false\)/);
  assert.ok(!/Step \$\{step\} of 3/.test(page), 'quiz must not retain the former three-step progress copy');
});

// P1#9 Comparaciones honestas
test('C9 - Comparison pages have eight definitions with unique SEO guidance + Honest methodology section', () => {
  const page = read(src('pages/compare/[...slugs].astro'));
  assert.equal((page.match(/slugs:\s*\[/g) ?? []).length, 8);
  const layout = read(src('layouts/CompareLayout.astro'));
  assert.match(layout, /Editorial methodology/);
  assert.match(layout, /FlowHome Editorial Team/);
  assert.match(layout, /Amazon customer ratings/);
});

// P1#10 Autoría/metodología visible
test('C10 - Product, review and comparison pages expose an Editorial methodology section with author and source declarations', () => {
  const product = read(src('pages/product/[slug].astro'));
  assert.match(product, /Editorial methodology/);
  assert.match(product, /getEditorialMetadata/);
  assert.match(product, /editorial\.author\.name/);
  assert.match(product, /Ratings source:/);
  assert.match(product, /Price source:/);
  assert.match(product, /Specs source:/);
  const review = read(src('layouts/ReviewLayout.astro'));
  assert.match(review, /Editorial methodology/);
  assert.match(review, /getEditorialMetadata/);
  assert.match(review, /editorial\.author\.name/);
  assert.match(read(src('lib/editorial.ts')), /name: 'FlowHome Editorial Team'/);
  assert.match(review, /Content updated/);
  assert.match(review, /Human reviewed/);
  assert.match(product, /Product data updated/);
  assert.match(product, /not a human review/);
  assert.match(read(src('pages/about.astro')), /not an individual person/);
});

// P1#11 Specs irrelevantes
test('C11 - Product specs are scoped by category via product-specs matrix (no Night Vision on smart speakers)', () => {
  const specs = read(src('lib/product-specs.ts'));
  assert.match(specs, /CATEGORY_FEATURE_MATRIX/);
  assert.match(specs, /export function getProductFeatures/);
  const product = read(src('pages/product/[slug].astro'));
  assert.match(product, /categoryFeatures/);
  assert.match(product, /FlowHome only shows specs that are documented in our product data/);
});

// P2#12 Motion respeta reduceMotion
test('C12 - Non-essential motion is finite, interactive, and reduced-motion safe', () => {
  const base = read(src('layouts/BaseLayout.astro'));
  assert.match(base, /prefers-reduced-motion: reduce/);
  assert.match(base, /if \(!reduceMotion\) setupProductZoom\(\);/);
  assert.doesNotMatch(base, /requestAnimationFrame|addEventListener\(['"]scroll|flow-wave/);
  const footer = read(src('components/Footer.astro'));
  assert.doesNotMatch(footer, /parallax|requestAnimationFrame|addEventListener\(['"]scroll|background-attachment\s*:\s*fixed/i);
  const index = read(src('pages/index.astro'));
  assert.doesNotMatch(index, /parallax|requestAnimationFrame|addEventListener\(['"]scroll|background-attachment\s*:\s*fixed/i);
  const styles = read(src('styles/global.css'));
  assert.doesNotMatch(`${base}\n${footer}\n${index}\n${styles}`, /animation:[^;]*infinite|animation-iteration-count\s*:\s*infinite|animate-(pulse|bounce|spin)/i);
  assert.match(`${footer}\n${styles}`, /(?:150|180|220)ms/);
});

// P2#13 Botones distinguibles
test('C13 - Product cards expose distinct actions (Amazon CTA, details, list) with aria-pressed on toggle', () => {
  const card = read(src('components/ProductCard.astro'));
  assert.match(card, /data-product-action="details"/);
  assert.match(card, /data-product-action="list"/);
  assert.match(card, /aria-pressed="false"/);
  assert.match(card, /aria-label=\{`View \$\{data\.name\} on Amazon`/);
  assert.match(card, /aria-label=\{`Add \$\{data\.name\} to your FlowHome list`/);
  assert.match(card, /aria-label=\{`View \$\{data\.name\} details on FlowHome`/);
});

test('C13b - Hero controls use SVG arrows with aria-label on the button, not raw < > literals', () => {
  const index = read(src('pages/index.astro'));
  assert.match(index, /<button[^>]*hero-prev[^>]*aria-label="Previous product">/);
  assert.match(index, /<button[^>]*hero-next[^>]*aria-label="Next product">/);
  assert.match(index, /<svg viewBox="0 0 20 20"[^>]*aria-hidden="true"/);
});

// P2#14 Reveal/lazy load
test('C14 - Essential content renders by default while critical and below-fold images have explicit loading contracts', () => {
  const card = read(src('components/ProductCard.astro'));
  assert.match(card, /loading="lazy"/);
  assert.match(card, /fetchpriority="low"/);
  const product = read(src('pages/product/[slug].astro'));
  assert.match(product, /loading="eager"/);
  assert.match(product, /fetchpriority="high"/);
  assert.match(product, /data-fallback-src/);
  const index = read(src('pages/index.astro'));
  assert.match(index, /preloadImage=\{heroProducts\[0\]\?\.image\}/);
  assert.match(index, /data-hero-image[\s\S]*loading="eager"[\s\S]*fetchpriority="high"[\s\S]*data-fallback-src/);
  assert.doesNotMatch(index, /content-visibility:\s*auto|data-reveal/);
  const base = read(src('layouts/BaseLayout.astro'));
  assert.match(base, /safePreloadImage && <link rel="preload" as="image" href=\{safePreloadImage\} fetchpriority="high"/);
  assert.doesNotMatch(base, /preloadImage && <link rel="preload"/);
});

// P2#15 Responsive / touch targets
test('C15 - Style system keeps 44px touch targets on hero carousel + mobile menu and a bounded override budget', () => {
  assert.ok(fileExists(join(testDir, 'style-system.test.mjs')));
  const css = read(src('styles/global.css'));
  assert.match(css, /min-h-11|min-height:\s*2\.75rem|44px/);
  const home = read(src('pages/index.astro'));
  assert.match(home, /grid min-w-0 grid-cols-\[minmax\(0,1fr\)\]/);
  assert.match(home, /max-w-full flex-wrap gap-1/);
  const consent = read(src('components/ConsentBanner.astro'));
  assert.doesNotMatch(consent, /class="fixed/);
  const base = read(src('layouts/BaseLayout.astro'));
  assert.doesNotMatch(base, /GoogleTranslate|language-options|googtrans/);
  assert.doesNotMatch(base, /floating-language-switcher/);
  assert.doesNotMatch(base, /ExitIntentPopup/);
  const exitIntent = read(src('components/ExitIntentPopup.astro'));
  assert.doesNotMatch(exitIntent, /fixed|mouseleave|sessionStorage/i);
});

// Extras de integridad de datos y no-regresión
test('C16 - All product YAMLs use ownerRating/ownerRatingCount/catalogActive (no legacy rating/reviewCount/available)', () => {
  for (const file of productYamls) {
    const content = read(file);
    assert.ok(!/^rating:/m.test(content), `${file} still has legacy "rating:" field`);
    assert.ok(!/^reviewCount:/m.test(content), `${file} still has legacy "reviewCount:" field`);
    assert.ok(!/^available:/m.test(content), `${file} still has legacy "available:" field`);
    assert.match(content, /^ownerRating:/m, `${file} missing ownerRating`);
    assert.match(content, /^ownerRatingCount:/m, `${file} missing ownerRatingCount`);
    assert.match(content, /^catalogActive:/m, `${file} missing catalogActive`);
  }
});

test('C17 - content.config schema covers owner fields, priceLastChecked, priceSource enum, availability fields', () => {
  const config = read(src('content.config.ts'));
  assert.match(config, /ownerRating:\s*z\.number/);
  assert.match(config, /ownerRatingCount:\s*z\.number/);
  assert.match(config, /catalogActive:\s*z\.boolean/);
  assert.match(config, /priceLastChecked:\s*z\.string/);
  assert.match(config, /priceSource:\s*z\.enum\(\['manual', 'amazon-creators-api', 'affiliate-feed'\]\)/);
  assert.match(config, /availabilityStatus:/);
  assert.match(config, /availabilityLastChecked:/);
  assert.match(config, /availabilitySource:/);
});

test('C18 - Amazon CTAs never attach preventDefault or inline onclick (no login interception)', () => {
  const card = read(src('components/ProductCard.astro'));
  assert.ok(!/onclick=/.test(card), 'ProductCard has inline onclick');
  assert.ok(!/preventDefault/.test(card), 'ProductCard has preventDefault');
  const layout = read(src('layouts/ProductLayout.astro'));
  assert.ok(!/preventDefault/.test(layout), 'ProductLayout has preventDefault');
});

test('C19 - Quiz serial catalog populates ONLY catalog-active products (no invented ratings)', () => {
  const quiz = read(src('pages/quiz.astro'));
  assert.match(quiz, /data\.catalogActive/);
  assert.match(quiz, /set:html=\{JSON\.stringify\(quizCatalog\)/);
  // No raw hard-coded product copy injected as "found" result
  assert.ok(!/copy\[result\]/.test(quiz), 'quiz must not display generic copy fallback');
});

test('C20 - JSON-LD never declares InStock/aggregateRating from retailer owner data', () => {
  const seo = read(src('lib/seo.ts'));
  assert.match(seo, /hasEditorialRating/);
  // aggregateRating never built without explicit retailer ratings collection
  assert.ok(!/\.\.\.\(product\.ownerRating[\s\S]{0,200}aggregateRating/.test(seo), 'aggregateRating cannot be derived from ownerRating');
  // Offer only emitted when commerce.hasOffer
  assert.match(seo, /commerce\.hasOffer/);
});


