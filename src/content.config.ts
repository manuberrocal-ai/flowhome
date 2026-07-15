import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const productsCollection = defineCollection({
  loader: glob({ base: './src/content/products', pattern: '**/*.{yaml,yml}' }),
  schema: z.object({
    slug: z.string(),
    asin: z.string(),
    name: z.string(),
    brand: z.string().default('Unknown'),
    price: z.number(),
    originalPrice: z.number().optional(),
    discountPct: z.number().default(0),
    category: z.string(),
    affiliateUrl: z.string(),
    image: z.string().optional(),
    rating: z.number().default(0),
    reviewCount: z.number().default(0),
    available: z.boolean().default(true),
    dateUpdated: z.string(),

    // General
    model: z.string().optional(),
    releaseDate: z.string().optional(),
    weight: z.string().optional(),
    dimensions: z.string().optional(),
    color: z.string().optional(),

    // Connectivity
    wifi: z.boolean().default(false),
    bluetooth: z.boolean().default(false),
    zigbee: z.boolean().default(false),
    matter: z.boolean().default(false),
    alexaCompatible: z.boolean().default(false),
    googleHomeCompatible: z.boolean().default(false),
    appleHomeKit: z.boolean().default(false),
    appControl: z.boolean().default(false),

    // Power
    voltage: z.string().optional(),
    powerWatts: z.number().optional(),
    batteryIncluded: z.boolean().default(false),
    batteryLife: z.string().optional(),
    standbyPowerWatts: z.number().optional(),

    // Camera
    resolution: z.string().optional(),
    nightVision: z.boolean().default(false),
    fieldOfView: z.number().optional(),
    twoWayAudio: z.boolean().default(false),
    storage: z.string().optional(),
    subscriptionRequired: z.boolean().default(false),

    // Robot Vacuum
    suctionPower: z.number().optional(),
    batteryRuntime: z.number().optional(),
    dustCapacity: z.number().optional(),
    hasMop: z.boolean().default(false),
    lidarMapping: z.boolean().default(false),
    obstacleDetection: z.boolean().default(false),
    noiseLevel: z.number().optional(),

    // Smart Lighting
    lumens: z.number().optional(),
    colorTemp: z.string().optional(),
    rgb: z.boolean().default(false),
    dimmable: z.boolean().default(false),

    // Smart Plug
    amperage: z.number().optional(),
    energyMonitoring: z.boolean().default(false),
    surgeProtection: z.boolean().default(false),
    usbPorts: z.number().default(0),

    // Display/Audio
    screenSize: z.string().optional(),
    screenResolution: z.string().optional(),
    speakers: z.string().optional(),

    // ROI System
    priority: z.enum(['rejected', 'standard', 'featured', 'hero']).default('standard'),
    priorityScore: z.number().default(0),
    roiApproved: z.boolean().default(true),
  }),
});

const reviewsCollection = defineCollection({
  loader: glob({ base: './src/content/reviews', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    productSlug: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    qualityScore: z.number().default(0),
  }),
});

const dealsCollection = defineCollection({
  loader: glob({ base: './src/content/deals', pattern: '**/*.{yaml,yml}' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    productSlug: z.string().optional(),
    asin: z.string(),
    originalPrice: z.number(),
    dealPrice: z.number(),
    discountPct: z.number(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    affiliateUrl: z.string(),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

const bestOfCollection = defineCollection({
  loader: glob({ base: './src/content/best-of', pattern: '**/*.{yaml,yml}' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    maxPrice: z.number(),
    productSlugs: z.array(z.string()),
    pubDate: z.coerce.date().default(() => new Date()),
    intro: z.string().optional(),
    buyingConsiderations: z.array(z.object({
      label: z.string(),
      detail: z.string(),
    })).optional(),
    comparisonSlug: z.string().optional(),
    comparisonLabel: z.string().optional(),
    reviewSlugs: z.array(z.string()).optional(),
  }),
});

const categoriesCollection = defineCollection({
  loader: glob({ base: './src/content/categories', pattern: '**/*.{yaml,yml}' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    icon: z.string().optional(),
  }),
});

export const collections = {
  products: productsCollection,
  reviews: reviewsCollection,
  deals: dealsCollection,
  'best-of': bestOfCollection,
  categories: categoriesCollection,
};
