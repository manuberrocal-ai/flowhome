/** Scoped manufacturer statements, not physical-unit verification or public approval. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const AQARA_REVIEWED_AT = '2026-09-06T23:22:53.000Z';
const hub = { label: 'Aqara US Hub M2 — supported children and ecosystem limits', url: 'https://www.aqara.com/us/product/hub-m2/' };
const matter = { label: 'Aqara M2 firmware 4.0.0 Beta announcement — conditional bridge path', url: 'https://www.aqara.com/en/aqara-hub-m2-matter-update-has-started-to-roll-out/' };
const p1 = { label: 'Aqara US Motion Sensor P1 — Zigbee hub and Matter bridge requirements', url: 'https://us.aqara.com/products/motion-sensor-p1' };

export function loadAqaraDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'aqara-hub-m2', label: 'Aqara Hub M2 — manufacturer model', claims: [
      { target: 'e:wifi', source: hub, claim: 'Aqara documents Wi-Fi b/g/n for Hub M2 and an Ethernet connection option. M2 is not a Wi-Fi router; a separate router and the documented setup are required. This does not verify arbitrary Wi-Fi accessory pairing.' },
      { target: 'e:zigbee', source: hub, claim: 'Aqara documents Zigbee 3.0 support for compatible Aqara child devices on Hub M2. The advertised maximum of 128 needs suitable repeaters; this is not verification of arbitrary third-party Zigbee devices or a guaranteed capacity for every installation.' },
      { target: 'e:apple-home', source: hub, claim: 'Aqara documents HomeKit integration for supported devices through Hub M2, but its IR controller is not exposed to Apple Home. Siri Shortcuts and Apple Home are not interchangeable; verify each accessory and required function.' },
      { target: 'e:matter', source: matter, claim: 'Aqara documents an M2 Matter bridge path in its firmware 4.0.0 Beta announcement: supported Zigbee devices reach a separate Matter controller on the same local network. Confirm current firmware and app requirements; the announcement does not certify the installed version or turn Zigbee devices into Thread devices.' },
    ] },
    { slug: 'aqara-motion-sensor-p1', label: 'Aqara Motion Sensor P1 — manufacturer model', claims: [
      { target: 'e:zigbee', source: p1, claim: 'Aqara specifies Zigbee 3.0 for Motion Sensor P1 with a compatible Aqara Zigbee 3.0 hub. The hub network requirements are not Wi-Fi support in the sensor; this does not establish pairing with other-brand hubs or identify the Thread-based P2 model.' },
      { target: 'e:matter', source: p1, claim: 'Aqara documents Matter support for Motion Sensor P1 through a Matter-compatible Aqara hub. This is a bridged path, not native Matter or Thread in the sensor; verify hub firmware, the receiving controller and which sensor functions are exposed before choosing a setup.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:zigbee', type: 'protocol', label: 'Zigbee' },
    { id: 'e:matter', type: 'protocol', label: 'Matter' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
  ], {
    reviewedAt: AQARA_REVIEWED_AT, supplier: 'Aqara',
    validationMethod: 'Codex documentary review of Aqara US model pages and the M2 firmware announcement on 2026-09-06; historical announcement retained as conditional evidence, not installed firmware or physical-unit certification.',
  });
}
