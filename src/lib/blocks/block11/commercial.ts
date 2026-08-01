import type { CommercialClassification } from './contracts.ts';

export type CommercialContent = Readonly<{ id: string; classification: CommercialClassification; editorialRank: number; commissionMinor: number; feeMinor: number; retailerId: string | null; manufacturerId: string | null }>;
export const DEFAULT_CONCENTRATION_GUARDRAILS = Object.freeze({ retailerMaxShare: 0.4, manufacturerMaxShare: 0.4, minimumDistinctRetailers: 3, minimumDistinctManufacturers: 3, sampleThreshold: 10 });

/** Sponsored items are excluded; monetary fields are intentionally absent from the sort key. */
export function rankEditorial(items: readonly CommercialContent[]): CommercialContent[] {
  return items.filter((item) => item.classification === 'editorial').sort((left, right) => right.editorialRank - left.editorialRank || left.id.localeCompare(right.id));
}

export function evaluateConcentration(items: readonly CommercialContent[], guardrails = DEFAULT_CONCENTRATION_GUARDRAILS): Readonly<{ allowed: boolean; breaches: readonly string[] }> {
  if (!items.every((item) => item.retailerId && item.manufacturerId && item.retailerId !== 'unknown' && item.manufacturerId !== 'unknown')) return { allowed: false, breaches: ['unknown_retailer_or_manufacturer_fail_closed'] };
  if (items.length < guardrails.sampleThreshold) return { allowed: true, breaches: [] };
  const breaches: string[] = [];
  const evaluate = (values: string[], maximum: number, minimum: number, label: string) => {
    const counts = new Map<string, number>(); values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    if (counts.size < minimum) breaches.push(`${label}_minimum_distinct`);
    if ([...counts.values()].some((count) => count / values.length > maximum)) breaches.push(`${label}_max_share`);
  };
  evaluate(items.map((item) => item.retailerId as string), guardrails.retailerMaxShare, guardrails.minimumDistinctRetailers, 'retailer');
  evaluate(items.map((item) => item.manufacturerId as string), guardrails.manufacturerMaxShare, guardrails.minimumDistinctManufacturers, 'manufacturer');
  return { allowed: breaches.length === 0, breaches };
}
