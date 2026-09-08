import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const ENTRY_DEVICES_REVIEWED_AT = '2026-09-07T00:48:29.000Z';
const meross = { label: 'Meross official MSG100 store — US option, HomeKit suffix unresolved', url: 'https://shop.meross.com/products/smart-wifi-garage-door-opener' };
const ring = { label: 'Ring US original Video Doorbell Wired specifications', url: 'https://ring.com/support/products/doorbells/video-doorbell-wired?page=1' };

export function loadEntryDeviceDocumentaryCandidate() {
  const scope = 'MSG100 family; HomeKit hardware suffix and motor compatibility remain unverified. ';
  return buildDocumentaryModelCandidates([
    { slug: 'meross-smart-garage-door-opener', label: 'Meross MSG100 family — HomeKit variant unresolved', claims: [
      { target: 'e:wifi', source: meross, claim: scope + 'The store lists 2.4 GHz 802.11 b/g/n Wi-Fi, excluding Enterprise Wi-Fi. Verify coverage near the motor and the exact regional kit.' },
      { target: 'e:alexa', source: meross, claim: scope + 'Meross documents Alexa integration after account linking. Check supported commands and safeguards; this does not establish safe unattended operation.' },
      { target: 'e:google-home', source: meross, claim: scope + 'Meross documents Google Assistant integration after account linking. Verify supported commands and safeguards; not a replacement motor or universal garage-door compatibility.' },
      { target: 'e:apple-home', source: meross, claim: scope + 'HomeKit applies to the HomeKit-enabled version shown by the store. Verify the device setup code, variant and current Apple remote-access requirements before relying on this signal.' },
    ] },
    { slug: 'ring-video-doorbell-wired', label: 'Original Ring Video Doorbell Wired — not 2K or Pro', claims: [
      { target: 'e:wifi', source: ring, claim: 'Original Ring Video Doorbell Wired uses 2.4 GHz 802.11 b/g/n Wi-Fi. This does not transfer 5 GHz support from Pro or certify the wiring and power supply.' },
      { target: 'e:alexa', source: ring, claim: 'Original Ring Video Doorbell Wired supports Alexa through linked Ring and Amazon accounts and compatible Alexa devices. Check feature-specific subscription requirements; no blanket free recording or offline-operation claim.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
  ], {
    reviewedAt: ENTRY_DEVICES_REVIEWED_AT, supplier: 'Meross / Ring',
    validationMethod: 'Codex official model documentary review on 2026-09-07 UTC. Setup corroboration: https://www.meross.com/en-gc/support/FAQ/208.html and https://ring.com/support/articles/ms6ai/Connecting-Amazon-Alexa-Enabled-Devices-Ring-Devices . Meross motor checker distinguishes MSG100/MSG100HK; physical suffix, motor, sensor, firmware, seller kit, wiring and account tests remain unverified. No motor actuation or installation attempted.',
  });
}
