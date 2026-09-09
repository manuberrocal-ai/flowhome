/** Manufacturer-documentation candidates only; no runtime registration or physical certification. */
import type { CompatibilityGraph } from './resolver.ts';
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const SWITCHBOT_REVIEWED_AT = '2026-09-06T23:16:35.000Z';
const support = 'https://support.switch-bot.com/hc/en-us/articles/';
const sources = {
  setup: { label: 'SwitchBot Hub 2 setup — 2.4 GHz network', url: `${support}17784047699479-How-to-Set-up-SwitchBot-Hub-2` },
  matter: { label: 'SwitchBot Matter compatibility — bridge and controller roles', url: `${support}38979658026519-SwitchBot-Device-Matter-Compatibility` },
  apple: { label: 'SwitchBot Hub 2 Apple Home setup via Matter', url: `${support}35214812208023-SwitchBot-Hub-2-Matter-Setup-iOS` },
  actions: { label: 'SwitchBot bridged device actions and firmware limits', url: `${support}13282638111127-Which-SwitchBot-Devices-Can-Be-Added-to-Apple-Home-As-Sub-devices-via-Matter` },
};

export function loadSwitchBotDocumentaryCandidate(): CompatibilityGraph {
  const models = [
    { slug: 'switchbot-hub-2', label: 'SwitchBot Hub 2 — manufacturer model', claims: [
      { target: 'e:wifi', source: sources.setup, claim: 'SwitchBot documents Hub 2 setup on a 2.4 GHz Wi-Fi network using its app; check current app and firmware instructions. This does not establish support for 5 GHz networks or arbitrary Wi-Fi accessories.' },
      { target: 'e:matter', source: sources.matter, claim: 'SwitchBot lists Hub 2 as a Matter bridge for supported SwitchBot devices, used with a platform-specific Matter controller. This is not evidence that Hub 2 itself is a universal Matter controller or Thread border router; check supported accessories and firmware.' },
      { target: 'e:apple-home', source: sources.apple, claim: 'SwitchBot documents adding Hub 2 as a gateway with temperature and humidity readings in Apple Home via Matter. Setup requires an iPhone, a compatible HomePod or Apple TV, current SwitchBot app and firmware, and the documented network setup; only supported secondary devices can be synced.' },
    ] },
    { slug: 'switchbot-blind-tilt', label: 'SwitchBot Blind Tilt — manufacturer model', claims: [
      { target: 'e:matter', source: sources.matter, claim: 'SwitchBot lists Blind Tilt as Matter over Bridge: it needs a compatible SwitchBot Matter bridge, such as Hub 2, and the target platform controller. Add and pair it in the SwitchBot app; this is not direct Matter over Wi-Fi or Thread support.' },
      { target: 'e:apple-home', source: sources.actions, claim: 'SwitchBot documents Blind Tilt opening and closing actions in Apple Home through a compatible Matter bridge such as Hub 2. Closing direction depends on firmware and configuration; check those instructions and the bridge device-slot limit. This does not establish blind lifting or every app function in Apple Home.' },
    ] },
  ];
  return buildDocumentaryModelCandidates(models, [
      { id: 'e:wifi', type: 'protocol' as const, label: '2.4 GHz Wi-Fi' },
      { id: 'e:matter', type: 'protocol' as const, label: 'Matter' },
      { id: 'e:apple-home', type: 'ecosystem' as const, label: 'Apple Home' },
  ], {
    reviewedAt: SWITCHBOT_REVIEWED_AT, supplier: 'SwitchBot',
    validationMethod: 'Codex documentary review of SwitchBot support, corroborated with the US Hub 2 manufacturer page on 2026-09-06; no physical test, seller-ASIN matching or installed firmware verification.',
  });
}
