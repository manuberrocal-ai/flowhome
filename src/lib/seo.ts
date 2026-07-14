/**
 * SEO Utilities - Meta tags, Schema.org JSON-LD, sitemap helpers
 */

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
    author = 'FlowHome Team',
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

export function generateProductSchema(product: any) {
  const SITE = 'https://flowhome.dev';
  const toAbsolute = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : new URL(url, SITE).href;
  };
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
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: product.affiliateUrl,
    },
    ...(product.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    } : {}),
  };
}

export function generateReviewSchema(review: any, product: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: generateProductSchema(product),
    author: {
      '@type': 'Organization',
      name: 'FlowHome',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: product.rating || 4.5,
      bestRating: '5',
    },
    datePublished: review.pubDate,
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
    sameAs: [
      'https://dev.to/flowhome',
      'https://hashnode.com/@flowhome',
    ],
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
