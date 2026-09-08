/** Review-only model families; no seller revision, Home Key or unlock-command certification. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const YALE_AUGUST_REVIEWED_AT = '2026-09-06T23:59:35.000Z';
const yale = { label: 'Yale US Assure Lock 2 keyed Wi-Fi touchscreen — family page', url: 'https://shopyalehome.com/products/yale-assure-lock-2-touchscreen-with-wi-fi' };
const august = { label: 'August Wi-Fi Smart Lock — model page and integration comparison', url: 'https://august.com/products/august-wifi-smart-lock' };

export function loadYaleAugustDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'yale-assure-lock-2-wifi', label: 'Yale Assure Lock 2 YRD420-WF1 — US keyed touchscreen family', claims: [
      { target: 'e:wifi', source: yale, claim: 'Yale documents Wi-Fi app access for the standard keyed YRD420-WF1 touchscreen family. Confirm the installed module and setup; the page default finish does not verify the catalog seller package or network band.' },
      { target: 'e:alexa', source: yale, claim: 'Yale lists Alexa voice integration for Assure Lock 2 with Wi-Fi. Check account linking and permitted commands; this does not certify voice unlocking, door fit or another Yale module.' },
      { target: 'e:google-home', source: yale, claim: 'Yale lists Google voice integration for Assure Lock 2 with Wi-Fi. Verify setup and supported functions; do not infer every automation or features of Touch or Plus.' },
      { target: 'e:apple-home', source: yale, claim: 'Yale documents Apple Home and Siri for standard Assure Lock 2, with a home hub for remote access. Check current hub requirements; HomeKit is not evidence of Apple Home Key or Plus features.' },
    ] },
    { slug: 'august-wifi-smart-lock', label: 'August Wi-Fi Smart Lock — US manufacturer model', claims: [
      { target: 'e:wifi', source: august, claim: 'August documents built-in Wi-Fi and app access for Wi-Fi Smart Lock without an additional bridge. Confirm the exact unit and network requirements; this does not verify seller revision, network band or offline smart functions.' },
      { target: 'e:alexa', source: august, claim: 'August lists Alexa integration for Wi-Fi Smart Lock, requiring Wi-Fi in its comparison. Check current setup and allowed commands; voice unlocking and security settings have not been tested.' },
      { target: 'e:google-home', source: august, claim: 'August lists Google Assistant integration for Wi-Fi Smart Lock with Wi-Fi required. This does not establish all Google Home functions or compatibility for another August or Yale model.' },
      { target: 'e:apple-home', source: august, claim: 'August lists Siri and HomeKit for Wi-Fi Smart Lock. Check current Apple setup and remote-access requirements; this does not establish Apple Home Key or equivalent support for the plain Smart Lock model.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple HomeKit' },
  ], {
    reviewedAt: YALE_AUGUST_REVIEWED_AT, supplier: 'Yale / August',
    validationMethod: 'Codex review of two official US product pages on 2026-09-06. Support FAQ full text unavailable and not used as sole evidence. No seller revision, module inspection, physical lock operation or account integration tested.',
  });
}
