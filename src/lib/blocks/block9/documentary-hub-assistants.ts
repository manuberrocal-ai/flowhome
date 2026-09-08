import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const HUB_ASSISTANTS_REVIEWED_AT = '2026-09-07T01:11:00.000Z';
const m2 = { label: 'Aqara M2 US — assistant and IR restrictions', url: 'https://www.aqara.com/us/product/hub-m2/' };
const p1 = { label: 'Aqara P1 US — hub-mediated ecosystems', url: 'https://us.aqara.com/products/motion-sensor-p1' };
const aeotec = { label: 'Aeotec GP-AEOHUBV3 voice integration — historical setup guide', url: 'https://aeotec.freshdesk.com/support/solutions/articles/6000240465-voice-control-smart-home-hub' };

export function loadHubAssistantDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'aqara-hub-m2', label: 'Aqara Hub M2 — assistant integrations', claims: [
      { target: 'e:alexa', source: m2, claim: 'M2 exposes supported Aqara devices to Alexa. IR support is limited to certain device types, such as TVs and air conditioners; verify account setup and commands, not universal appliance control.' },
      { target: 'e:google-home', source: m2, claim: 'M2 integrates supported devices with Google Assistant. IR control covers selected device types; verify linking and actions. Local Aqara automations do not establish offline Google voice control.' },
    ] },
    { slug: 'aqara-motion-sensor-p1', label: 'Aqara P1 — hub-mediated assistant signals', claims: [
      { target: 'e:alexa', source: p1, claim: 'P1 reaches Alexa through a compatible Aqara Zigbee 3.0 hub. Verify exposed sensor capabilities and routines; this does not establish direct Echo pairing or Alexa Built-in.' },
      { target: 'e:google-home', source: p1, claim: 'The P1 product body lists Google Home through an Aqara Zigbee 3.0 hub, although its shorter platform list omits Google. Verify the current integration and exposed sensor functions before selection.' },
      { target: 'e:apple-home', source: p1, claim: 'P1 integrates with Apple HomeKit through a compatible Aqara Zigbee 3.0 hub. Confirm exposed capabilities; do not assume illumination, sensitivity and timeout controls match Aqara Home, or confuse P1 with P2.' },
    ] },
    { slug: 'aeotec-smartthings-hub', label: 'Aeotec GP-AEOHUBV3US — SmartThings-linked assistants', claims: [
      { target: 'e:alexa', source: aeotec, claim: 'Aeotec Smart Home Hub integrates supported devices with Alexa through SmartThings account linking and a compatible voice device. The 2021 guide has device and scene restrictions; verify current actions and all-location authorization scope before linking. This is not built-in voice control or universal device support.' },
      { target: 'e:google-home', source: aeotec, claim: 'Aeotec Smart Home Hub connects supported devices to Google Assistant through SmartThings. Verify current account permissions, exposed devices and routines; the historical guide is not a current app walkthrough. This does not establish offline voice control or arbitrary Google automation commands.' },
    ] },
  ], [
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Home' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
  ], {
    reviewedAt: HUB_ASSISTANTS_REVIEWED_AT, supplier: 'Aqara / Aeotec',
    validationMethod: 'Codex primary-source review on 2026-09-07 UTC. Aeotec voice support corroborated by GP-AEOHUBV3 specifications updated 2026-01-08, https://aeotec.freshdesk.com/support/solutions/articles/6000240466-smart-home-hub-technical-specifications; SmartThings account scope checked at https://support.smartthings.com/hc/en-us/articles/360052409891-Voice-Services-in-SmartThings. M2 BLE hardware listing is not accessory compatibility and creates no Bluetooth works-with edge. No account linking, physical device, firmware, scene or seller-variant test.',
  });
}
