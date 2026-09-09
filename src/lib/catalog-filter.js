/** Match catalog text without treating punctuation or accents as model differences. */
export function normalizeCatalogText(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchesCatalogQuery(product, query = '', category = '') {
  if (category && product.category !== category) return false;
  const terms = normalizeCatalogText(query).split(' ').filter(Boolean);
  const text = normalizeCatalogText([product.name, product.brand, product.model, product.category].filter(Boolean).join(' '));
  return terms.every(term => text.includes(term));
}
