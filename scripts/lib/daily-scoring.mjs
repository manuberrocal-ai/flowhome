// Editorial prioritization, never a prediction of sales or a lowest-price claim.
export const DEAL_WEIGHTS = Object.freeze({ historicalDiscount: 25, freshness: 15, relevance: 15, demand: 15, conversion: 15, availability: 10, editorial: 5 });
export const OPPORTUNITY_WEIGHTS = Object.freeze({ searchGap: 30, contentGap: 25, decay: 20, relevance: 15, conversionGap: 10 });
export const TREND_WEIGHTS = Object.freeze({ searchGrowth: 40, demand: 30, relevance: 30 });

export function scoreSignals(signals, weights) {
  const components = [];
  const missing = [];
  let points = 0;
  let coverage = 0;
  if (Object.values(weights).some((weight) => !Number.isFinite(weight) || weight < 0) || Object.values(weights).reduce((a, b) => a + b, 0) !== 100) throw new Error('invalid_score_weights');
  for (const [name, weight] of Object.entries(weights)) {
    const signal = signals[name];
    if (!signal || typeof signal.value !== 'number' || !Number.isFinite(signal.value) || signal.value < 0 || signal.value > 1 || typeof signal.evidence !== 'string' || !signal.evidence.trim()) {
      missing.push(name);
      continue;
    }
    coverage += weight;
    points += signal.value * weight;
    components.push({ name, value: signal.value, weight, evidence: signal.evidence });
  }
  return {
    score: coverage ? Math.round(points * 100) / 100 : null,
    coverage, components, missing,
    // Missing evidence is NOT redistributed to inflate the remaining signals.
    interpretation: 'Evidence-backed points out of 100; incomplete when coverage is below 100. Not a verified deal or sales forecast.',
  };
}
