import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const reviews = await getCollection('reviews');
  return rss({
    title: 'FlowHome Smart Home Reviews',
    description: 'Smart home reviews, deals, comparisons, and buying guides.',
    site: context.site,
    customData:
      `<language>en-us</language>` +
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="hub" href="https://pubsubhubbub.appspot.com/" />` +
      `<atom:link xmlns:atom="http://www.w3.org/2005/Atom" rel="self" href="https://flowhome.dev/rss.xml" />`,
    items: reviews.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/review/${post.id}/`,
    })),
  });
}