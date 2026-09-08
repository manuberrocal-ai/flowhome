export const VIEWPORTS = Object.freeze([[320, 800], [375, 812], [390, 844], [768, 1024], [1024, 768], [1280, 800], [1440, 900]]);
export const TEMPLATES = Object.freeze([
  ['home', '/'], ['products', '/products/'], ['category', '/category/smart-plug/'],
  ['guide', '/best/best-smart-home-starter-kit/'], ['product', '/product/amazon-smart-thermostat/'],
  ['review', '/review/roborock-q5-plus-review/'], ['deals', '/deals/'],
  ['compare', '/compare/amazon-smart-thermostat-vs-ecobee-smart-thermostat-premium/'],
  ['quiz', '/quiz/'], ['calculator', '/calculator/'], ['cart', '/cart/'],
  ['account', '/account/'], ['about', '/about/'], ['privacy', '/privacy/'],
  ['preferences', '/preferences/'], ['404', '/__flowhome-v3-missing__/'],
]);
export function viewportCases(profile = 'full') {
  if (!['full', 'weekly', 'daily'].includes(profile)) throw new Error('invalid_browser_profile');
  const templates = profile === 'daily' ? TEMPLATES.filter(([name]) => ['home', 'product', 'deals', 'cart'].includes(name)) : TEMPLATES;
  const viewports = profile === 'daily' ? VIEWPORTS.filter(([width]) => width === 390 || width === 1440) : VIEWPORTS;
  return templates.flatMap(([name, path]) => viewports.map(([width, height]) => ({ name: `${name}-${width}`, path, width, height, expectedStatus: name === '404' ? 404 : 200, ...(name === 'cart' ? { setup: 'empty-cart' } : {}) })));
}

// These source-backed corrections need their own rendered-page coverage, not
// just the generic product/review templates elsewhere in the suite.
export function catalogEvidenceCases() {
  const pages = [
    ['catalog-echo-dot', '/product/echo-dot-5th-gen/', ['Matter controller', 'separate Thread border router', 'supported device types']],
    ['catalog-nest-hub', '/product/google-nest-hub-2nd-gen/', ['Matter controller', 'built-in Thread border router', 'IPv6']],
    ['catalog-blind-tilt', '/product/switchbot-blind-tilt/', ['Bluetooth-only', 'separate compatible SwitchBot hub', 'not a native Matter accessory', 'Matter: Catalog: Yes (unverified)', 'Apple HomeKit: Catalog: Yes (unverified)']],
    ['editorial-echo-dot', '/review/echo-dot-5th-gen-review/', ['Matter controller', 'separate Thread border router', 'not a pairing test']],
    ['editorial-nest-hub', '/review/google-nest-hub-2nd-gen-review/', ['Matter controller', 'built-in Thread border router', 'no cross-platform pairing was tested']],
  ];
  return pages.flatMap(([name, path, evidenceTerms]) => [[390, 844], [1440, 900]].map(([width, height]) => ({
    name: `${name}-${width}`, path, width, height, expectedStatus: 200, evidenceTerms,
  })));
}
