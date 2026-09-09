import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const EUFY_REVIEWED_AT = '2026-09-07T00:37:12.000Z';
const matrix = { label: 'eufy Indoor Cam comparison — fixed T8400 column, suffix unverified', url: 'https://service.eufy.com/article-description/Differences-Between-eufy-Indoor-Cams' };
export function loadEufyDocumentaryCandidate() {
  const scope = 'Family T8400 only; catalog T8400X/T84001W1 hardware suffix remains unverified. ';
  return buildDocumentaryModelCandidates([
    { slug: 'eufy-security-indoor-cam-c120', label: 'eufy C120 / fixed T8400 family — hardware suffix unresolved', claims: [
      { target: 'e:wifi', source: matrix, claim: scope + 'eufy lists 2.4 GHz Wi-Fi for this fixed indoor camera, not a battery-powered outdoor or pan-and-tilt model.' },
      { target: 'e:alexa', source: matrix, claim: scope + 'eufy lists Alexa integration. Verify current linking and exposed camera functions; no universal automation or cloud-free operation is established.' },
      { target: 'e:google-home', source: matrix, claim: scope + 'eufy lists Google Assistant integration. Check current setup and supported viewing functions; this is not every Google Home feature.' },
      { target: 'e:apple-home', source: matrix, claim: scope + 'eufy lists HomeKit at 1080p. Add Indoor Cam 2K in the eufy app before enabling HomeKit; verify current Apple hub and recording-plan requirements separately.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
  ], {
    reviewedAt: EUFY_REVIEWED_AT, supplier: 'eufy',
    validationMethod: 'Codex official fixed T8400 comparison column and Indoor Cam 2K section of https://service.eufy.com/article-description/How-to-Setup-HomeKit-for-HomeKit-Enabled-Security-Devices reviewed on 2026-09-07 UTC. No hardware-suffix, account, firmware, US seller-package or physical test.',
  });
}
