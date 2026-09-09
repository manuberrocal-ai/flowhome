import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const BLUETOOTH_REVIEWED_AT = '2026-09-07T00:59:39.000Z';

export function loadBluetoothDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'google-nest-hub-2nd-gen', label: 'Google Nest Hub second generation', claims: [
      { target: 'e:bluetooth', source: { label: 'Google specifications — explicit Nest Hub second-generation section', url: 'https://support.google.com/googlehome/answer/7072284?hl=en' }, claim: 'Google lists Bluetooth 5.0 for Nest Hub second generation. This radio specification does not certify particular profiles, codecs or accessory control; do not import profiles from another model section.' },
    ] },
    { slug: 'ecobee-smart-thermostat-premium', label: 'ecobee Smart Thermostat Premium', claims: [
      { target: 'e:bluetooth', source: { label: 'ecobee Premium US connectivity and Bluetooth speaker output', url: 'https://www.ecobee.com/en-us/smart-thermostats/smart-thermostat-premium/' }, claim: 'ecobee lists Bluetooth 5.0 and streaming to a Bluetooth speaker for Smart Thermostat Premium. Verify music-service and pairing requirements; this does not certify Bluetooth HVAC control, sensor compatibility or free subscriptions.' },
    ] },
    { slug: 'yale-assure-lock-2-wifi', label: 'Yale Assure Lock 2 YRD420-WF1 family', claims: [
      { target: 'e:bluetooth', source: { label: 'Yale US standard Assure Lock 2 — Bluetooth inclusion and remote-access limits', url: 'https://shopyalehome.com/products/yale-assure-lock-2-touchscreen-with-wi-fi' }, claim: 'Yale includes Bluetooth in Assure Lock 2, including the YRD420-WF1 family. Bluetooth alone does not supply the Wi-Fi module needed for remote access and additional integrations. Verify the actual module and app; no Plus or Home Key features are inferred.' },
    ] },
    { slug: 'august-wifi-smart-lock', label: 'August Wi-Fi Smart Lock', claims: [
      { target: 'e:bluetooth', source: { label: 'August Wi-Fi Smart Lock — Bluetooth Low Energy and separate remote-access requirement', url: 'https://august.com/products/august-wifi-smart-lock' }, claim: 'August documents Bluetooth Low Energy on its Wi-Fi Smart Lock product page. Remote access separately requires Wi-Fi; verify exact app, unit and accessory requirements. This is not a tested range, arbitrary-keypad compatibility or security certification.' },
    ] },
  ], [{ id: 'e:bluetooth', type: 'protocol', label: 'Bluetooth' }], {
    reviewedAt: BLUETOOTH_REVIEWED_AT, supplier: 'Google / ecobee / Yale / August',
    validationMethod: 'Codex official model-page review on 2026-09-07 UTC. Google explicit second-generation section, not misleading image alt text in an earlier section; Yale standard lock footnote, not Plus or Touch features; August product copy, not customer reviews or keypad range. No pairing, physical unit, firmware, network or unlocking test.',
  });
}
