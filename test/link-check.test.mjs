import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCommercialLinks, linkHealth, REQUIRED_REL, scanSourceCtas, validateCommercialLink, validateCtaContract } from '../scripts/maintenance/link-check.mjs';

const productUrl = 'https://www.amazon.com/dp/B012345678?tag=flowhome-20';
const cartUrl = 'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1';

test('strict local monitor accepts only direct tagged product and cart destinations', () => {
  assert.deepEqual(validateCommercialLink(productUrl, 'product'), []);
  assert.deepEqual(validateCommercialLink(cartUrl, 'cart'), []);
  for (const url of [
    'http://www.amazon.com/dp/B012345678?tag=flowhome-20',
    'https://amazon.example/dp/B012345678?tag=flowhome-20',
    'https://www.amazon.com/dp/B012345678?tag=wrong',
    'https://www.amazon.com/dp/B012345678?tag=flowhome-20&utm_source=x',
    'https://www.amazon.com/dp/B012345678?tag=flowhome-20&gclid=x',
    'https://www.amazon.com/dp/B012345678?tag=flowhome-20&tag=flowhome-20',
    'https://www.amazon.com/dp/B012345678?tag=flowhome-20&ascsubtag=user-42',
    'https://user:pass@www.amazon.com/dp/B012345678?tag=flowhome-20',
    'https://www.amazon.com:444/dp/B012345678?tag=flowhome-20',
    'https://www.amazon.com/dp/B012345678?tag=flowhome-20#extra',
    'https://www.amazon.com/gp/product/B012345678?tag=flowhome-20',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.x=B012345678&Quantity.x=1',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=bad&Quantity.1=0',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1&fbclid=x',
    'https://user:pass@www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1',
    'https://www.amazon.com:444/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1',
    'https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=flowhome-20&ASIN.1=B012345678&Quantity.1=1#extra',
  ]) assert.ok(validateCommercialLink(url, 'fixture').length, url);
});

test('CTA and local freshness contracts report exact statuses without a network probe', () => {
  assert.deepEqual(validateCtaContract({ elementType: 'a', hrefKind: 'literal', href: productUrl, amazonCta: true, target: '_blank', rel: REQUIRED_REL, placement: 'quiz_result' }, 'source:quiz'), []);
  assert.ok(validateCtaContract({ amazonCta: true, target: '_self', rel: 'nofollow', placement: '' }, 'source:broken').length);
  assert.ok(validateCtaContract({ amazonCta: true, target: '_blank', rel: REQUIRED_REL, placement: 'quiz_result' }, 'source:omitted').some((finding) => finding.reason.includes('direct anchor')));
  assert.equal(linkHealth({ priceLastChecked: '2020-01-01' }, new Date('2026-01-01')).status, 'stale');
  assert.equal(linkHealth({}, new Date('2026-01-01')).status, 'unknown');
  const report = checkCommercialLinks({
    items: [{ slug: 'valid', affiliateUrl: productUrl, priceLastChecked: '2026-01-01' }, { slug: 'bad', affiliateUrl: 'https://example.test/', priceLastChecked: '2026-01-01' }],
    ctas: [{ path: 'source:fixture', elementType: 'a', hrefKind: 'literal', href: productUrl, amazonCta: true, target: '_blank', rel: REQUIRED_REL, placement: 'product_card' }],
    now: new Date('2026-01-02'),
  });
  assert.equal(report.broken[0].path, 'catalog:bad');
  assert.equal(report.findings.find((finding) => finding.path === 'catalog:valid').status, 'valid');
});

test('source scanner reports literal and dynamic retailer anchors missing the CTA contract', () => {
  const missingData = scanSourceCtas('<a href={product.affiliateUrl} target="_blank" rel="nofollow sponsored noopener noreferrer" data-cta-position="product_card">Amazon</a>', 'fixture:dynamic');
  const literalMissingRel = scanSourceCtas('<a href="https://www.amazon.com/dp/B012345678?tag=flowhome-20" data-fh-amazon-cta data-cta-position="product_card">Amazon</a>', 'fixture:literal');
  assert.equal(missingData.length, 1);
  assert.equal(literalMissingRel.length, 1);
  const retailerButton = scanSourceCtas('<button data-fh-amazon-cta data-cta-position="product_card">Amazon</button>', 'fixture:button');
  const unknownHref = scanSourceCtas('<a href={untrustedHref} data-fh-amazon-cta target="_blank" rel="nofollow sponsored noopener noreferrer" data-cta-position="product_card">Amazon</a>', 'fixture:unknown');
  const unsafeLiteral = scanSourceCtas('<a href="https://www.amazon.com/dp/B012345678?tag=flowhome-20&gclid=x" data-fh-amazon-cta target="_blank" rel="nofollow sponsored noopener noreferrer" data-cta-position="product_card">Amazon</a>', 'fixture:literal-url');
  const report = checkCommercialLinks({ ctas: [...missingData, ...literalMissingRel, ...retailerButton, ...unknownHref, ...unsafeLiteral] });
  assert.equal(missingData[0].elementType, 'a');
  assert.equal(missingData[0].hrefKind, 'dynamic');
  assert.equal(report.broken.length, 9);
  assert.ok(report.broken.some((finding) => finding.path === 'fixture:dynamic' && finding.reason.includes('data-fh-amazon-cta')));
  assert.ok(report.broken.some((finding) => finding.path === 'fixture:button' && finding.reason.includes('direct anchor')));
  assert.ok(report.broken.some((finding) => finding.path === 'fixture:literal-url' && finding.reason.includes('permits only')));
});
