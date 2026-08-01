import { applyVerifiedCompatibility, type CompatibilityEnvironment } from './blocks/block9/compatibility-adapter.ts';
import { forCompatibilitySurface } from './blocks/block9/runtime.ts';
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
  { id: 'alexa', heading: 'Alexa', description: 'Prefer products marked as Alexa compatible.' },
  { id: 'google', heading: 'Google Home', description: 'Prefer products marked as Google Home compatible.' },
  { id: 'apple', heading: 'Apple Home', description: 'Prefer products marked as Apple Home compatible.' },
  { id: 'smartthings', heading: 'SmartThings', description: 'Prioritize Matter or Zigbee candidates; verify exact compatibility before buying.' },
  { id: 'open', heading: 'No preference', description: 'Keep ecosystem compatibility open.' },
];

export const BUDGET_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizBudget; heading: string; description: string; maxPrice?: number }> = [
  { id: 'under50', heading: 'Up to $50', description: 'Low-commitment starter gear.', maxPrice: 50 },
  { id: 'under150', heading: 'Up to $150', description: 'More room for a stronger pick.', maxPrice: 150 },
  { id: 'open', heading: 'No budget limit', description: 'Rank the strongest category matches regardless of price.' },
];

export const INSTALLATION_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizInstallation; heading: string; description: string }> = [
  { id: 'plug-and-play', heading: 'Plug-and-play', description: 'Favor categories that usually need the least setup.' },
  { id: 'light-setup', heading: 'Light setup', description: 'A reasonable fit for a little guided setup.' },
  { id: 'advanced', heading: 'Advanced', description: 'Open to categories that may need more planning or installation.' },
];

export const EXTRA_PRIORITY_QUIZ_OPTIONS: ReadonlyArray<{ id: QuizExtraPriority; heading: string; description: string }> = [
  { id: 'privacy', heading: 'Privacy', description: 'Favor a listed no-subscription signal when the catalog records it.' },
  { id: 'local-control', heading: 'Local control', description: 'Favor Matter or Zigbee signals where recorded.' },
  { id: 'ease-of-use', heading: 'Ease of use', description: 'Favor recorded app, Wi-Fi, or editorial priority signals.' },
  { id: 'best-value', heading: 'Best value', description: 'Balance the price snapshot with the recorded owner rating.' },
  { id: 'open', heading: 'No extra priority', description: 'Keep the final ranking focused on the first four answers.' },
];

export const QUIZ_OPTION_GROUPS = [GOAL_QUIZ_OPTIONS, ECOSYSTEM_QUIZ_OPTIONS, BUDGET_QUIZ_OPTIONS, INSTALLATION_QUIZ_OPTIONS, EXTRA_PRIORITY_QUIZ_OPTIONS] as const;

export interface QuizState {
  goal: QuizGoal | '';
  ecosystem: QuizEcosystem | '';
  budget: QuizBudget | '';
  installation: QuizInstallation | '';
  extra: QuizExtraPriority | '';
}

export interface QuizProduct {
  slug: string;
  category: string;
  catalogActive?: boolean;
  price?: number;
  ownerRating?: number;
  ownerRatingCount?: number;
  priority?: string;
  alexaCompatible?: boolean;
  googleHomeCompatible?: boolean;
  appleHomeKit?: boolean;
  matter?: boolean;
  zigbee?: boolean;
  wifi?: boolean;
  appControl?: boolean;
  subscriptionRequired?: boolean;
  hasSubscriptionRequired?: boolean;
  [key: string]: unknown;
}

export interface QuizRecommendationResult<T extends QuizProduct = QuizProduct> {
  recommendations: T[];
  relaxedFilters: Array<'budget' | 'installation' | 'ecosystem'>;
  limitedCatalog: boolean;
}

const installationCategories: Record<QuizInstallation, ReadonlyArray<string>> = {
  'plug-and-play': ['smart-plug', 'smart-lighting', 'smart-speaker', 'smart-display', 'air-purifier'],
  'light-setup': ['smart-thermostat', 'robot-vacuum', 'motion-sensor'],
  advanced: ['video-doorbell', 'security-camera', 'smart-lock', 'garage-door-opener', 'smart-blinds'],
};

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

function scoreProduct(product: QuizProduct, extra: QuizExtraPriority | '' = ''): number {
  const rating = Number(product.ownerRating ?? 0);
  const count = Number(product.ownerRatingCount ?? 0);
  let score = rating * Math.log10(count + 1) + (product.priority === 'hero' ? 4 : product.priority === 'featured' ? 2 : 0);
  if (extra === 'privacy' && product.hasSubscriptionRequired === true && product.subscriptionRequired === false) score += 3;
  if (extra === 'local-control' && (product.matter || product.zigbee)) score += 3;
  if (extra === 'ease-of-use' && (product.appControl || product.wifi || product.priority === 'hero' || product.priority === 'featured')) score += 2;
  if (extra === 'best-value' && Number.isFinite(Number(product.price)) && Number(product.price) > 0 && rating > 0) score += Math.min(4, (rating * 30) / Number(product.price));
  return score;
}

function byScoreThenPriceAndSlug(extra: QuizExtraPriority | '') {
  return (a: QuizProduct, b: QuizProduct): number => {
    const scoreDiff = scoreProduct(b, extra) - scoreProduct(a, extra);
    if (scoreDiff !== 0) return scoreDiff;
    const priceDiff = Number(a.price ?? Number.MAX_SAFE_INTEGER) - Number(b.price ?? Number.MAX_SAFE_INTEGER);
    if (priceDiff !== 0) return priceDiff;
    return a.slug.localeCompare(b.slug);
  };
}

function matchesEcosystem(product: QuizProduct, ecosystem: QuizEcosystem): boolean {
  if (ecosystem === 'open') return true;
  if (ecosystem === 'alexa') return product.alexaCompatible === true;
  if (ecosystem === 'google') return product.googleHomeCompatible === true;
  if (ecosystem === 'apple') return product.appleHomeKit === true;
  return product.matter === true || product.zigbee === true;
}

function matchesBudget(product: QuizProduct, budget: QuizBudget): boolean {
  const option = BUDGET_QUIZ_OPTIONS.find((item) => item.id === budget);
  return !option?.maxPrice || Number(product.price) <= option.maxPrice;
}

function matchesInstallation(product: QuizProduct, installation: QuizInstallation): boolean {
  return installationCategories[installation].includes(product.category);
}

function matchesGoalAndActive(product: QuizProduct, goal: QuizGoal): boolean {
  return product.catalogActive === true && Boolean(GOAL_QUIZ_OPTIONS.find((option) => option.id === goal)?.categories.includes(product.category));
}

/** Selects two to four deterministic category matches, relaxing only budget, setup fit, then ecosystem. */
export function selectRecommendationResult<T extends QuizProduct>(state: Required<QuizState> | QuizState, products: T[], limit = 4): QuizRecommendationResult<T> {
  if (!state.goal || !state.ecosystem || !state.budget || !state.installation || !state.extra) return { recommendations: [], relaxedFilters: [], limitedCatalog: false };
  const maximum = Math.min(4, Math.max(2, Math.floor(Number(limit) || 4)));
  const basePool = products.filter((product) => matchesGoalAndActive(product, state.goal as QuizGoal));
  const active = new Set(['budget', 'installation', 'ecosystem']);
  const relaxedFilters: Array<'budget' | 'installation' | 'ecosystem'> = [];
  const select = () => basePool
    .filter((product) => (!active.has('budget') || matchesBudget(product, state.budget as QuizBudget))
      && (!active.has('installation') || matchesInstallation(product, state.installation as QuizInstallation))
      && (!active.has('ecosystem') || matchesEcosystem(product, state.ecosystem as QuizEcosystem)))
    .sort(byScoreThenPriceAndSlug(state.extra))
    .slice(0, maximum);

  let recommendations = select();
  for (const filter of ['budget', 'installation', 'ecosystem'] as const) {
    if (recommendations.length >= 2) break;
    const value = state[filter];
    if ((filter === 'budget' || filter === 'ecosystem') && value === 'open') continue;
    active.delete(filter);
    relaxedFilters.push(filter);
    recommendations = select();
  }
  return { recommendations, relaxedFilters, limitedCatalog: recommendations.length < 2 && basePool.length < 2 };
}

export function selectRecommendations<T extends QuizProduct>(state: Required<QuizState> | QuizState, products: T[], limit = 4): T[] {
  return selectRecommendationResult(state, products, limit).recommendations;
}

export function getRecommendationReasons(product: QuizProduct, state: Required<QuizState> | QuizState, result?: Pick<QuizRecommendationResult, 'relaxedFilters'>): string[] {
  if (!state.goal || !state.ecosystem || !state.budget || !state.installation || !state.extra) return [];
  const relaxed = new Set(result?.relaxedFilters ?? []);
  const reasons = ['Matches your selected goal category.'];
  if (!relaxed.has('ecosystem')) {
    if (state.ecosystem === 'alexa' && product.alexaCompatible) reasons.push('Marked as Alexa compatible.');
    if (state.ecosystem === 'google' && product.googleHomeCompatible) reasons.push('Marked as Google Home compatible.');
    if (state.ecosystem === 'apple' && product.appleHomeKit) reasons.push('Marked as Apple Home compatible.');
    if (state.ecosystem === 'smartthings' && (product.matter || product.zigbee)) reasons.push('SmartThings candidate via Matter or Zigbee; verify exact compatibility.');
  } else reasons.push('Ecosystem preference was relaxed to keep enough goal-category matches.');
  if (!relaxed.has('budget') && state.budget !== 'open' && matchesBudget(product, state.budget)) reasons.push('Price snapshot fits your selected budget.');
  if (relaxed.has('budget')) reasons.push('Budget preference was relaxed to keep enough goal-category matches.');
  if (!relaxed.has('installation') && matchesInstallation(product, state.installation)) reasons.push(`Setup fit estimate: ${state.installation}; verify the listing or installer needs.`);
  if (relaxed.has('installation')) reasons.push('Setup-fit preference was relaxed; verify the listing or installer needs.');
  if (state.extra === 'privacy' && product.hasSubscriptionRequired === true && product.subscriptionRequired === false) reasons.push('Catalog lists no subscription required.');
  if (state.extra === 'local-control' && (product.matter || product.zigbee)) reasons.push('Recorded Matter or Zigbee signal supports your local-control preference.');
  if (state.extra === 'ease-of-use' && (product.appControl || product.wifi || product.priority === 'hero' || product.priority === 'featured')) reasons.push('Recorded app, Wi-Fi, or editorial-priority signal supports ease of use.');
  if (state.extra === 'best-value' && Number(product.price) > 0 && Number(product.ownerRating) > 0) reasons.push('Price snapshot and recorded owner rating support the value ranking.');
  return reasons;
}

export function isMatterFriendly(product: QuizProduct): boolean {
  return product.matter === true;
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
  const verifiedProducts = products.map((product) => {
    const slug = typeof product.slug === 'string' ? product.slug : '';
    if (!slug) return product;
    return applyVerifiedCompatibility(product, slug, env) as T;
  });
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
