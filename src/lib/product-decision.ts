/** Documentary buying context, not a rating, tested result or compatibility approval. */
export interface ProductDecision {
  model: string;
  market: 'US';
  useCase: string;
  reconsiderIf: string;
  sources: Array<{ label: string; url: string; accessedAt: string }>;
}

const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function getProductDecision(product: { model?: unknown; decisionSummary?: unknown }, now = new Date()): ProductDecision | null {
  if (!text(product.model) || !Number.isFinite(now.getTime())) return null;
  const input = product.decisionSummary;
  if (!input || typeof input !== 'object') return null;
  const decision = input as Partial<ProductDecision>;
  if (decision.model !== product.model || decision.market !== 'US' || !text(decision.useCase) || !text(decision.reconsiderIf)) return null;
  if (!Array.isArray(decision.sources) || decision.sources.length === 0) return null;
  for (const source of decision.sources) {
    if (!source || !text(source.label) || !text(source.url) || !/^\d{4}-\d{2}-\d{2}$/.test(source.accessedAt ?? '')) return null;
    const date = new Date(`${source.accessedAt}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== source.accessedAt || date > now) return null;
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
    } catch { return null; }
  }
  return decision as ProductDecision;
}
