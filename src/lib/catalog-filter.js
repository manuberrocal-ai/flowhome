/** Match catalog text without treating punctuation or accents as model differences. */
export function normalizeCatalogText(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchesCatalogQuery(product, query = '', category = '', installation = '') {
  if (category && product.category !== category) return false;
  if (installation && product.installation !== installation) return false;
  const terms = normalizeCatalogText(query).split(' ').filter(Boolean);
  const text = normalizeCatalogText([product.name, product.brand, product.model, product.category].filter(Boolean).join(' '));
  return terms.every(term => text.includes(term));
}

/** Read only supported filters; unknown setup evidence never becomes a match. */
export function readCatalogFilters(search, categories = []) {
  const params = new URLSearchParams(search);
  const category = params.get('category') ?? '';
  const installation = params.get('setup') ?? '';
  return {
    query: (params.get('q') ?? '').slice(0, 120),
    category: categories.includes(category) ? category : '',
    installation: ['plug-and-play', 'light-setup', 'advanced'].includes(installation) ? installation : '',
  };
}

export function writeCatalogFilters(search, filters) {
  const params = new URLSearchParams(search);
  for (const [key, value] of [['q', filters.query.trim().slice(0, 120)], ['category', filters.category], ['setup', filters.installation]]) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  return params.toString();
}
