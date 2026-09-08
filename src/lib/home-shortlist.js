/** Editorial research paths, not a quality, popularity or compatibility ranking. */
export const HOME_SHORTLIST = Object.freeze([
  { slug: 'echo-dot-5th-gen', reason: 'Explore voice control and speaker placement.' },
  { slug: 'tp-link-kasa-smart-plug-mini', reason: 'Research outlet control before choosing a plug.' },
  { slug: 'ring-video-doorbell-wired', reason: 'Explore the requirements of a wired doorbell.' },
  { slug: 'amazon-smart-thermostat', reason: 'Start with thermostat wiring and installation checks.' },
  { slug: 'philips-hue-white-color-starter-kit', reason: 'Research a lighting kit and its required components.' },
  { slug: 'aqara-hub-m2', reason: 'Explore the role of a hub before selecting accessories.' },
  { slug: 'roborock-q5-plus', reason: 'Compare robot-vacuum setup and maintenance needs.' },
  { slug: 'eufy-security-indoor-cam-c120', reason: 'Research indoor camera placement and recording requirements.' },
]);

/** Keep the declared selection stable even if collection order or ratings change. */
export function selectHomeShortlist(products) {
  return HOME_SHORTLIST.flatMap(entry => {
    const product = products.find(item => item.data.slug === entry.slug);
    if (!product) throw new Error('Missing editorial shortlist product: ' + entry.slug);
    return product.data.catalogActive ? [{ ...product, editorialReason: entry.reason }] : [];
  });
}
