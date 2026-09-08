/**
 * Gross avoided electricity use, not measured savings or a product recommendation.
 * @returns {{ status: 'invalid' | 'no_savings' } | { status: 'estimated', monthly: number, annual: number, payback: number }}
 */
export function calculateEnergySavings({ watts, hours, rate, cost } = {}) {
  if (![watts, hours, rate, cost].every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0) || hours > 24) return { status: 'invalid' };
  if (watts === 0 || hours === 0 || rate === 0) return { status: 'no_savings' };
  const monthly = (watts / 1000) * hours * 30 * rate;
  const annual = monthly * 12;
  const payback = cost / monthly;
  if (monthly <= 0 || ![monthly, annual, payback].every(Number.isFinite)) return { status: 'invalid' };
  return { status: 'estimated', monthly, annual, payback };
}
