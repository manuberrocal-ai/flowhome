import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const AMAZON_NETWORK_REVIEWED_AT = '2026-09-07T00:55:39.000Z';
const dot = { label: 'Amazon US Echo Dot fifth-generation C2N6L4 specifications', url: 'https://digprjsurvey.amazon.com/csad/help/node/TR7RlV0WehGNoLYxKM' };
const show = { label: 'Amazon US Echo Show 8 third-generation Wi-Fi setup', url: 'https://digprjsurvey.amazon.com/csad/help/node/Tg5QWRNDN7gW3Q968N' };
const thermostat = { label: 'Amazon Smart Thermostat network requirements', url: 'https://digprjsurvey.amazon.com/csad/help/node/GLJEMJYYPUGXV2A4' };

export function loadAmazonNetworkDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'echo-dot-5th-gen', label: 'Echo Dot fifth generation — C2N6L4 documentation', claims: [
      { target: 'e:wifi', source: dot, claim: 'Amazon lists 2.4 and 5 GHz 802.11a/b/g/n/ac Wi-Fi for Echo Dot fifth generation, model C2N6L4. Verify the actual unit and network setup; no Wi-Fi 6 or universal offline functionality is established.' },
      { target: 'e:bluetooth', source: dot, claim: 'Echo Dot fifth-generation C2N6L4 documentation lists Bluetooth and Bluetooth Low Energy. Phone or speaker pairing uses the Alexa app; codecs, every accessory and autonomous hub roles are not certified.' },
    ] },
    { slug: 'echo-show-8-3rd-gen', label: 'Echo Show 8 third generation — Wi-Fi setup', claims: [
      { target: 'e:wifi', source: show, claim: 'Amazon documents Wi-Fi internet setup for Echo Show 8 third generation with an Amazon account. This setup source does not establish radio bands or Wi-Fi 6; verify detailed network requirements separately.' },
    ] },
    { slug: 'amazon-smart-thermostat', label: 'Amazon Smart Thermostat — network requirements', claims: [
      { target: 'e:wifi', source: thermostat, claim: 'Amazon Smart Thermostat requires 2.4 GHz Wi-Fi, not 5 GHz. Amazon also flags WPA3 as a setup limitation; check a suitable secured network with its administrator rather than changing shared-router security blindly. Network support does not verify HVAC wiring.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:bluetooth', type: 'protocol', label: 'Bluetooth' },
  ], {
    reviewedAt: AMAZON_NETWORK_REVIEWED_AT, supplier: 'Amazon',
    validationMethod: 'Codex US model-specific documentary review on 2026-09-07 UTC. Dot standard-model safety source reached from its setup guide, not Kids; pairing corroborated by https://digprjsurvey.amazon.com/csad/help/node/GG8S76D3BYTGC424 . Show safety guide does not specify radio bands. No device, firmware, account, network-security change or HVAC test.',
  });
}
