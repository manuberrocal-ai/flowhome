/** Core 300S manual scope; no automatic equivalence with another retail revision. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const LEVOIT_REVIEWED_AT = '2026-09-06T23:51:43.000Z';
const source = { label: 'Levoit Core 300S US manual — model and VeSync setup, pages 1, 2 and 7', url: 'https://files.vesync.com/desc/LEVOIT_Core300S_USER_MANUAL.pdf' };

export function loadLevoitDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'levoit-core-300s-air-purifier', label: 'Levoit Core 300S — US manufacturer model', claims: [
      { target: 'e:wifi', source, claim: 'The Core 300S manual documents Wi-Fi connection through VeSync and separate on-device controls. Follow the app setup for the exact unit; this does not verify network band, fully offline smart functions or another retail revision.' },
      { target: 'e:alexa', source, claim: 'The Core 300S manual documents Alexa connection through VeSync and requires your own VeSync account for voice assistants. Follow current in-app instructions; individual commands and the installed firmware have not been tested.' },
      { target: 'e:google-home', source, claim: 'The Core 300S manual documents Google Assistant connection through VeSync with your own VeSync account. This does not establish every Google Home app function, automation or another Core-series model.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
  ], {
    reviewedAt: LEVOIT_REVIEWED_AT, supplier: 'Levoit / VeSync',
    validationMethod: 'Codex visual documentary review of Core 300S manual pages 1, 2 and 7 on 2026-09-06. Current 300S-P page separately inspected but not used to infer seller revision equivalence; no physical, account, firmware or health-outcome test.',
  });
}
