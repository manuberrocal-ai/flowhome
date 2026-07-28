export type QuizPriority = 'security' | 'comfort' | 'cleaning';
export type QuizEcosystem = 'alexa' | 'google' | 'apple' | 'open';
export type QuizBudget = 'under50' | 'under150' | 'open';
export type QuizStepKey = QuizPriority | QuizEcosystem | QuizBudget;

export const PRIORITY_QUIZ_OPTIONS: ReadonlyArray<{
  id: QuizPriority;
  heading: string;
  description: string;
  categories: ReadonlyArray<string>;
}> = [
  {
    id: 'security',
    heading: 'Security first',
    description: 'Cameras, doorbells, locks, motion sensors.',
    categories: ['video-doorbell', 'security-camera', 'smart-lock', 'motion-sensor'],
  },
  {
    id: 'comfort',
    heading: 'Comfort and routines',
    description: 'Speakers, displays, lights, plugs, thermostat, blinds, air purifier.',
    categories: [
      'smart-speaker',
      'smart-display',
      'smart-lighting',
      'smart-plug',
      'smart-thermostat',
      'smart-blinds',
      'air-purifier',
    ],
  },
  {
    id: 'cleaning',
    heading: 'Cleaning and chores',
    description: 'Robot vacuums and the hub that ties them together.',
    categories: ['robot-vacuum', 'smart-hub'],
  },
];

export const ECOSYSTEM_QUIZ_OPTIONS: ReadonlyArray<{
  id: QuizEcosystem;
  heading: string;
  description: string;
}> = [
  { id: 'alexa', heading: 'Alexa', description: 'Amazon Echo ecosystem.' },
  { id: 'google', heading: 'Google Home', description: 'Google Nest ecosystem.' },
  { id: 'apple', heading: 'Apple HomeKit', description: 'Apple Home ecosystem.' },
  { id: 'open', heading: 'No preference', description: 'Show me everything; highlight Matter-friendly gear.' },
];

export const BUDGET_QUIZ_OPTIONS: ReadonlyArray<{
  id: QuizBudget;
  heading: string;
  description: string;
  maxPrice?: number;
}> = [
  { id: 'under50', heading: 'Up to $50', description: 'Low commitment starter gear.', maxPrice: 50 },
  { id: 'under150', heading: 'Up to $150', description: 'A little more room for a stronger pick.', maxPrice: 150 },
  { id: 'open', heading: 'No budget limit', description: 'Show the strongest matches regardless of price.' },
];

export const QUIZ_OPTION_GROUPS = [
  PRIORITY_QUIZ_OPTIONS,
  ECOSYSTEM_QUIZ_OPTIONS,
  BUDGET_QUIZ_OPTIONS,
] as const;

export interface QuizState {
  priority: QuizPriority | '';
  ecosystem: QuizEcosystem | '';
  budget: QuizBudget | '';
}

export function createInitialQuizState(): QuizState {
  return { priority: '', ecosystem: '', budget: '' };
}

export function getQuizStepLabel(step: number): string {
  switch (step) {
    case 1:
      return 'Choose your first priority';
    case 2:
      return 'Pick your ecosystem';
    case 3:
      return 'Set your budget';
    default:
      return '';
  }
}

interface RateableProduct {
  ownerRating?: number;
  ownerRatingCount?: number;
  priority?: string;
  price?: number;
}

function scoreProduct(product: RateableProduct): number {
  const rating = Number(product.ownerRating ?? 0);
  const count = Number(product.ownerRatingCount ?? 0);
  const base = rating * Math.log10(count + 1);
  const priorityBoost = product.priority === 'hero' ? 4 : product.priority === 'featured' ? 2 : 0;
  return base + priorityBoost;
}

function byScoreThenPrice(a: RateableProduct, b: RateableProduct): number {
  const scoreDiff = scoreProduct(b) - scoreProduct(a);
  if (scoreDiff !== 0) return scoreDiff;
  return Number(a.price ?? 0) - Number(b.price ?? 0);
}

function matchesEcosystem(product: any, ecosystem: QuizEcosystem): boolean {
  if (ecosystem === 'open') return true;
  if (ecosystem === 'alexa') return Boolean(product.alexaCompatible);
  if (ecosystem === 'google') return Boolean(product.googleHomeCompatible);
  if (ecosystem === 'apple') return Boolean(product.appleHomeKit);
  return true;
}

function matchesBudget(product: any, budget: QuizBudget): boolean {
  if (budget === 'open') return true;
  const option = BUDGET_QUIZ_OPTIONS.find((opt) => opt.id === budget);
  if (!option || option.maxPrice == null) return true;
  return Number(product.price ?? 0) <= option.maxPrice;
}

function matchesPriorityAndActive(product: any, priority: QuizPriority): boolean {
  const option = PRIORITY_QUIZ_OPTIONS.find((opt) => opt.id === priority);
  if (!option) return false;
  return Boolean(product.catalogActive) && option.categories.includes(product.category);
}

/**
 * Select up to `limit` catalog-active products matching the quiz state.
 * Relaxation strategy when results are thin (< 2): drop budget first, then ecosystem.
 * Category priority is never relaxed; we always keep the user's primary intent.
 */
export function selectRecommendations(
  state: { priority: QuizPriority; ecosystem: QuizEcosystem; budget: QuizBudget },
  products: any[],
  limit = 6,
): any[] {
  const basePool = products.filter((product) => matchesPriorityAndActive(product, state.priority));

  const strict = basePool
    .filter((product) => matchesEcosystem(product, state.ecosystem) && matchesBudget(product, state.budget))
    .sort(byScoreThenPrice)
    .slice(0, limit);
  if (strict.length >= 2) return strict;

  const relaxedBudget = basePool
    .filter((product) => matchesEcosystem(product, state.ecosystem))
    .sort(byScoreThenPrice)
    .slice(0, limit);
  if (relaxedBudget.length >= 2) return relaxedBudget;

  const relaxedEcosystem = basePool.sort(byScoreThenPrice).slice(0, limit);
  return relaxedEcosystem;
}

export function isMatterFriendly(product: any): boolean {
  return Boolean(product.matter);
}
