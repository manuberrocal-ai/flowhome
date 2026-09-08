import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const SWITCHBOT_INTEGRATIONS_REVIEWED_AT = '2026-09-07T01:03:19.000Z';
const hub = { label: 'SwitchBot Hub 2 US — supported Bluetooth products and assistants', url: 'https://us.switch-bot.com/products/switchbot-hub-2' };
const blind = { label: 'SwitchBot Blind Tilt US — proprietary BLE and hub requirements', url: 'https://us.switch-bot.com/pages/switchbot-blind-tilt' };
const alexa = { label: 'SwitchBot Blind Tilt Alexa setup and app-v9 hub connection', url: 'https://support.switch-bot.com/hc/en-us/articles/13918769034519-SwitchBot-Blind-Tilt-Alexa-Setup-Guide' };
const google = { label: 'SwitchBot Blind Tilt Google setup — historical UI instructions', url: 'https://support.switch-bot.com/hc/en-us/articles/13918677096471-SwitchBot-Blind-Tilt-Google-Setup-Guide' };

export function loadSwitchBotIntegrationDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'switchbot-hub-2', label: 'SwitchBot Hub 2 — integration roles', claims: [
      { target: 'e:bluetooth', source: hub, claim: 'Hub 2 connects supported SwitchBot products over Bluetooth. Check pairing, range and firmware; it is not a universal Bluetooth accessory controller and does not turn Bluetooth-only remotes into IR remotes.' },
      { target: 'e:alexa', source: hub, claim: 'SwitchBot documents Alexa integration with Hub 2 for supported devices and learned IR appliances. Verify account linking, device type and exposed commands; this is not Alexa Built-in or guaranteed compatibility with every appliance.' },
      { target: 'e:google-home', source: hub, claim: 'SwitchBot lists Google Home integration for Hub 2. Check current account setup, supported devices and actions; cloud integration and Matter bridging are distinct paths, neither certifying every accessory.' },
    ] },
    { slug: 'switchbot-blind-tilt', label: 'SwitchBot Blind Tilt — local BLE and hub-linked assistants', claims: [
      { target: 'e:bluetooth', source: blind, claim: 'SwitchBot documents proprietary low-energy Bluetooth with mesh support for Blind Tilt. Local app control and hub-mediated remote access are different paths; do not infer generic Bluetooth Mesh interoperability or native Wi-Fi.' },
      { target: 'e:alexa', source: alexa, claim: 'Blind Tilt Alexa setup requires an added Hub Mini or Hub 2, current firmware and account linking. From app version 9, hub connection within Bluetooth range replaces the manual Cloud Service toggle. Verify supported tilt commands; this does not establish blind lifting or cloud-free control.' },
      { target: 'e:google-home', source: google, claim: 'Blind Tilt Google integration requires Hub Mini or Hub 2 and SwitchBot account linking. This guide retains older Cloud Services UI steps; verify the current app connection flow and supported tilt commands. It does not establish blind lifting or every Google Home routine.' },
    ] },
  ], [
    { id: 'e:bluetooth', type: 'protocol', label: 'Bluetooth' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Home' },
  ], {
    reviewedAt: SWITCHBOT_INTEGRATIONS_REVIEWED_AT, supplier: 'SwitchBot',
    validationMethod: 'Codex official US pages and assistant guides reviewed on 2026-09-07 UTC. Older Google UI retained as a limitation; Alexa guide documents app-v9 change. Command reference https://support.switch-bot.com/hc/en-us/articles/11611353490199-Voice-Commands-for-Control-SwitchBot-Blind-Tilt-With-Alexa-and-Google-Assistant reviewed separately. No pairing, firmware, account, blind movement, IR learning or seller-variant test.',
  });
}
