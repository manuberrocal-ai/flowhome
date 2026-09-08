import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const BLINK_REVIEWED_AT = '2026-09-07T00:28:30.000Z';
export function loadBlinkDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'blink-outdoor-4', label: 'Blink Outdoor 4 — US camera family', claims: [
      { target: 'e:wifi', source: { label: 'Blink Outdoor 4 US technical specifications', url: 'https://support.blinkforhome.com/en_US/outdoor4-camera-tech-specs' }, claim: 'Blink Outdoor 4 specifies 2.4 GHz 802.11b/g/n Wi-Fi and requires a compatible Blink Sync Module. Check module inclusion separately; network compatibility does not establish local storage hardware.' },
      { target: 'e:alexa', source: { label: 'Blink Outdoor 4 FAQ — account linking, module and subscription limits', url: 'https://support.blinkforhome.com/en_US/faq-outdoor4/outdoor4-camera-faq' }, claim: 'Outdoor 4 supports compatible Alexa devices after linking Blink and Alexa accounts. A Blink Sync Module is required; Person Detection and cloud recording have separate plan or trial conditions.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
  ], {
    reviewedAt: BLINK_REVIEWED_AT, supplier: 'Blink / Amazon',
    validationMethod: 'Codex official Outdoor 4 US specification and FAQ review on 2026-09-07 UTC. No camera, Sync Module, account, subscription or seller-package test.',
  });
}
