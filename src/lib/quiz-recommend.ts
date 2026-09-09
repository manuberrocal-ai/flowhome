import { applyVerifiedCompatibility, type CompatibilityEnvironment } from './blocks/block9/compatibility-adapter.ts';
import { forCompatibilitySurface } from './blocks/block9/runtime.ts';
import { getCommerceData, type CommerceProduct } from './commerce-data.ts';
import { getInstallationEvidence, matchesInstallationPreference, INSTALLATION_LABELS } from './product-installation.ts';
import { getFeatureEvidenceLabel, hasFeatureEvidence, type FeatureEvidenceState } from './product-feature-evidence.ts';
export type QuizGoal = 'security' | 'comfort' | 'cleaning' | 'energy' | 'entertainment';
export type QuizPriority = QuizGoal;
export type QuizEcosystem = 'alexa' | 'google' | 'apple' | 'smartthings' | 'open';
export type QuizBudget = 'under50' | 'under150' | 'open';
export type QuizInstallation = 'plug-and-play' | 'light-setup' | 'advanced';
export type QuizExtraPriority = 'privacy' | 'local-control' | 'ease-of-use' | 'best-value' | 'open';
export type QuizStepKey = QuizGoal | QuizEcosystem | QuizBudget | QuizInstallation | QuizExtraPriority;

export const GOAL_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizGoal; heading: string; description: string; categories: ReadonlyArray<string> }> = [
  { id: 'security', heading: 'Security', description: 'Doorbells, cameras, locks, motion sensors, and garage access.', categories: ['video-doorbell', 'security-camera', 'smart-lock', 'motion-sensor', 'garage-door-opener'] },
  { id: 'comfort', heading: 'Comfort', description: 'Temperature, lighting, plugs, blinds, and cleaner air.', categories: ['smart-thermostat', 'smart-blinds', 'air-purifier', 'smart-lighting', 'smart-plug'] },
  { id: 'cleaning', heading: 'Cleaning', description: 'Robot vacuums for recurring floor care.', categories: ['robot-vacuum'] },
  { id: 'energy', heading: 'Energy', description: 'Thermostats, plugs, lights, and blinds to manage routines.', categories: ['smart-thermostat', 'smart-plug', 'smart-lighting', 'smart-blinds'] },
  { id: 'entertainment', heading: 'Entertainment', description: 'Speakers, displays, and lighting for shared spaces.', categories: ['smart-speaker', 'smart-display', 'smart-lighting'] },
];

// Retained as an alias for callers of the former three-question API.
export const PRIORITY_QUIZ_OPTIONS = GOAL_QUIZ_OPTIONS;

export const ECOSYSTEM_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizEcosystem; heading: string; description: string }> = [
  { id: 'alexa', heading: 'Alexa', description: 'Use source-backed Alexa signals when available; check supported functions and setup conditions.' },
  { id: 'google', heading: 'Google Home', description: 'Use source-backed Google Home signals when available; check supported functions and setup conditions.' },
  { id: 'apple', heading: 'Apple Home', description: 'Use source-backed Apple Home signals when available; check supported functions and setup conditions.' },
  { id: 'smartthings', heading: 'SmartThings', description: 'Review model-specific roles and integrations when documented. This preference does not filter accessories; Matter or Zigbee alone does not establish support.' },
  { id: 'open', heading: 'No preference', description: 'Keep ecosystem compatibility open.' },
];

export const BUDGET_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizBudget; heading: string; description: string; maxPrice?: number }> = [
  { id: 'under50', heading: 'Up to $50', description: 'Low-commitment starter gear.', maxPrice: 50 },
  { id: 'under150', heading: 'Up to $150', description: 'More room for a stronger pick.', maxPrice: 150 },
  { id: 'open', heading: 'No budget limit', description: 'Rank the strongest category matches regardless of price.' },
];

export const INSTALLATION_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizInstallation; heading: string; description: string }> = [
  { id: 'plug-and-play', heading: 'Power and app setup', description: 'Prefer documented setup without wiring or mounting work. An app or account may still be needed.' },
  { id: 'light-setup', heading: 'Some mounting is OK', description: 'Also consider documented mounting or guided setup, without household wiring work.' },
  { id: 'advanced', heading: 'Open to installation work', description: 'Also consider wiring or detailed fit checks. Review manufacturer instructions and professional help needs.' },
];

export const EXTRA_PRIORITY_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizExtraPriority; heading: string; description: string }> = [
  { id: 'privacy', heading: 'Privacy', description: 'This quiz does not rank privacy. Review data collection and account or cloud requirements.' },
  { id: 'local-control', heading: 'Local control', description: 'This quiz does not rank offline operation. Check which functions work without internet and what hub is needed.' },
  { id: 'ease-of-use', heading: 'Ease of use', description: 'This quiz does not rank ease of use. Review the documented installation checks for each model.' },
  { id: 'best-value', heading: 'Best value', description: 'Use current authorized prices and owner ratings when available; otherwise compare category fit.' },
  { id: 'open', heading: 'No extra priority', description: 'Keep the final ranking focused on the first four answers.' },
];

export const QUIZ_OPTION_GROUPS = [GOAL_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS, INSTALLATION_QUIZ_OPTIONS, EXTRA_PRIORITY_QUIZ_OPTIONS] as const;

/** These retained URL choices express intent, not verified product benefits. */
export function getExtraPriorityNotice(extra: QuizExtraPriority | ''): string {
  if (extra === 'privacy') return 'Privacy is not assessed, so this preference does not change the order. Check each product\'s data collection, account and cloud requirements before buying.';
  if (extra === 'local-control') return 'Offline operation is not verified, so this preference does not change the order. Check which functions work without internet and which hub or controller is required.';
  if (extra === 'ease-of-use') return 'Ease of use is not assessed, so this preference does not change the order. Review the model-specific installation checks and manufacturer instructions.';
  return '';
}

export interface QuizState {
  goal: QuizGoal | '';
  ecosystem: QuizEcosystem | '';
  budget: QuizBudget | '';
  installation: QuizInstallation | '';
  extra: QuizExtraPriority | '';
}

export interface QuizProduct extends CommerceProduct, FeatureEvidenceState {
  slug: string;
  model?: string;
  installation?: unknown;
  category: string;
  catalogActive?: boolean;
  price?: number;
  ownerRating?: number;
  ownerRatingCount?: number;
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
  matter?: boolean;
  zigbee?: boolean;
  [key: string]: unknown;
}

export interface QuizRecommendationResult<T extends QuizProduct = QuizProduct> {
  recommendations: T[];
  relaxedFilters: Array<'budget' | 'installation' | 'ecosystem'>;
  ecosystemEvidenceUnavailable: boolean;
  limitedCatalog: boolean;
}

const stateValues = {
  goal: new Set(GOAL_QUIZ_OPTIONS.map((option) => option.id)),
  ecosystem: new Set(ECOSYSTEM_QUIZ_OPTIONS.map((option) => option.id)),
  budget: new Set(BUDGET_QUIZ_OPTIONS.map((option) => option.id)),
  installation: new Set(INSTALLATION_QUIZ_OPTIONS.map((option) => option.id)),
  extra: new Set(EXTRA_PRIORITY_QUIZ_OPTIONS.map((option) => option.id)),
};

export function createInitialQuizState(): QuizState {
  return { goal: '', ecosystem: '', budget: '', installation: '', extra: '' };
}

export function getQuizStepLabel(step: number): string {
  return ['Choose your goal', 'Pick your ecosystem', 'Set your budget', 'Choose your setup fit', 'Add an optional priority'][step - 1] ?? '';
}

export function isCompleteQuizState(state: QuizState): state is Required<QuizState> {
  return Boolean(state.goal && state.ecosystem && state.budget && state.installation && state.extra);
}

export function parseQuizState(input: URLSearchParams | string): QuizState {
  const params = typeof input === 'string' ? new URLSearchParams(input.startsWith('?') ? input.slice(1) : input) : input;
  const state = createInitialQuizState();
  for (const key of Object.keys(state) as Array<keyof QuizState>) {
    const value = params.get(key);
    if (value && stateValues[key].has(value as never)) state[key] = value as never;
  }
  return state;
}

export function serializeQuizState(state: QuizState): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(state) as Array<keyof QuizState>) {
    const value = state[key];
    if (value && stateValues[key].has(value as never)) params.set(key, value);
  }
  return params.toString();
}

function scoreProduct(product: QuizProduct, extra: QuizExtraPriority | '' = '', now = new Date()): number {
  const commerce = getCommerceData(product, now);
  const rating = commerce.displayRating ?? 0;
  const count = commerce.displayRatingCount ?? 0;
  let score = rating * Math.log10(count + 1);
  // Subscription/radio/app flags do not establish privacy, offline operation or ease of use.
  if (extra === 'best-value' && commerce.displayPrice !== undefined && rating > 0) score += Math.min(4, (rating * 30) / commerce.displayPrice);
  return score;
}

function byScoreThenPriceAndSlug(extra: QuizExtraPriority | '', now: Date) {
  return (a: QuizProduct, b: QuizProduct): number => {
    const scoreDiff = scoreProduct(b, extra, now) - scoreProduct(a, extra, now);
    if (scoreDiff !== 0) return scoreDiff;
    const priceDiff = (getCommerceData(a, now).displayPrice ?? Number.MAX_SAFE_INTEGER) - (getCommerceData(b, now).displayPrice ?? Number.MAX_SAFE_INTEGER);
    if (priceDiff !== 0) return priceDiff;
    return a.slug.localeCompare(b.slug);
  };
}

function matchesEcosystem(product: QuizProduct, ecosystem: QuizEcosystem): boolean {
  if (ecosystem === 'open') return true;
  if (ecosystem === 'alexa') return hasFeatureEvidence(product, 'alexaCompatible');
  if (ecosystem === 'google') return hasFeatureEvidence(product, 'googleHomeCompatible');
  if (ecosystem === 'apple') return hasFeatureEvidence(product, 'appleHomeKit');
  // A SmartThings hub role does not certify accessory fit; radios are not substitutes.
  return false;
}

export function getQuizCompatibilitySignals(product: QuizProduct) {
  return [['matter', 'Matter'], ['zigbee', 'Zigbee'], ['alexaCompatible', 'Alexa'], ['googleHomeCompatible', 'Google Home'], ['appleHomeKit', 'Apple Home'], ['thread', 'Thread role / integration'], ['smartthingsIntegration', 'SmartThings role / integration']]
    .map(([field, label]) => ({ label, value: getFeatureEvidenceLabel(product, field) }));
}

export function getQuizEcosystemNotice(state: QuizState, result: Pick<QuizRecommendationResult, 'ecosystemEvidenceUnavailable'>): string {
  if (!state.ecosystem || state.ecosystem === 'open') return '';
  if (state.ecosystem === 'smartthings') return 'SmartThings roles and integrations are shown when documented, but a hub role does not verify accessory compatibility. Matter or Zigbee alone does not prove support, so this preference is not used as a filter. Check exact-model functions and setup before buying.';
  if (!result.ecosystemEvidenceUnavailable) return '';
  const label = ECOSYSTEM_QUIZ_OPTIONS.find(option => option.id === state.ecosystem)?.heading;
  return `There is not enough source-backed ${label} evidence to filter a shortlist of at least two products. Other preferences are considered separately; a listed product is not a verified ecosystem match. Check its compatibility sources and conditions.`;
}

function matchesBudget(product: QuizProduct, budget: QuizBudget, now: Date): boolean {
  const option = BUDGET_QUIZ_OPTIONS.find((item) => item.id === budget);
  const price = getCommerceData(product, now).displayPrice;
  return !option?.maxPrice || (price !== undefined && price <= option.maxPrice);
}

function matchesGoalAndActive(product: QuizProduct, goal: QuizGoal): boolean {
  return product.catalogActive === true && Boolean(GOAL_QUIZ_OPTIONS.find((option) => option.id === goal)?.categories.includes(product.category));
}

/** Selects two to four deterministic category matches, relaxing only budget, setup fit, then ecosystem. */
export function selectRecommendationResult<T extends QuizProduct>(state: Required<QuizState> | QuizState, products: T[], limit = 4, now = new Date()): QuizRecommendationResult<T> {
  if (!state.goal || !state.ecosystem || !state.budget || !state.installation || !state.extra) return { recommendations: [], relaxedFilters: [], limitedCatalog: false, ecosystemEvidenceUnavailable: false };
  const maximum = Math.min(4, Math.max(2, Math.floor(Number(limit) || 4)));
  const basePool = products.filter((product) => matchesGoalAndActive(product, state.goal as QuizGoal));
  const active = new Set(['budget', 'installation', 'ecosystem']);
  const relaxedFilters: Array<'budget' | 'installation' | 'ecosystem'> = [];
  const ecosystemEvidenceUnavailable = state.ecosystem !== 'open'
    && basePool.filter(product => matchesEcosystem(product, state.ecosystem as QuizEcosystem)).length < 2;
  if (ecosystemEvidenceUnavailable) active.delete('ecosystem');
  const select = () => basePool
    .filter((product) => (!active.has('budget') || matchesBudget(product, state.budget as QuizBudget, now))
      && (!active.has('installation') || matchesInstallationPreference(product, state.installation as QuizInstallation, now))
      && (!active.has('ecosystem') || matchesEcosystem(product, state.ecosystem as QuizEcosystem)))
    .sort((a, b) => {
      const setupFit = Number(matchesInstallationPreference(b, state.installation as QuizInstallation, now)) - Number(matchesInstallationPreference(a, state.installation as QuizInstallation, now));
      const ecosystemFit = Number(matchesEcosystem(b, state.ecosystem as QuizEcosystem)) - Number(matchesEcosystem(a, state.ecosystem as QuizEcosystem));
      return setupFit || ecosystemFit || byScoreThenPriceAndSlug(state.extra, now)(a, b);
    })
    .slice(0, maximum);

  let recommendations = select();
  for (const filter of ['budget', 'installation', 'ecosystem'] as const) {
    if (recommendations.length >= 2) break;
    const value = state[filter];
    if ((filter === 'budget' || filter === 'ecosystem') && value === 'open') continue;
    if (!active.has(filter)) continue;
    active.delete(filter);
    relaxedFilters.push(filter);
    recommendations = select();
  }
  return { recommendations, relaxedFilters, ecosystemEvidenceUnavailable, limitedCatalog: recommendations.length < 2 && basePool.length < 2 };
}

export function selectRecommendations<T extends QuizProduct>(state: Required<QuizState> | QuizState, products: T[], limit = 4, now = new Date()): T[] {
  return selectRecommendationResult(state, products, limit, now).recommendations;
}

export function getRecommendationReasons(product: QuizProduct, state: Required<QuizState> | QuizState, result?: Pick<QuizRecommendationResult, 'relaxedFilters'>, now = new Date()): string[] {
  if (!state.goal || !state.ecosystem || !state.budget || !state.installation || !state.extra) return [];
  const relaxed = new Set(result?.relaxedFilters ?? []);
  const commerce = getCommerceData(product, now);
  const reasons = ['Matches your selected goal category.'];
  if (state.ecosystem !== 'open') {
    reasons.push(matchesEcosystem(product, state.ecosystem)
      ? 'Selected ecosystem: evidence-backed signal; check the exact supported function, model and setup conditions.'
      : 'Selected ecosystem compatibility is not verified for this product.');
  }
  if (relaxed.has('ecosystem')) reasons.push('Ecosystem preference was relaxed to keep enough goal-category matches.');
  if (!relaxed.has('budget') && state.budget !== 'open' && matchesBudget(product, state.budget, now)) reasons.push('Current authorized price fits your selected budget; verify the final listing price.');
  if (state.budget !== 'open' && commerce.displayPrice === undefined) reasons.push('Current price unavailable; budget match is not verified. Check price on Amazon.');
  if (relaxed.has('budget')) reasons.push('Budget preference was relaxed to keep enough goal-category matches.');
  const installation = getInstallationEvidence(product, now);
  if (installation) {
    reasons.push(`FlowHome setup assessment: ${INSTALLATION_LABELS[installation.assessment]}.`);
    reasons.push(...installation.requirements);
    if (!matchesInstallationPreference(product, state.installation, now)) reasons.push('This setup exceeds your selected preference; review it before buying.');
  } else reasons.push('Installation requirements are not yet verified for this catalog model.');
  if (relaxed.has('installation')) reasons.push('Setup preference was widened to include other goal-category candidates.');
  if (state.extra === 'best-value') reasons.push(commerce.displayPrice !== undefined && commerce.isRatingFresh
    ? 'Current authorized price and owner rating support the value ranking.'
    : 'Value ranking is not verified without current authorized prices and ratings; category fit is used instead.');
  return reasons;
}

export function isMatterFriendly(product: QuizProduct): boolean {
  return hasFeatureEvidence(product, 'matter');
}

// ---------------------------------------------------------------------------
// Block 9 ? Verified compatibility integration (flag-gated, optional)
// ---------------------------------------------------------------------------

/**
 * Selects recommendations from a verified compatibility graph when the flag is
 * on. Products are pre-processed with `applyVerifiedCompatibility`: claims
 * with no verified backing degrade their catalog booleans to `undefined`
 * (Unknown), so the quiz never surfaces an unverified claim as fact. When the
 * environment is missing or `enabled === false`, this is inert and delegates
 * to the existing `selectRecommendationResult` (legacy behavior preserved).
 */
export function selectVerifiedRecommendationResult<T extends QuizProduct>(
  state: Required<QuizState> | QuizState,
  products: T[],
  env?: CompatibilityEnvironment,
  limit = 4,
): QuizRecommendationResult<T> {
  if (!env || !env.enabled || !env.graph) {
    return selectRecommendationResult(state, products, limit);
  }
  const verifiedProducts = prepareQuizCatalog(products, env);
  return selectRecommendationResult(state, verifiedProducts, limit);
}

/** Applies the exact quiz-surface compatibility ledger location before client ranking. */
export function prepareQuizCatalog<T extends QuizProduct>(products: T[], env?: CompatibilityEnvironment): T[] {
  if (!env || !env.enabled || !env.graph) return products;
  return products.map((product) => {
    const slug = typeof product.slug === 'string' ? product.slug : '';
    if (!slug) return product;
    return applyVerifiedCompatibility(product, slug, forCompatibilitySurface(env, 'quiz', slug)) as T;
  });
}

/** Convenience wrapper returning only the recommendation list (verified path). */
export function selectVerifiedRecommendations<T extends QuizProduct>(
  state: Required<QuizState> | QuizState,
  products: T[],
  env?: CompatibilityEnvironment,
  limit = 4,
): T[] {
  return selectVerifiedRecommendationResult(state, products, env, limit).recommendations;
}
