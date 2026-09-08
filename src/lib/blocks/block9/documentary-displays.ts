import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const DISPLAYS_REVIEWED_AT = '2026-09-07T00:44:26.000Z';
const amazon = { label: 'Amazon Matter controllers and separate Thread border-router list', url: 'https://developer.amazon.com/docs/alexaplus/smarthome/matter-support.html' };
const launch = { label: 'Amazon US Echo Show 8 launch — September 2023, not Echo Hub', url: 'https://press.aboutamazon.com/2023/9/amazon-unveils-next-generation-echo-show-8-all-new-echo-hub-and-new-echo-frames' };
const google = { label: 'Google Home Matter hubs and IPv6 requirements', url: 'https://support.google.com/googlehome/answer/12391458?hl=en' };

export function loadDisplayDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'echo-dot-5th-gen', label: 'Echo Dot fifth generation — not Dot Max', claims: [
      { target: 'e:matter', source: amazon, claim: 'Echo Dot fifth generation is an Alexa Matter controller. Check supported device categories and current software; Thread accessories require a separate compatible border router. This does not certify the Dot as a Matter accessory for Apple or Google.' },
      { target: 'e:alexa', source: amazon, claim: 'Echo Dot fifth generation controls supported Matter devices through Alexa; this controller role does not guarantee every accessory or feature.' },
    ] },
    { slug: 'echo-show-8-3rd-gen', label: 'Echo Show 8 third generation — 2023 release', claims: [
      { target: 'e:matter', source: amazon, claim: 'Echo Show 8 third generation is an Alexa Matter controller. Verify supported accessory categories and current software; controller support is not cross-ecosystem accessory certification.' },
      { target: 'e:thread', source: amazon, claim: 'Echo Show 8 third generation has a Thread border router; the 2023 launch independently documents Thread. Verify installed software and accessory support; no Thread version is certified for a physical unit.' },
      { target: 'e:zigbee', source: launch, claim: 'The 2023 Echo Show 8 includes a Zigbee smart-home hub for compatible accessories. This does not guarantee arbitrary Zigbee devices or transfer Echo Hub features.' },
      { target: 'e:bluetooth', source: launch, claim: 'Amazon lists Bluetooth for the 2023 Echo Show 8 smart-home hub. Specific audio profiles, codecs and accessory functions require separate verification.' },
      { target: 'e:alexa', source: launch, claim: 'The 2023 Echo Show 8 uses Alexa for supported smart-home requests. Verify exact devices and setup; no universal offline operation or subscription entitlement is established.' },
    ] },
    { slug: 'google-nest-hub-2nd-gen', label: 'Google Nest Hub second generation — not first generation or Max', claims: [
      { target: 'e:wifi', source: google, claim: 'Nest Hub second generation supports Matter over the home Wi-Fi network. Radio bands are not established by this hub list; configure the home network as Google requires.' },
      { target: 'e:matter', source: google, claim: 'Nest Hub second generation is a Google Home Matter controller over Wi-Fi and Thread. Enable IPv6 and verify current supported device types; this does not make the display an Apple or Alexa accessory.' },
      { target: 'e:thread', source: google, claim: 'Nest Hub second generation includes a Thread border router. Set up Google Home and the required IPv6 network; do not transfer this role to first-generation Nest Hub.' },
      { target: 'e:google-home', source: google, claim: 'Nest Hub second generation serves as a hub in Google Home after app and network setup. Supported accessory types and features must be checked separately.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:matter', type: 'protocol', label: 'Matter' },
    { id: 'e:thread', type: 'protocol', label: 'Thread' },
    { id: 'e:zigbee', type: 'protocol', label: 'Zigbee' },
    { id: 'e:bluetooth', type: 'protocol', label: 'Bluetooth' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Home' },
  ], {
    reviewedAt: DISPLAYS_REVIEWED_AT, supplier: 'Amazon / Google',
    validationMethod: 'Codex model-level official documentary review on 2026-09-07 UTC. Echo Show 8 Thread role corroborated against the September 2023 launch, separately from Echo Hub and 2025 releases. No physical hardware, seller ASIN, firmware, account or accessory test. Other connectivity fields remain incomplete.',
  });
}
