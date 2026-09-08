/** Original vacuum models only; assistant commands do not add mopping or Apple Home support. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const ROBOT_VACUUMS_REVIEWED_AT = '2026-09-07T00:18:24.000Z';
const q5 = { label: 'Roborock US original Q5 / Q5+ — voice control', url: 'https://us.roborock.com/pages/roborock-q5' };
const q5Manual = { label: 'Roborock Q5+ manual — app connection, printed page 08', url: 'https://support.roborock.com/hc/en-us/article_attachments/5983654392089' };
const j7 = { label: 'iRobot US j7 / j7+ — assistant-enabled devices', url: 'https://www.irobot.com/en_US/roomba-j7-robot-vacuum/J715020.html?cgid=us&pr_rd_page=2' };
const j7Manual = { label: 'Roomba j7+ North American guide — Wi-Fi setup, printed page 3', url: 'https://prod-help-content.care.irobotapi.com/files/og-online-only/j7-robot-plusadd-na-onlineonly.pdf' };

export function loadRobotVacuumDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'roborock-q5-plus', label: 'Roborock original Q5+ — US model', claims: [
      { target: 'e:wifi', source: q5Manual, claim: 'The original Q5+ manual specifies 2.4 GHz Wi-Fi and setup through Roborock or Mi Home. Follow current in-app steps; this is not documentation for Q5 Pro, Max or DuoRoller variants.' },
      { target: 'e:alexa', source: q5, claim: 'Roborock lists Alexa voice control for the original Q5/Q5+ series. Verify account setup and supported cleaning commands; do not transfer later Q5 variant features or assume offline voice control.' },
      { target: 'e:google-home', source: q5, claim: 'Roborock lists Google Home voice control for the original Q5/Q5+ series. Check current setup and supported commands. The separate Siri Shortcuts listing does not establish Apple Home or HomeKit support.' },
    ] },
    { slug: 'irobot-roomba-j7-plus', label: 'iRobot Roomba original j7+ — US model', claims: [
      { target: 'e:wifi', source: j7Manual, claim: 'The original Roomba j7+ guide documents Wi-Fi setup using the iRobot Home app and adequate coverage near the Clean Base. This reviewed setup page does not establish a network band or seller-specific package.' },
      { target: 'e:alexa', source: j7, claim: 'iRobot documents original j7/j7+ voice cleaning with Alexa-enabled devices. Verify current account setup and supported commands; this does not turn the vacuum into a Roomba Combo or add mopping.' },
      { target: 'e:google-home', source: j7, claim: 'iRobot documents original j7/j7+ voice cleaning with Google Home-enabled devices. Check current setup and supported commands; the robot and Clean Base are not generic smart-home hubs.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
  ], {
    reviewedAt: ROBOT_VACUUMS_REVIEWED_AT, supplier: 'Roborock / iRobot',
    validationMethod: 'Codex official US model-page review and visual review of Q5+ manual printed page 08 and j7+ guide printed page 3 on 2026-09-07 UTC. No unit, household, account, firmware or seller-package test.',
  });
}
