import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const [reviews, guides, deals] = await Promise.all([
    getCollection('reviews'),
    getCollection('best-of'),
    getCollection('deals'),
  ]);
  const items = [
    ...reviews.map((item) => ({
      type: 'review', title: item.data.title, description: item.data.description,
      pubDate: item.data.pubDate, link: `/review/${item.id}/`,
    })),
    ...guides.map((item) => ({
      type: 'best-of', title: item.data.title, description: item.data.description,
      pubDate: item.data.pubDate, link: `/best/${item.data.slug}/`,
    })),
    ...deals.map((item) => ({
      type: 'deal', title: item.data.title, description: `Deal information for ${item.data.title}. Verify price and availability before buying.`,
      pubDate: item.data.startDate, link: `/deals/#${item.data.slug}`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf() || a.type.localeCompare(b.type) || a.link.localeCompare(b.link));
  return rss({
    title: 'FlowHome Smart Home Reviews',
    description: 'Smart home reviews, deals, comparisons, and buying guides.',
    site: context.site,
    customData:
      `<language>en-us</language>` +
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="hub" href="https://pubsubhubbub.appspot.com/" />` +
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="self" href="https://flowhome.dev/rss.xml" />`,
    items,
  });
}
