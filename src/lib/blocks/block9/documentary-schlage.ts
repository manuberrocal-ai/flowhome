/** Encode BE489 Century only; never imports capabilities from Encode Plus. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const SCHLAGE_REVIEWED_AT = '2026-09-06T23:56:06.000Z';
const source = { label: 'Schlage Encode BE489 Century US — network and voice requirements', url: 'https://www.schlage.com/en/home/products/BE489WBCENFFF.html' };

export function loadSchlageDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'schlage-encode-smart-wifi-deadbolt', label: 'Schlage Encode BE489 Century — US manufacturer family', claims: [
      { target: 'e:wifi', source, claim: 'Schlage specifies a 2.4 GHz Wi-Fi network for Encode BE489 Century and Schlage Home app pairing for remote control. This family-level evidence does not verify the seller unit, door fit or fully offline smart functions.' },
      { target: 'e:alexa', source, claim: 'Schlage documents Alexa voice control for Encode BE489 when paired with Schlage Home and a voice-enabled device. Check supported commands and security settings; this does not certify voice unlocking or Encode Plus features.' },
      { target: 'e:google-home', source, claim: 'Schlage documents Google Assistant voice control for Encode BE489 with Schlage Home and a voice-enabled device. Do not infer every Google Home function, voice unlocking or support for a different Schlage model.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
  ], {
    reviewedAt: SCHLAGE_REVIEWED_AT, supplier: 'Schlage / Allegion',
    validationMethod: 'Codex documentary review of the US BE489 Century product page on 2026-09-06; family-level only, not seller finish/package, installed firmware, door fit or physical access-control testing.',
  });
}
