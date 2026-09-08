import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { getInstallationEvidence, matchesInstallationPreference } from '../src/lib/product-installation.ts';
import { selectRecommendationResult, getRecommendationReasons } from '../src/lib/quiz-recommend.ts';

const NOW = new Date('2026-09-06T18:00:00Z');
const root = new URL('../src/content/products/', import.meta.url);
const products = readdirSync(root).filter((file) => file.endsWith('.yaml')).map((file) => parse(readFileSync(new URL(file, root), 'utf8')));
const get = (slug) => products.find((product) => product.slug === slug);
const state = { goal: 'comfort', ecosystem: 'open', budget: 'open', installation: 'plug-and-play', extra: 'open' };

test('catalog installation evidence is model-specific: all twenty-eight documented', () => {
  assert.equal(products.length, 28);
  assert.equal(products.filter((product) => getInstallationEvidence(product, NOW)).length, 28);
  for (const product of products) {
    const evidence = getInstallationEvidence(product, NOW);
    assert.equal(Boolean(evidence), Boolean(product.installation), product.slug);
    if (evidence) {
      assert.equal(evidence.model, product.model);
      assert.equal(evidence.market, 'US');
      assert.ok(evidence.sources.every((source) => !new URL(source.url).hostname.endsWith('example.com')));
      assert.notEqual(product.priceLastChecked, '2026-09-05');
      assert.notEqual(product.ratingLastChecked, '2026-09-05');
    }
  }
});

test('Hue and Aqara guided setup distinguishes components, mounting and untested pairings', () => {
  for (const [slug, phrases] of [
    ['aqara-motion-sensor-p1', ['Aqara Zigbee 3.0 hub', 'before fixing', '1.2-2 m', 'two CR2450', 'not a tested security system']],
    ['philips-hue-white-color-starter-kit', ['110-130 V', 'Ethernet', 'same home network', 'not rewiring', 'does not cover Bridge Pro']]
  ]) {
    const product = get(slug);
    const evidence = getInstallationEvidence(product, NOW);
    assert.equal(evidence.assessment, 'light-setup');
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), true);
    for (const phrase of phrases) assert.ok(evidence.requirements.join(' ').includes(phrase), phrase);
    assert.equal(getInstallationEvidence({ ...product, model: 'different generation' }, NOW), null);
    const reasons = getRecommendationReasons(product, state, undefined, NOW).join(' ');
    for (const requirement of evidence.requirements) assert.ok(reasons.includes(requirement));
  }
  assert.equal(get('philips-hue-white-color-starter-kit').wifi, false);
});

test('Govee H617C separates Bluetooth from Wi-Fi models and forbids generic cutting advice', () => {
  const product = get('govee-rgbic-led-strip-lights');
  assert.equal(product.model, 'H617C');
  assert.equal(product.asin, 'B099S9DXT7');
  assert.equal(product.wifi, false);
  assert.equal(product.bluetooth, true);
  assert.equal(product.alexaCompatible, false);
  assert.equal(product.googleHomeCompatible, false);
  const evidence = getInstallationEvidence(product, NOW);
  assert.equal(evidence.assessment, 'light-setup');
  assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
  const text = evidence.requirements.join(' ');
  for (const phrase of ['not cuttable', '24 V / 0.75 A', 'Bluetooth', 'does not approve outdoor use']) assert.ok(text.includes(phrase), phrase);
  assert.equal(product.priceLastChecked, '2026-06-28');
  assert.equal(product.ratingLastChecked, '2026-06-28');
  assert.equal(getInstallationEvidence({ ...product, model: 'H618C' }, NOW), null);
  const reasons = getRecommendationReasons(product, state, undefined, NOW).join(' ');
  assert.match(reasons, /exceeds your selected preference/);
  for (const requirement of evidence.requirements) assert.ok(reasons.includes(requirement));
});

test('Aeotec and Echo Show initial setup does not certify migration or accessory pairings', () => {
  const hub = get('aeotec-smartthings-hub');
  const display = get('echo-show-8-3rd-gen');
  assert.equal(hub.model, 'GP-AEOHUBV3US');
  for (const [product, phrases] of [
    [hub, ['2.4 GHz Wi-Fi with WPA2', 'Samsung account', 'firmware updates', 'not migrating', 'regional Z-Wave', 'not cover Smart Home Hub 2']],
    [display, ['included power adapter', 'R85SD6', 'Amazon account', 'on the display', 'camera shutter', 'subscription terms']]
  ]) {
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), true);
    assert.equal(product.installation.sources.length, 2);
    const text = product.installation.requirements.join(' ');
    for (const phrase of phrases) assert.ok(text.includes(phrase), phrase);
    assert.match(text, /does not establish cloud-free operation/);
    const reasons = getRecommendationReasons(product, state, undefined, NOW).join(' ');
    for (const requirement of product.installation.requirements) assert.ok(reasons.includes(requirement));
  }
  assert.equal(hub.asin, 'B08TWDNQ5Q');
  assert.equal(display.asin, 'B0BLS3Y632');
  assert.equal(hub.priceLastChecked, '2026-06-28');
  assert.equal(display.priceLastChecked, '2026-06-29');
  assert.equal(getInstallationEvidence({ ...hub, model: 'GP-AEOHUBV3EU' }, NOW), null);
  assert.equal(getInstallationEvidence({ ...display, model: 'Echo Show 8 2nd Gen' }, NOW), null);
});

test('eufy and Arlo camera setup distinguishes fixed indoor power from rechargeable outdoor use', () => {
  const eufy = get('eufy-security-indoor-cam-c120');
  const arlo = get('arlo-essential-outdoor-camera');
  const eufyText = eufy.installation.requirements.join(' ');
  for (const phrase of ['indoor-only', '5 V / 1 A', '128 GB', 'purchased separately', 'T8400X / T84001W1', 'does not establish cloud-free']) assert.ok(eufyText.includes(phrase), phrase);
  const arloText = arlo.installation.requirements.join(' ');
  for (const phrase of ['charging cable is for indoor use only', 'integrated rather than removable', 'test motion detection', 'one camera', 'three-pack']) assert.ok(arloText.includes(phrase), phrase);
  for (const product of [eufy, arlo]) {
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), true);
    assert.equal(product.priceLastChecked, '2026-06-28');
    assert.equal(product.ratingLastChecked, '2026-06-28');
    const reasons = getRecommendationReasons(product, { ...state, goal: 'security', installation: 'light-setup' }, undefined, NOW).join(' ');
    for (const requirement of product.installation.requirements) assert.ok(reasons.includes(requirement));
  }
  const result = selectRecommendationResult({ ...state, goal: 'security', installation: 'light-setup' }, products, 4, NOW);
  assert.deepEqual(result.relaxedFilters, []);
  assert.ok(result.recommendations.some(product => product.slug === arlo.slug));
  assert.ok(result.recommendations.every(product => matchesInstallationPreference(product, 'light-setup', NOW)));
});

test('replacement lock setup preserves exact variants and conditional prepared-door assessment', () => {
  const schlage = get('schlage-encode-smart-wifi-deadbolt');
  const yale = get('yale-assure-lock-2-wifi');
  assert.equal(schlage.model, 'BE489WB CEN 622');
  assert.equal(yale.model, 'YRD420-WF1-619');
  for (const product of [schlage, yale]) {
    assert.equal(getInstallationEvidence(product, NOW).assessment, 'light-setup');
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), true);
    const text = product.installation.requirements.join(' ');
    assert.match(text, /replaces the deadbolt/);
    assert.match(text, /separate assessment/);
    assert.match(text, /before buying/);
    assert.equal(product.priceLastChecked, '2026-06-29');
    assert.equal(product.ratingLastChecked, '2026-06-29');
    const reasons = getRecommendationReasons(product, { ...state, goal: 'security' }, undefined, NOW).join(' ');
    assert.match(reasons, /exceeds your selected preference/);
  }
  assert.match(schlage.installation.requirements.join(' '), /1-3\/8 to 1-3\/4 inch/);
  assert.match(schlage.installation.requirements.join(' '), /not Encode Plus/);
  assert.match(yale.installation.requirements.join(' '), /1-3\/8 to 2-1\/4 inch/);
  assert.match(yale.installation.requirements.join(' '), /remove batteries before inserting or removing/);
  assert.match(yale.installation.requirements.join(' '), /calibrate DoorSense/);
  assert.match(yale.installation.requirements.join(' '), /not Touch, Plus or a key-free variant/);
  assert.equal(getInstallationEvidence({ ...yale, model: 'YRD450' }, NOW), null);
  assert.equal(getInstallationEvidence({ ...schlage, model: 'BE499' }, NOW), null);
});

test('Meross MSG100 setup does not imply universal motor or unattended-operation approval', () => {
  const product = get('meross-smart-garage-door-opener');
  assert.equal(product.model, 'MSG100');
  const evidence = getInstallationEvidence(product, NOW);
  assert.equal(evidence.assessment, 'advanced');
  const text = evidence.requirements.join(' ');
  for (const phrase of ['not a replacement motor', 'exact brand and model', 'additional accessory', 'do not attempt a terminal-bridging test', 'hardware suffix', 'does not establish safe unattended operation', '2.4 GHz']) assert.ok(text.includes(phrase), phrase);
  for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
    assert.equal(matchesInstallationPreference(product, installation, NOW), installation === 'advanced');
    const reasons = getRecommendationReasons(product, { ...state, goal: 'security', installation }, undefined, NOW).join(' ');
    assert.equal(reasons.includes('exceeds your selected preference'), installation !== 'advanced');
    assert.ok(reasons.includes('not a replacement motor'));
  }
  assert.equal(product.asin, 'B084Z5QZR2');
  assert.equal(product.priceLastChecked, '2026-06-28');
  assert.equal(product.ratingLastChecked, '2026-06-28');
  assert.equal(getInstallationEvidence({ ...product, model: 'MSG200' }, NOW), null);
});

test('original Ring Wired distinguishes power alternatives, electrical work and disabled chime', () => {
  const product = get('ring-video-doorbell-wired');
  const evidence = getInstallationEvidence(product, NOW);
  assert.equal(evidence.assessment, 'advanced');
  const requirements = evidence.requirements.join(' ');
  for (const phrase of ['10-24 VAC', '8-40 VA', 'Plug-In Adapter', 'disconnect power at the breaker', 'licensed electrician', 'bypasses and disables', 'not newer 2K or Pro']) assert.ok(requirements.includes(phrase), phrase);
  for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
    const answers = { ...state, goal: 'security', installation };
    assert.equal(matchesInstallationPreference(product, installation, NOW), installation === 'advanced');
    const reasons = getRecommendationReasons(product, answers, undefined, NOW).join(' ');
    assert.equal(reasons.includes('exceeds your selected preference'), installation !== 'advanced');
    const result = selectRecommendationResult(answers, products, 4, NOW);
    // Eligibility does not guarantee a slot in the four-item catalog shortlist.
    if (installation !== 'advanced') assert.ok(!result.recommendations.some(candidate => candidate.slug === product.slug));
  }
  assert.equal(product.priceLastChecked, '2026-06-28');
  assert.equal(product.asin, 'B08CKHPP52');
  const review = readFileSync(new URL('../src/content/reviews/ring-video-doorbell-wired-review.md', import.meta.url), 'utf8');
  assert.match(review, /\/product\/ring-video-doorbell-wired\/#installation-checks/);
  assert.match(review, /Plug-In Adapter/);
  assert.doesNotMatch(review, /want a simple front-door camera/);
});

test('robot setup preserves distinct base clearances, first-use preparation and model scope', () => {
  const q5 = get('roborock-q5-plus');
  const j7 = get('irobot-roomba-j7-plus');
  for (const product of [q5, j7]) {
    assert.equal(getInstallationEvidence(product, NOW).assessment, 'light-setup');
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), true);
  }
  const q5Text = q5.installation.requirements.join(' ');
  assert.match(q5Text, /six supplied screws/);
  assert.match(q5Text, /1\.5 m in front.*1 m above/);
  assert.match(q5Text, /secure physical barrier/);
  assert.match(q5Text, /entire first cleaning route/);
  assert.match(q5Text, /2\.4 GHz/);
  assert.match(q5Text, /not Q5 Pro/);
  const j7Text = j7.installation.requirements.join(' ');
  assert.match(j7Text, /1\.2 m in front.*0\.3 m above/);
  assert.match(j7Text, /at least 4 ft \/ 1\.2 m from stairs/);
  assert.match(j7Text, /3-hour charge/);
  assert.match(j7Text, /remove excess floor clutter/);
  assert.match(j7Text, /not a Roomba Combo/);
});

test('cleaning quiz fits guided setup and explicitly widens a power-and-app-only preference', () => {
  for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
    const answers = { ...state, goal: 'cleaning', installation };
    const result = selectRecommendationResult(answers, products, 4, NOW);
    assert.deepEqual(result.recommendations.map((product) => product.slug).sort(), ['irobot-roomba-j7-plus', 'roborock-q5-plus']);
    assert.equal(result.relaxedFilters.includes('installation'), installation === 'plug-and-play');
    for (const product of result.recommendations) {
      const reasons = getRecommendationReasons(product, answers, result, NOW).join(' ');
      assert.doesNotMatch(reasons, /Installation requirements are not yet verified/);
      assert.match(reasons, /Mounting or guided setup/);
      assert.equal(reasons.includes('exceeds your selected preference'), installation === 'plug-and-play');
      for (const requirement of product.installation.requirements) assert.ok(reasons.includes(requirement));
    }
  }
});

test('camera setup evidence distinguishes power, mounting, extra hardware and paid services', () => {
  for (const slug of ['tapo-c120-security-camera', 'blink-outdoor-4']) {
    const product = get(slug);
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), true);
    const reasons = getRecommendationReasons(product, { ...state, goal: 'security', installation: 'light-setup' }, undefined, NOW).join(' ');
    assert.match(reasons, /subscription/);
    assert.match(reasons, /microSD/);
    assert.doesNotMatch(reasons, /Installation requirements are not yet verified/);
  }
  const tapo = get('tapo-c120-security-camera').installation.requirements.join(' ');
  assert.match(tapo, /indoor use for the power adapter/);
  assert.match(tapo, /table or shelf needs no wall mounting/);
  const blink = get('blink-outdoor-4').installation.requirements.join(' ');
  assert.match(blink, /whether the exact camera bundle includes the module/);
  assert.match(blink, /Sync Module 2 with a USB drive or Sync Module XR with a microSD card/);
});

test('hub setup evidence preserves power accessories, app requirements and existing quiz scope', () => {
  const hubs = ['aqara-hub-m2', 'switchbot-hub-2'].map(get);
  for (const product of hubs) {
    const evidence = getInstallationEvidence(product, NOW);
    assert.ok(evidence, product.slug);
    assert.equal(evidence.assessment, 'plug-and-play');
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), true);
    assert.match(evidence.requirements.join(' '), /2\.4 GHz/);
    assert.match(evidence.requirements.join(' '), /app/);
    for (const goal of ['security', 'comfort', 'cleaning', 'energy', 'entertainment']) {
      const result = selectRecommendationResult({ ...state, goal }, products, 4, NOW);
      assert.ok(!result.recommendations.some((candidate) => candidate.slug === product.slug));
    }
  }
  const aqara = hubs[0].installation.requirements.join(' ');
  assert.match(aqara, /HM2-G01/);
  assert.match(aqara, /adapter is purchased separately/);
  assert.match(aqara, /RJ45 Ethernet/);
  assert.match(aqara, /indoors/);
  const switchbot = hubs[1].installation.requirements.join(' ');
  assert.match(switchbot, /5 V, 2 A/);
  assert.match(switchbot, /sensor-equipped USB-C cable/);
  assert.match(switchbot, /air vent clear and away from heat sources/);
});

test('comfort setup evidence preserves fixture, filter and blind-fit constraints', () => {
  for (const slug of ['wyze-bulb-color', 'levoit-core-300s-air-purifier']) {
    assert.equal(matchesInstallationPreference(get(slug), 'plug-and-play', NOW), true, slug);
  }
  const wyze = get('wyze-bulb-color').installation.requirements.join(' ');
  assert.match(wyze, /WLPA19C.*E26.*120 V/);
  assert.match(wyze, /power off/);
  assert.match(wyze, /external dimmer/);
  assert.match(wyze, /fully enclosed/);
  assert.match(wyze, /2\.4 GHz/);
  const levoit = get('levoit-core-300s-air-purifier').installation.requirements.join(' ');
  assert.match(levoit, /plastic packaging/);
  assert.match(levoit, /15 inches \/ 38 cm/);
  assert.match(levoit, /on-device controls/);
  assert.match(levoit, /VeSync/);
  const blind = get('switchbot-blind-tilt');
  assert.equal(matchesInstallationPreference(blind, 'plug-and-play', NOW), false);
  assert.equal(matchesInstallationPreference(blind, 'light-setup', NOW), true);
  assert.match(blind.installation.requirements.join(' '), /6\.2-10\.2 mm or 12 mm/);
  assert.match(blind.installation.requirements.join(' '), /not vertical blinds or roller/);
  assert.match(blind.installation.requirements.join(' '), /separate compatible hub/);
});

test('comfort recommendations use newly documented setup without relaxing the preference', () => {
  const result = selectRecommendationResult(state, products, 4, NOW);
  assert.deepEqual(result.relaxedFilters, []);
  assert.deepEqual(result.recommendations.map((product) => product.slug), ['levoit-core-300s-air-purifier', 'tp-link-kasa-smart-plug-mini', 'wyze-bulb-color']);
  const guided = selectRecommendationResult({ ...state, installation: 'light-setup' }, products, 4, NOW);
  assert.deepEqual(guided.relaxedFilters, []);
  assert.deepEqual(guided.recommendations.map((product) => product.slug), ['govee-rgbic-led-strip-lights', 'levoit-core-300s-air-purifier', 'philips-hue-white-color-starter-kit', 'switchbot-blind-tilt']);
  assert.ok(guided.recommendations.every(product => matchesInstallationPreference(product, 'light-setup', NOW)));
});

test('in-wall switches and HVAC thermostats never meet a no-wiring preference', () => {
  for (const slug of ['tp-link-kasa-smart-light-switch-hs200', 'tp-link-kasa-smart-dimmer-hs220', 'amazon-smart-thermostat', 'ecobee-smart-thermostat-premium']) {
    const product = get(slug);
    assert.equal(matchesInstallationPreference(product, 'plug-and-play', NOW), false, slug);
    assert.equal(matchesInstallationPreference(product, 'light-setup', NOW), false, slug);
    assert.equal(matchesInstallationPreference(product, 'advanced', NOW), true, slug);
    assert.match(getInstallationEvidence(product, NOW).requirements.join(' '), /wiring/);
    const reasons = getRecommendationReasons(product, state, { relaxedFilters: ['installation'] }, NOW).join(' ');
    assert.match(reasons, /exceeds your selected preference/);
    assert.doesNotMatch(reasons, /Setup fit estimate: plug-and-play/);
  }
});

test('documented simpler setup is also eligible for a higher accepted effort', () => {
  for (const slug of ['echo-dot-5th-gen', 'google-nest-hub-2nd-gen']) {
    for (const level of ['plug-and-play', 'light-setup', 'advanced']) assert.equal(matchesInstallationPreference(get(slug), level, NOW), true);
  }
  assert.equal(matchesInstallationPreference(get('august-wifi-smart-lock'), 'plug-and-play', NOW), false);
  assert.equal(matchesInstallationPreference(get('august-wifi-smart-lock'), 'light-setup', NOW), true);
});

test('missing and mismatched model evidence fails closed regardless of category or Wi-Fi', () => {
  const real = get('echo-dot-5th-gen');
  for (const product of [{ ...real, installation: undefined }, { ...real, model: 'Echo Dot another generation' }, { ...real, model: undefined }, { ...get('tp-link-kasa-smart-plug-mini'), installation: undefined }]) {
    assert.equal(getInstallationEvidence(product, NOW), null);
    assert.equal(matchesInstallationPreference(product, 'advanced', NOW), false);
    assert.match(getRecommendationReasons(product, { ...state, goal: 'entertainment' }, undefined, NOW).join(' '), /Installation requirements are not yet verified/);
  }
});

test('invalid sources, dates, market, assessment and empty requirements remain unknown', () => {
  const real = get('echo-dot-5th-gen');
  const valid = real.installation;
  const source = valid.sources[0];
  const variants = [null, 'plug-and-play', {}, { ...valid, market: 'CA' }, { ...valid, assessment: 'toString' }, { ...valid, requirements: [] }, { ...valid, requirements: [''] }, { ...valid, sources: [] }, ...[
    { ...source, url: 'javascript:alert(1)' }, { ...source, url: 'https://user:password@example.com' }, { ...source, url: 'bad' }, { ...source, label: '' },
    { ...source, accessedAt: new Date(NOW.getTime() + 86400000).toISOString().slice(0, 10) }, { ...source, accessedAt: '2026-02-30' }, { ...source, accessedAt: '' },
  ].map((source) => ({ ...valid, sources: [source] }))];
  for (const installation of variants) assert.equal(getInstallationEvidence({ ...real, installation }, NOW), null, JSON.stringify(installation));
  assert.equal(getInstallationEvidence(real, new Date('invalid')), null);
  assert.equal(matchesInstallationPreference(real, 'toString', NOW), false);
});

test('real entertainment selection retains supported setup without unknown category substitutes', () => {
  const result = selectRecommendationResult({ ...state, goal: 'entertainment' }, products, 4, NOW);
  assert.deepEqual(result.relaxedFilters, []);
  assert.deepEqual(result.recommendations.map((product) => product.slug), ['echo-dot-5th-gen', 'echo-show-8-3rd-gen', 'google-nest-hub-2nd-gen', 'wyze-bulb-color']);
  assert.ok(result.recommendations.every(product => matchesInstallationPreference(product, 'plug-and-play', NOW)));
});

test('when fallback is necessary it preserves supported setup ahead of other candidates', () => {
  const candidates = [get('google-nest-hub-2nd-gen'), get('tp-link-kasa-smart-dimmer-hs220')].map((product) => ({ ...product, category: 'smart-lighting' }));
  const result = selectRecommendationResult(state, candidates, 4, NOW);
  assert.deepEqual(result.relaxedFilters, ['installation']);
  assert.equal(result.recommendations[0].slug, 'google-nest-hub-2nd-gen');
  assert.match(getRecommendationReasons(candidates[1], state, result, NOW).join(' '), /exceeds.*preference/);
});

test('all goal/setup combinations explain every relaxed or unknown installation honestly', () => {
  for (const goal of ['security', 'comfort', 'cleaning', 'energy', 'entertainment']) {
    for (const installation of ['plug-and-play', 'light-setup', 'advanced']) {
      const answers = { ...state, goal, installation };
      const result = selectRecommendationResult(answers, products, 4, NOW);
      for (const product of result.recommendations) {
        const reasons = getRecommendationReasons(product, answers, result, NOW).join(' ');
        if (!getInstallationEvidence(product, NOW)) assert.match(reasons, /Installation requirements are not yet verified/);
        if (!matchesInstallationPreference(product, installation, NOW)) assert.ok(result.relaxedFilters.includes('installation'));
      }
    }
  }
});
