/** Review-only lighting evidence; a bulb, pairing radio and bridge have different roles. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const LIGHTING_REVIEWED_AT = '2026-09-07T00:23:41.000Z';
const wyze = { label: 'Wyze Bulb Color — connectivity and voice controls', url: 'https://www.wyze.com/products/wyze-bulb-color' };
const wyzeSetup = { label: 'Wyze Bulb Color setup guide — Bluetooth pairing and Wi-Fi', url: 'https://support.wyze.com/hc/en-us/articles/360056417672-Wyze-Bulb-Color-Setup-Guide' };
const govee = { label: 'Govee specification matrix — H617C row, not H618C', url: 'https://community.govee.com/support/faqs/specs' };
const hue = { label: 'Philips Hue US — exact kit UPC 046677562915', url: 'https://www.philips-hue.com/en-us/p/hue-white-and-color-ambiance-starter-kit-2-e26-smart-bulbs-60-w/046677562915' };
const hueMatter = { label: 'Philips Hue Matter — Bridge path and Bluetooth exclusion', url: 'https://www.philips-hue.com/en-us/explore-hue/works-with/matter' };

export function loadLightingDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'wyze-bulb-color', label: 'Wyze Bulb Color — US model family', claims: [
      { target: 'e:wifi', source: wyze, claim: 'Wyze Bulb Color lists 2.4 GHz 802.11 b/g/n Wi-Fi. Follow Wyze app setup; a network connection does not verify every fixture or external dimmer.' },
      { target: 'e:bluetooth', source: wyzeSetup, claim: 'Wyze Bulb Color setup requests Bluetooth permission for pairing before joining 2.4 GHz Wi-Fi. This pairing role does not establish standalone Bluetooth lighting control.' },
      { target: 'e:alexa', source: wyze, claim: 'Wyze documents Alexa control of Bulb Color power, brightness and color. Check current account linking and supported commands; this is not a generic hub capability.' },
      { target: 'e:google-home', source: wyze, claim: 'Wyze documents Google Assistant control of Bulb Color power, brightness and color. Verify current app and assistant setup; not every Google Home automation is established.' },
    ] },
    { slug: 'govee-rgbic-led-strip-lights', label: 'Govee H617C — Bluetooth RGBIC strip', claims: [
      { target: 'e:bluetooth', source: govee, claim: 'Govee lists Bluetooth control for H617C. Its model row lists no Alexa or Matter; do not transfer Wi-Fi or assistant support from H618C or other RGBIC strips.' },
    ] },
    { slug: 'philips-hue-white-color-starter-kit', label: 'Philips Hue kit 562918 / UPC 046677562915', claims: [
      { target: 'e:bluetooth', source: hue, claim: 'Kit UPC 046677562915 lists Bluetooth lighting connectivity. This does not make the included Hue Bridge a Bluetooth controller or enable Matter over Bluetooth.' },
      { target: 'e:zigbee', source: hue, claim: 'Kit UPC 046677562915 lists Zigbee for its Hue lighting system. Use the documented Hue Bridge setup; this does not certify arbitrary Zigbee accessories.' },
      { target: 'e:alexa', source: hue, claim: 'The exact Hue kit lists Alexa with Hue Bridge required. Verify current linking and exposed lighting functions; do not substitute Bridge Pro specifications.' },
      { target: 'e:google-home', source: hue, claim: 'The exact Hue kit lists Google Assistant with Hue Bridge required. Check current setup and supported lighting commands, not every Google Home function.' },
      { target: 'e:apple-home', source: hue, claim: 'The exact Hue kit lists HomeKit and Apple Home with Hue Bridge required. Verify pairing and software; this is not direct HomeKit over Bluetooth.' },
      { target: 'e:matter', source: hueMatter, claim: 'For this Hue Bridge kit, Matter uses updated Bridge software and Bridge-connected lights. Bluetooth-only connections cannot use this Matter path; the bulbs are not thereby native Matter devices.' },
      { target: 'e:smartthings', source: hue, claim: 'The exact Hue kit lists SmartThings integration. Verify the chosen Bridge integration and exposed functions; this is lighting integration, not a SmartThings hub or universal accessory certification.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:bluetooth', type: 'protocol', label: 'Bluetooth' },
    { id: 'e:zigbee', type: 'protocol', label: 'Zigbee' },
    { id: 'e:matter', type: 'protocol', label: 'Matter' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
    { id: 'e:smartthings', type: 'ecosystem', label: 'SmartThings' },
  ], {
    reviewedAt: LIGHTING_REVIEWED_AT, supplier: 'Wyze / Govee / Signify',
    validationMethod: 'Codex official model-page and setup-document review on 2026-09-07 UTC; exact Govee row and Hue UPC distinguished. No unit, fixture, firmware, account or seller-package test.',
  });
}
