import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';
import { getProductCardCheck } from '../src/lib/product-card-check.ts';
import { getInstallationEvidence, getInstallationSummary } from '../src/lib/product-installation.ts';

const now = new Date('2026-09-12T12:00:00Z');
const directory = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(directory).filter(file => file.endsWith('.yaml'))
  .map(file => parse(readFileSync(new URL(file, directory), 'utf8')));
const product = slug => products.find(item => item.slug === slug);
const check = slug => getProductCardCheck(product(slug), now);

test('all 28 models return reviewed editorial summaries or the complete current fallback', () => {
  assert.equal(products.length, 28, 'review the visible checks when the catalog changes');
  let selections = 0;
  for (const item of products) {
    const result = getProductCardCheck(item, now);
    const evidence = getInstallationEvidence(item, now);
    assert.ok(result, item.slug);
    if (result === getInstallationSummary(evidence)) continue;
    selections += 1;
    // Paraphrases are intentional; their complete source requirements remain
    // exact-match guards, and source changes must invalidate the editorial text.
    const changed = { ...item, installation: { ...item.installation, requirements: item.installation.requirements.map(value => value + ' Source updated.') } };
    assert.equal(getProductCardCheck(changed, now), getInstallationSummary(getInstallationEvidence(changed, now)), item.slug);
    assert.notEqual(result, evidence.requirements.join(' '), item.slug);
  }
  assert.equal(selections, 19, 'all reviewed editorial summaries must still match their source guards');
});

test('low-effort models retain physical, electrical and battery restrictions', () => {
  assert.match(check('tp-link-kasa-smart-plug-mini'), /100–120 V AC.*do not stack adapters.*appliance-specific load limits.*not a universal appliance limit/);
  assert.match(check('roborock-q5-plus'), /assemble its base before connecting power.*Supervise the first cleaning route.*physical barrier.*does not replace/);
  assert.match(check('arlo-essential-outdoor-camera'), /Charge this second-generation camera indoors.*cable is for indoor use only/);
  assert.match(check('govee-rgbic-led-strip-lights'), /do not cut or splice.*matching 24 V.*not direct Wi-Fi or Alexa/);
  assert.match(check('aqara-motion-sensor-p1'), /CR2450 button batteries.*away from children.*will not close securely.*not a security-system test/);
  assert.match(check('blink-outdoor-4'), /non-rechargeable AA lithium batteries.*port cover closed.*ordinary exposed connection is not equivalent/);
  assert.match(check('tapo-c120-security-camera'), /not a battery camera.*supplied power hardware.*adapter to stay indoors even when the camera is outdoors/);
  assert.match(check('wyze-bulb-color'), /120 V, 60 Hz.*turn power off.*Do not use external dimmers.*enclosed or poorly ventilated.*direct water exposure/);
  assert.match(check('levoit-core-300s-air-purifier'), /15 inches.*120 V, 60 Hz.*Remove filter packaging.*unplug for filter servicing/);
  assert.match(check('yale-assure-lock-2-wifi'), /compatible prepared door.*Flush DoorSense mounting needs drilling.*remove batteries before changing it.*verify door fit/);
});

test('wired models keep voltage, fit and professional-installation conditions', () => {
  assert.match(check('amazon-smart-thermostat'), /24 V HVAC.*C-wire.*not 120–240 V or millivolt.*power-isolation.*professional/);
  assert.match(check('ecobee-smart-thermostat-premium'), /24 VAC HVAC.*C-wire.*HVAC professional/);
  assert.match(check('ring-video-doorbell-wired'), /10–24 VAC.*not arbitrary DC power.*breaker isolation.*disables the existing chime.*licensed electrician/);
  assert.match(check('meross-smart-garage-door-opener'), /exact model and required accessories.*Do not bridge unidentified terminals.*qualified installer.*does not establish safe unattended operation/);
  assert.match(check('tp-link-kasa-smart-dimmer-hs220'), /neutral wire.*dimming type.*load limits/);
  assert.match(check('tp-link-kasa-smart-light-switch-hs200'), /neutral wire.*qualified installer/);
});

test('invalid or mismatched model, source, market and date evidence cannot produce a check', () => {
  const original = product('tp-link-kasa-smart-plug-mini');
  assert.equal(getProductCardCheck({ slug: original.slug, model: original.model }, now), null);
  assert.equal(getProductCardCheck({ ...original, model: 'different model' }, now), null);
  assert.equal(getProductCardCheck(original, new Date('invalid')), null);
  for (const change of [
    { model: 'EP10 unrelated revision' }, { market: 'UK' }, { assessment: 'easy' }, { requirements: [] }, { sources: [] },
    { sources: [{ ...original.installation.sources[0], accessedAt: '2099-01-01' }] },
    { sources: [{ ...original.installation.sources[0], accessedAt: '2026-02-30' }] },
    { sources: [{ ...original.installation.sources[0], url: 'javascript:alert(1)' }] },
    { sources: [{ ...original.installation.sources[0], url: 'https://user:password@example.com/' }] },
  ]) assert.equal(getProductCardCheck({ ...original, installation: { ...original.installation, ...change } }, now), null);
});

test('changed text or a different exact model invalidates the entire curated selection', () => {
  const original = product('tp-link-kasa-smart-plug-mini');
  const summary = 'A complete current replacement summary, without arbitrary character truncation. '.repeat(8);
  const changed = { ...original, installation: { ...original.installation, summary, requirements: ['A new model-specific first requirement.'] } };
  assert.equal(getProductCardCheck(changed, now), summary);
  assert.equal(getProductCardCheck({ ...changed, installation: { ...changed.installation, summary: undefined } }, now), changed.installation.requirements[0]);
  const revised = { ...original, model: 'New EP10 model', installation: { ...original.installation, model: 'New EP10 model', summary } };
  assert.equal(getProductCardCheck(revised, now), summary);
  // One still-matching paragraph must not leak part of an obsolete selection.
  const partial = { ...original, installation: { ...original.installation, summary, requirements: [original.installation.requirements[0]] } };
  assert.equal(getProductCardCheck(partial, now), summary);
});

test('unmapped identities preserve the full fallback, without effort/category approximations', () => {
  const original = product('tp-link-kasa-smart-plug-mini');
  for (const slug of [undefined, 'unreviewed-model', 'constructor', '__proto__']) {
    assert.equal(getProductCardCheck({ ...original, slug }, now), original.installation.summary);
  }
  const selected = check(original.slug);
  for (const assessment of ['plug-and-play', 'light-setup', 'advanced']) {
    assert.equal(getProductCardCheck({ ...original, category: 'unrelated-category', installation: { ...original.installation, assessment } }, now), selected);
  }
});
