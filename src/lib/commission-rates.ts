/**
 * Amazon US Commission Rates 2026
 * Source: Amazon Associates Operating Agreement (updated April 14, 2026)
 */

export const COMMISSION_RATES: Record<string, number> = {
  'luxury-beauty': 0.10,
  'digital-music': 0.05,
  'physical-music': 0.05,
  'handmade': 0.05,
  'digital-videos': 0.05,
  'physical-books': 0.045,
  'kitchen': 0.045,
  'automotive': 0.045,
  'amazon-echo-devices': 0.04,
  'amazon-fire-tv-devices': 0.04,
  'amazon-ring-devices': 0.04,
  'amazon-kindle-devices': 0.04,
  'amazon-fire-tablet': 0.04,
  'fashion-private-label': 0.04,
  'watches': 0.04,
  'jewelry': 0.04,
  'luggage': 0.04,
  'shoes': 0.04,
  'handbags': 0.04,
  'all-other': 0.04,
  'toys': 0.03,
  'furniture': 0.03,
  'home': 0.03,
  'home-improvement': 0.03,
  'lawn-garden': 0.03,
  'pets': 0.03,
  'headphones': 0.03,
  'beauty': 0.03,
  'musical-instruments': 0.03,
  'outdoors': 0.03,
  'tools': 0.03,
  'sports': 0.03,
  'baby': 0.03,
  'pc': 0.025,
  'pc-components': 0.025,
  'dvd-blu-ray': 0.025,
  'televisions': 0.02,
  'digital-video-games': 0.02,
  'grocery': 0.01,
  'health-personal-care': 0.01,
  'physical-video-games': 0.01,
};

/**
 * Smart Home category mapping
 * Maps product categories to Amazon commission categories
 */
export const SMART_HOME_CATEGORY_MAP: Record<string, string> = {
  'smart-speaker': 'amazon-echo-devices',
  'smart-display': 'amazon-echo-devices',
  'smart-doorbell': 'amazon-ring-devices',
  'security-camera': 'amazon-ring-devices',
  'smart-lock': 'home-improvement',
  'smart-lighting': 'home',
  'smart-plug': 'home',
  'smart-thermostat': 'home-improvement',
  'robot-vacuum': 'home',
  'smart-hub': 'amazon-echo-devices',
  'smart-tv': 'televisions',
  'streaming-device': 'amazon-fire-tv-devices',
  'smart-sensor': 'home',
  'smart-blind': 'home',
  'video-doorbell': 'amazon-ring-devices',
  'garage-door-opener': 'home-improvement',
  'smart-smoke-alarm': 'home-improvement',
  'smart-pet': 'pets',
  'smart-kitchen': 'kitchen',
  'smart-garden': 'lawn-garden',
};

export function getCommissionRate(category: string): number {
  const amazonCategory = SMART_HOME_CATEGORY_MAP[category] || 'all-other';
  return COMMISSION_RATES[amazonCategory] || 0.04;
}

export function getAmazonCategory(category: string): string {
  return SMART_HOME_CATEGORY_MAP[category] || 'all-other';
}
