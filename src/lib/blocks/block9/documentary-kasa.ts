/** US model documentation only; seller packages and installed revisions remain unverified. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const KASA_REVIEWED_AT = '2026-09-06T23:47:23.000Z';
const base = 'https://www.kasasmart.com/us/products/';
const models = [
  { slug: 'tp-link-kasa-smart-plug-mini', model: 'EP10', path: 'smart-plugs/kasa-smart-plug-mini-ep10',
    voice: 'switching connected devices on and off', scope: 'This covers the EP10 model, not an inspected EP10P2 seller package, energy measurement or arbitrary appliance suitability.' },
  { slug: 'tp-link-kasa-smart-dimmer-hs220', model: 'HS220', path: 'smart-switches/kasa-smart-wi-fi-light-switch-dimmer-hs220',
    voice: 'controlling and dimming compatible lighting', scope: 'Check the bulb dimming type and installation requirements; this does not establish compatibility with every light or an inspected hardware revision.' },
  { slug: 'tp-link-kasa-smart-light-switch-hs200', model: 'HS200', path: 'smart-switches/kasa-smart-wi-fi-light-switch-hs200',
    voice: 'switching connected fixtures on and off', scope: 'This is an in-wall switch role, not the HS220 dimmer; review installation and load requirements for the exact unit.' },
];

export function loadKasaDocumentaryCandidate() {
  return buildDocumentaryModelCandidates(models.map(item => {
    const source = { label: `Kasa ${item.model} US — model-specific network and voice control`, url: `${base}${item.path}` };
    return { slug: item.slug, label: `Kasa ${item.model} — US manufacturer model`, claims: [
      { target: 'e:wifi', source, claim: `Kasa specifies 2.4 GHz IEEE 802.11b/g/n Wi-Fi for the US ${item.model} and describes Kasa app control. This is not evidence of Matter, Thread, Zigbee or fully offline operation.` },
      { target: 'e:alexa', source, claim: `Kasa documents Alexa voice control for ${item.model}, including ${item.voice}. Check the current assistant setup and supported functions. ${item.scope}` },
      { target: 'e:google-home', source, claim: `Kasa documents Google Assistant voice control for ${item.model}, including ${item.voice}. This does not establish every Google Home app or automation function. ${item.scope}` },
    ] };
  }), [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
  ], {
    reviewedAt: KASA_REVIEWED_AT, supplier: 'TP-Link / Kasa',
    validationMethod: 'Codex documentary review of three distinct Kasa US model pages on 2026-09-06; HS103 source excluded for EP10. No physical tests, seller-package match, installed revision or account integration verified.',
  });
}
