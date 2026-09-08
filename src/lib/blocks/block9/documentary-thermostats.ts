/** Connectivity and assistant evidence is not a household HVAC compatibility assessment. */
import { buildDocumentaryModelCandidates } from './documentary-candidate-builder.ts';

export const THERMOSTATS_REVIEWED_AT = '2026-09-07T00:08:56.000Z';
const ecobee = { label: 'ecobee Smart Thermostat Premium US — connectivity and assistant conditions', url: 'https://www.ecobee.com/en-us/smart-thermostats/smart-thermostat-premium/' };
const amazon = { label: 'Amazon Smart Thermostat US guide — external voice control, no built-in microphone', url: 'https://m.media-amazon.com/images/G/01/kindle/journeys/MmE1OWJhOGQt/Smart_Thermostat_Online_Hello_Guide.pdf' };

export function loadThermostatDocumentaryCandidate() {
  return buildDocumentaryModelCandidates([
    { slug: 'ecobee-smart-thermostat-premium', label: 'ecobee Smart Thermostat Premium — US model', claims: [
      { target: 'e:wifi', source: ecobee, claim: 'ecobee specifies 2.4 and 5 GHz Wi-Fi for Smart Thermostat Premium. Network support does not verify household HVAC wiring, seller revision or offline smart functions.' },
      { target: 'e:alexa', source: ecobee, claim: 'Smart Thermostat Premium has Alexa Built-in. Check setup and supported commands; this does not include every subscription-dependent ecobee Smart Security function.' },
      { target: 'e:google-home', source: ecobee, claim: 'ecobee lists Google Assistant integration for Smart Thermostat Premium. Verify current setup and exposed functions; not every Google Home automation is established.' },
      { target: 'e:apple-home', source: ecobee, claim: 'ecobee lists HomeKit for Smart Thermostat Premium; enabling Siri on the thermostat requires a compatible HomePod or HomePod mini. Check current software requirements.' },
      { target: 'e:smartthings', source: ecobee, claim: 'ecobee lists SmartThings integration for Smart Thermostat Premium. This thermostat integration does not make it a SmartThings hub or certify other accessories; verify supported functions.' },
    ] },
    { slug: 'amazon-smart-thermostat', label: 'Amazon Smart Thermostat — US model', claims: [
      { target: 'e:alexa', source: amazon, claim: 'The Amazon Smart Thermostat guide documents Alexa control through a compatible Alexa-enabled device or the Alexa app; the thermostat has no built-in microphone. Follow the app setup and check HVAC compatibility separately.' },
    ] },
  ], [
    { id: 'e:wifi', type: 'protocol', label: 'Wi-Fi' },
    { id: 'e:alexa', type: 'ecosystem', label: 'Amazon Alexa' },
    { id: 'e:google-home', type: 'ecosystem', label: 'Google Assistant' },
    { id: 'e:apple-home', type: 'ecosystem', label: 'Apple Home' },
    { id: 'e:smartthings', type: 'ecosystem', label: 'SmartThings' },
  ], {
    reviewedAt: THERMOSTATS_REVIEWED_AT, supplier: 'ecobee / Amazon',
    validationMethod: 'Codex official US page and guide review on 2026-09-07 UTC; Amazon microphone note visually checked. No household wiring, unit, account or firmware test. Amazon network band not established by this guide.',
  });
}
