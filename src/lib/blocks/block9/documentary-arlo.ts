import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const ARLO_REVIEWED_AT = '2026-09-07T00:33:40.000Z';
const spec = { label: 'Arlo Essential Outdoor second-generation specification — VMC2050 HD', url: 'https://kb.arlo.com/000063761/Arlo-Essential-Outdoor-2nd-Generation-Spec-Sheet' };
const matrix = { label: 'Arlo assistant matrix — Essential Outdoor second generation', url: 'https://kb.arlo.com/000062278/What-smart-home-and-voice-assistant-systems-can-I-use-with-my-Arlo-devices' };
export function loadArloDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'arlo-essential-outdoor-camera', label: 'Arlo Essential Outdoor HD second generation — VMC2050 family', claims: [
      { target: 'e:wifi', source: spec, claim: 'Arlo documents 2.4 GHz Wi-Fi for Essential Outdoor HD second generation (VMC2050). Direct router connection does not establish Apple Home support; do not transfer 2K or third-generation specifications.' },
      { target: 'e:alexa', source: matrix, claim: 'Arlo lists Essential Outdoor second generation for Alexa integration. Verify current account linking and supported functions; this does not include every Arlo Secure subscription feature.' },
      { target: 'e:google-home', source: matrix, claim: 'Arlo lists Essential Outdoor second generation for Google Home integration. Check current setup and exposed camera functions; no offline or universal automation support is established.' },
      { target: 'e:apple-home', source: { label: 'Arlo Apple Home setup — required base and remote access conditions', url: 'https://kb.arlo.com/000063184' }, claim: 'Essential Outdoor HD second generation requires connection to an Arlo SmartHub or Base Station (VMB5000, VMB4540, VMB4500 or VMB4000) for Apple Home, not directly to the router. Remote Apple Home access also requires an Apple Home Hub.' },
      { target: 'e:smartthings', source: matrix, claim: 'Arlo lists Essential Outdoor second generation for SmartThings integration. Verify the current account setup and exposed camera functions; the camera is not a SmartThings hub and does not certify other accessories.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Home' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
    { id: 'e:smartthings', type: 'ecosystem', label: 'SmartThings' },
  ], {
    reviewedAt: ARLO_REVIEWED_AT, supplier: 'Arlo',
    validationMethod: 'Codex official generation-specific specification, assistant matrix and Apple Home requirements reviewed on 2026-09-07 UTC. No camera, base, firmware, account or seller-package test; catalog package quantity remains unresolved.',
  });
}
