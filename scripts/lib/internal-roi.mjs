export const MIN_COMMISSION = {
  seed: 1,
  growth: 5,
};

export const SMART_HOME_COMMISSION_RATE = {
  'smart-speaker': 0.04,
  'smart-display': 0.04,
  'smart-doorbell': 0.04,
  'video-doorbell': 0.04,
  'security-camera': 0.04,
  'smart-lock': 0.03,
  'smart-lighting': 0.03,
  'smart-plug': 0.03,
  'smart-thermostat': 0.03,
  'robot-vacuum': 0.03,
  'smart-hub': 0.04,
  'smart-tv': 0.02,
  'streaming-device': 0.04,
  'smart-sensor': 0.03,
  'smart-blind': 0.03,
  'smart-kitchen': 0.045,
  'smart-garden': 0.03,
  'smart-pet': 0.03,
};

export function estimateCommission(product) {
  const rate = SMART_HOME_COMMISSION_RATE[product.category] ?? 0.04;
  return Number((Number(product.price || 0) * rate).toFixed(2));
}

export function evaluateInternalProduct(product, phase = 'seed') {
  const price = Number(product.price || 0);
  const rating = Number(product.rating || 0);
  const reviewCount = Number(product.reviewCount || 0);
  const discountPct = Number(product.discountPct || 0);
  const commission = estimateCommission(product);
  const minCommission = MIN_COMMISSION[phase] ?? MIN_COMMISSION.seed;
  const reasons = [];
  let score = 0;

  if (commission >= minCommission) {
    score += 35;
    reasons.push(`commission clears ${phase} threshold ($${commission} >= $${minCommission})`);
  } else {
    reasons.push(`commission below ${phase} threshold ($${commission} < $${minCommission})`);
  }

  if (price >= 80 && price <= 600) { score += 20; reasons.push('healthy ticket size'); }
  else if (price >= 35) { score += 10; reasons.push('acceptable ticket size'); }

  if (rating >= 4.5) { score += 15; reasons.push('strong rating'); }
  else if (rating >= 4.2) { score += 10; reasons.push('solid rating'); }

  if (reviewCount >= 10000) { score += 15; reasons.push('high review volume'); }
  else if (reviewCount >= 2500) { score += 10; reasons.push('meaningful review volume'); }

  if (discountPct >= 30) { score += 10; reasons.push('strong deal angle'); }
  else if (discountPct >= 15) { score += 5; reasons.push('moderate deal angle'); }

  if (product.matter || product.alexaCompatible || product.googleHomeCompatible || product.appleHomeKit) {
    score += 5;
    reasons.push('clear ecosystem compatibility');
  }

  const approved = commission >= minCommission && rating >= 4.1 && reviewCount >= 1000;
  const tier = score >= 80 ? 'lead' : score >= 65 ? 'test' : score >= 50 ? 'watchlist' : 'reject';

  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    price,
    rating,
    reviewCount,
    discountPct,
    estimatedCommission: commission,
    phase,
    minCommission,
    approved,
    internalScore: score,
    internalTier: approved ? tier : 'reject',
    reasons,
    publicFacing: false,
  };
}
