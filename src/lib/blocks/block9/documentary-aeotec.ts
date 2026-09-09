/** V3 US model only; the newer Smart Home Hub 2 is not covered by this candidate. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const AEOTEC_REVIEWED_AT = '2026-09-06T23:28:41.000Z';
const specs = { label: 'Aeotec V3 regional specifications — confirm GP-AEOHUBV3US', url: 'https://aeotec.freshdesk.com/support/solutions/articles/6000240466-smart-home-hub-technical-specifications' };
const product = { label: 'Aeotec Smart Home Hub — Thread border-router role', url: 'https://aeotec.com/products/aeotec-smartthings-hub/' };
const pairing = { label: 'Aeotec Smart Home Hub — device-specific pairing through SmartThings', url: 'https://aeotec.freshdesk.com/support/solutions/articles/6000240427-installing-removing-devices-smart-home-hub' };
const setup = { label: 'Aeotec Smart Home Hub — SmartThings registration and account setup', url: 'https://aeotec.freshdesk.com/support/solutions/articles/6000240326-how-to-setup-smart-home-hub' };

export function loadAeotecDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'aeotec-smartthings-hub', label: 'Aeotec GP-AEOHUBV3US — manufacturer model', claims: [
      { target: 'e:wifi', source: specs, claim: 'Aeotec specifies 2.4 GHz Wi-Fi with WPA2 for the GP-AEOHUBV3 family, including the US model; Ethernet is also available. Do not infer 5 GHz support from the broader radio-standard list, or transfer these specifications to Smart Home Hub 2.' },
      { target: 'e:zigbee', source: pairing, claim: 'Aeotec documents adding supported Zigbee devices to Smart Home Hub through the SmartThings brand and device selection flow. Follow the accessory-specific pairing instructions; this is not verification that every Zigbee accessory or function is supported by GP-AEOHUBV3US.' },
      { target: 'e:matter', source: pairing, claim: 'Aeotec documents registering Matter devices with Smart Home Hub through SmartThings using the device Matter code. Check the current hub firmware, supported device type and exposed functions; the GP-AEOHUBV3US model documentation does not certify a particular accessory pairing.' },
      { target: 'e:thread', source: product, claim: 'Aeotec documents Smart Home Hub as a Thread border router; the V3 specifications include Thread. For GP-AEOHUBV3US, confirm current firmware and the intended Matter or Thread setup. A border-router role does not prove every accessory, app function or cloud-free routine works.' },
      { target: 'e:smartthings', source: setup, claim: 'Aeotec documents registering Smart Home Hub in SmartThings with a Samsung account and network connection. This identifies the GP-AEOHUBV3US hub role, not guaranteed compatibility for another product, a completed migration or a fully offline setup.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:zigbee', type: 'protocol', label: 'Zigbee' },
    { id: 'e:matter', type: 'protocol', label: 'Matter' },
    { id: 'e:thread', type: 'protocol', label: 'Thread' },
    { id: 'e:smartthings', type: 'ecosystem', label: 'SmartThings' },
  ], {
    reviewedAt: AEOTEC_REVIEWED_AT, supplier: 'Aeotec',
    validationMethod: 'Codex documentary review of Aeotec V3 regional specifications updated 2026-01-08, product and setup guides on 2026-09-06; US model scope only, no physical unit, seller offer, accessory pairing or installed firmware verified.',
  });
}
