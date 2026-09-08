/**
 * Real-source documentary candidate; deliberately NOT installed in runtime.ts.
 * Model-level manufacturer statements do not verify a seller ASIN or firmware.
 * Owner activation and rendered qualification review remain separate gates.
 */
import type { ClaimLedgerEntry, CompatibilityEdge, CompatibilityNode } from './domain.ts';
import type { CompatibilityGraph } from './resolver.ts';
import type { CompatibilityGraphProvider } from './runtime.ts';
import { loadSwitchBotDocumentaryCandidate } from './documentary-switchbot.ts';
import { loadAqaraDocumentaryCandidate } from './documentary-aqara.ts';
import { loadAeotecDocumentaryCandidate } from './documentary-aeotec.ts';
import { loadKasaDocumentaryCandidate } from './documentary-kasa.ts';
import { loadLevoitDocumentaryCandidate } from './documentary-levoit.ts';
import { loadSchlageDocumentaryCandidate } from './documentary-schlage.ts';
import { loadYaleAugustDocumentaryCandidate } from './documentary-yale-august.ts';
import { loadThermostatDocumentaryCandidate } from './documentary-thermostats.ts';
import { loadRobotVacuumDocumentaryCandidate } from './documentary-robot-vacuums.ts';
import { loadLightingDocumentaryCandidate } from './documentary-lighting.ts';
import { loadBlinkDocumentaryCandidate } from './documentary-blink.ts';
import { loadArloDocumentaryCandidate } from './documentary-arlo.ts';
import { loadEufyDocumentaryCandidate } from './documentary-eufy.ts';

import { loadDisplayDocumentaryCandidate } from './documentary-displays.ts';

import { loadEntryDeviceDocumentaryCandidate } from './documentary-entry-devices.ts';

import { loadAmazonNetworkDocumentaryCandidate } from './documentary-amazon-network.ts';

import { loadBluetoothDocumentaryCandidate } from './documentary-bluetooth.ts';

import { loadSwitchBotIntegrationDocumentaryCandidate } from './documentary-switchbot-integrations.ts';
import { loadHubAssistantDocumentaryCandidate, HUB_ASSISTANTS_REVIEWED_AT } from './documentary-hub-assistants.ts';

const REVIEWED_AT = '2026-09-06T23:01:08.000Z';
// Editorial re-review deadline, not a manufacturer guarantee or runtime refresh.
const EXPIRES_AT = new Date(Date.parse(REVIEWED_AT) + 30 * 86_400_000).toISOString();
const SLUG = 'tapo-c120-security-camera';
const PRODUCT_ID = `p:${SLUG}`;

export const DOCUMENTARY_CANDIDATE_STATUS = Object.freeze({
  publicActivation: 'not_approved',
  coveredModels: 28,
  catalogModels: 28,
  identityScope: 'manufacturer models Tapo C120, SwitchBot Hub 2 and Blind Tilt, Aqara Hub M2 and Motion Sensor P1, Aeotec GP-AEOHUBV3US, Kasa EP10, HS220 and HS200, Levoit Core 300S, Schlage Encode BE489 Century, Yale YRD420-WF1, August Wi-Fi Smart Lock, ecobee Smart Thermostat Premium and Amazon Smart Thermostat, original Roborock Q5+ and Roomba j7+, Wyze Bulb Color, Govee H617C, Hue kit 562918 / UPC 046677562915, Blink Outdoor 4, Arlo Essential Outdoor HD second generation VMC2050 family, eufy C120 / T8400 family with unresolved hardware suffix, Echo Dot fifth generation, Echo Show 8 third generation (2023) and Nest Hub second generation, Meross MSG100 family with unresolved HomeKit suffix and original Ring Video Doorbell Wired; US scope, seller ASIN, package, hardware and firmware not independently matched',
  reviewedAt: REVIEWED_AT,
  latestReviewAt: HUB_ASSISTANTS_REVIEWED_AT,
  reviewDueAt: EXPIRES_AT,
});

/** Fresh object per read: tests/admin inspection cannot mutate later consumers. */
export function loadDocumentaryCompatibilityCandidate(): CompatibilityGraph {
  const targets = [
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa',
      claim: 'Tapo documents voice-activated viewing for the US C120 model with supported Alexa devices; check the exact device and setup.' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant',
      claim: 'Tapo documents voice-activated viewing for the US C120 model with supported Google Assistant devices; this does not establish every Google Home app or automation feature.' },
    { id: 'e:wifi', type: 'protocol', label: '2.4 GHz Wi-Fi',
      claim: 'The US C120 specifications list 2.4 GHz IEEE 802.11b/g/n Wi-Fi; this is not evidence of Ethernet, Matter, Thread or Zigbee support.' },
  ] as const;
  const nodes: CompatibilityNode[] = [
    { id: PRODUCT_ID, type: 'product', slug: SLUG, marketplaceId: null, marketplaceIdType: 'unknown', label: 'Tapo C120 — US manufacturer model', market: 'US', version: null },
    ...targets.map((target): CompatibilityNode => ({ id: target.id, type: target.type, slug: null, marketplaceId: null, marketplaceIdType: 'unknown', label: target.label, market: 'US', version: null })),
  ];
  const source = {
    label: 'Tapo US C120 model documentation — verify exact hardware and setup',
    url: 'https://www.tapo.com/us/product/smart-camera/tapo-c120/v1/',
    supplier: 'TP-Link / Tapo', accessedAt: REVIEWED_AT,
  };
  const validationMethod = 'Codex documentary review of manufacturer US model page, corroborated by TP-Link US specifications on 2026-09-06; no physical test or seller-variant verification.';
  const edges: CompatibilityEdge[] = targets.map((target) => ({
    id: `doc:c120:${target.id.slice(2)}:2026-09-06`, from: PRODUCT_ID, to: target.id,
    relation: 'works-with', claim: target.claim, market: 'US',
    scope: { productId: PRODUCT_ID, variantId: null, generationId: null, hardwareId: null, firmwareId: null, installation: null, electrical: null, housing: null },
    source: { ...source }, verifiedAt: REVIEWED_AT, confidence: 'medium', evidence: 'research-verified',
    validationMethod, expiry: EXPIRES_AT, status: 'active',
    reviewHistory: [{ reviewedAt: REVIEWED_AT, reviewerId: 'codex-documentary-review', verdict: 'pending', note: 'Documentary candidate prepared; owner/public activation remains pending.' }],
  }));
  // Candidate locations, not a record that these claims were publicly rendered.
  const ledger: ClaimLedgerEntry[] = edges.flatMap((edge) => ['product', 'quiz', 'comparison', 'alternatives'].map((surface): ClaimLedgerEntry => ({
    id: `${edge.id}:${surface}`, claim: edge.claim, visibleLocation: `${surface}:${SLUG}:compatibility`,
    entityId: PRODUCT_ID, entityVersion: null, market: 'US', source: { ...source },
    validationMethod, evidence: edge.evidence, confidence: edge.confidence,
    reviewDate: REVIEWED_AT, owner: 'unassigned', status: 'active', edgeId: edge.id,
    history: edge.reviewHistory.map((entry) => ({ ...entry })),
  })));
  for (const candidate of [loadSwitchBotDocumentaryCandidate(), loadAqaraDocumentaryCandidate(), loadAeotecDocumentaryCandidate(), loadKasaDocumentaryCandidate(), loadLevoitDocumentaryCandidate(), loadSchlageDocumentaryCandidate(), loadYaleAugustDocumentaryCandidate(), loadThermostatDocumentaryCandidate(), loadRobotVacuumDocumentaryCandidate(), loadLightingDocumentaryCandidate(), loadBlinkDocumentaryCandidate(), loadArloDocumentaryCandidate(), loadEufyDocumentaryCandidate(), loadDisplayDocumentaryCandidate(), loadEntryDeviceDocumentaryCandidate(), loadAmazonNetworkDocumentaryCandidate(), loadBluetoothDocumentaryCandidate(), loadSwitchBotIntegrationDocumentaryCandidate(), loadHubAssistantDocumentaryCandidate()]) {
    nodes.push(...candidate.nodes.filter(node => !nodes.some(existing => existing.id === node.id)));
    edges.push(...candidate.edges);
    ledger.push(...candidate.ledger);
  }
  return { nodes, edges, ledger };
}

/** Explicit injection for review only; importing this module never activates it. */
export const documentaryCandidateProvider: CompatibilityGraphProvider = {
  getGraph: loadDocumentaryCompatibilityCandidate,
};
