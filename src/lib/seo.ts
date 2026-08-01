import { getCommerceData } from './commerce-data.ts';

export interface SEOConfig {
  title: string;
  description: string;
  canonicalURL: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  publishedDate?: string;
  modifiedDate?: string;
  author?: string;
}

export function generateMetaTags(config: SEOConfig) {
  const {
    title,
    description,
    canonicalURL,
    image = '/images/og-default.png',
    type = 'website',
    publishedDate,
    modifiedDate,
    author = 'FlowHome Editorial Team',
  } = config;

  return [
    { title },
    { name: 'description', content: description },
    { name: 'generator', content: 'Astro v7' },
    { name: 'author', content: author },
    { rel: 'canonical', href: canonicalURL },
    { property: 'og:type', content: type },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonicalURL },
    { property: 'og:image', content: image },
    { property: 'og:site_name', content: 'FlowHome' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'robots', content: 'index, follow' },
    ...(publishedDate ? [{ name: 'article:published_time', content: publishedDate }] : []),
    ...(modifiedDate ? [{ name: 'article:modified_time', content: modifiedDate }] : []),
  ];
}

export function generateProductSchema(product: any, now = new Date()) {
  const SITE = 'https://flowhome.dev';
  const toAbsolute = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : new URL(url, SITE).href;
  };
  const commerce = getCommerceData(product, now);
  const offer = commerce.hasOffer ? {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'USD',
    url: product.affiliateUrl,
    ...(commerce.priceValidUntil ? { priceValidUntil: commerce.priceValidUntil } : {}),
    ...(commerce.availability ? { availability: commerce.availability } : {}),
  } : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Unknown',
    },
    image: toAbsolute(product.image || '/images/og-default.svg'),
    ...(product.slug ? { url: `https://flowhome.dev/product/${product.slug}/` } : {}),
    ...(offer ? { offers: offer } : {}),
  };
}

export function generateReviewSchema(review: any, product: any, now = new Date()) {
  const editorialRating = getValidEditorialRating(review);
  const hasEditorialRating = Boolean(editorialRating);
  const { '@context': _context, ...itemReviewed } = generateProductSchema(product, now);
  const reviewRating = hasEditorialRating && editorialRating ? {
    '@type': 'Rating',
    ratingValue: editorialRating.rating,
    bestRating: String(editorialRating.scale),
  } : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed,
    author: {
      '@type': 'Organization',
      name: 'FlowHome Editorial Team',
    },
    ...(reviewRating ? { reviewRating } : {}),
    datePublished: review.pubDate,
  };
}

export function getValidEditorialRating(review: any) {
  const rating = Number(review?.editorialRating);
  const scale = Number(review?.editorialRatingScale ?? 5);
  return Number.isFinite(rating) && Number.isFinite(scale) && scale > 0 && rating > 0 && rating <= scale
    ? { rating, scale }
    : undefined;
}

export function generateItemListSchema(products: any[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://flowhome.dev/product/${product.slug}/`,
      name: product.name,
    })),
    url,
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((bc, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: bc.name,
      item: bc.url,
    })),
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FlowHome',
    url: 'https://flowhome.dev',
    logo: 'https://flowhome.dev/images/flowhome-logo.svg',
    description: 'Smart home product reviews, comparisons, and deals',
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FlowHome',
    url: 'https://flowhome.dev',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://flowhome.dev/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
