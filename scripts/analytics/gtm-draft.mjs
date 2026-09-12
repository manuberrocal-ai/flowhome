import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANALYTICS_EVENT_FIELDS } from '../../src/lib/analytics-fields.js';

// Exact owner-workspace export, preserved outside the repo. No network or account API access.
export const REVIEWED_SEED_SHA256 = 'e10ab9085018b4ee573f0c1b362151018e0e4f9e8501af5e1ce57faf5cf63740';
const ACCOUNT = '6363209009';
const CONTAINER = '256769965';
const MEASUREMENT = 'G-PK1NYLMFCD';
const shared = ['event_id', 'session_id', 'consent_state', 'pathname', 'device_class', 'market', 'page_location', 'page_referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'campaign', 'experiment'];
const campaignFields = { campaign_source: 'utm_source', campaign_medium: 'utm_medium', campaign_name: 'utm_campaign', campaign_content: 'utm_content', campaign_term: 'utm_term' };
const params = item => Object.fromEntries(item.parameter.map(parameter => [parameter.key, parameter]));
const pair = (key, value) => ({ type: 'TEMPLATE', key, value });
const row = (key, value) => ({ type: 'MAP', map: [pair('parameter', key), pair('parameterValue', value)] });
const variableReference = field => `{{FH - ${field}}}`;
// Preserve Google's native IDs and campaign object; FlowHome identifiers remain custom fields.
export const ga4FieldName = field => field === 'session_id' ? 'flowhome_session_id' : field === 'campaign' ? 'flowhome_campaign' : field;

export function createGtmDraft(seed) {
  assert.equal(seed.exportFormatVersion, 2);
  const output = structuredClone(seed);
  const version = output.containerVersion;
  assert.equal(version.accountId, ACCOUNT);
  assert.equal(version.containerId, CONTAINER);
  assert.equal(version.container.publicId, 'GTM-KX37WSZQ');
  assert.deepEqual(version.tag.map(tag => tag.tagId).sort(), ['10', '3', '5']);
  assert.deepEqual(version.variable.map(variable => variable.variableId).sort(), ['7', '8']);
  assert.deepEqual(version.trigger.map(trigger => trigger.triggerId), ['9']);
  const google = version.tag.find(tag => tag.tagId === '3');
  const clarity = version.tag.find(tag => tag.tagId === '5');
  const eventSeed = version.tag.find(tag => tag.tagId === '10');
  assert.equal(google.type, 'googtag');
  assert.equal(params(google).tagId.value, MEASUREMENT);
  assert.equal(clarity.paused, true);
  assert.equal(eventSeed.type, 'gaawe');
  assert.equal(params(eventSeed).measurementIdOverride.value, MEASUREMENT);
  assert.equal(params(eventSeed).sendEcommerceData.value, 'false');
  const config = params(google).configSettingsTable.list;
  const configMap = Object.fromEntries(config.map(item => item.map.map(field => field.value)));
  assert.deepEqual(configMap, { send_page_view: 'false', allow_google_signals: 'false', allow_ad_personalization_signals: 'false', page_location: variableReference('page_location'), page_referrer: variableReference('page_referrer'), page_title: 'FlowHome' });
  config.push(...Object.entries(campaignFields).map(([name, field]) => row(name, variableReference(field))));

  const variableSeed = version.variable[0];
  let nextId = 100;
  const required = [...new Set([...shared, ...Object.values(ANALYTICS_EVENT_FIELDS).flat()])];
  for (const field of required) {
    if (version.variable.some(variable => variable.name === `FH - ${field}`)) continue;
    const variable = structuredClone(variableSeed);
    variable.variableId = String(nextId++);
    variable.name = `FH - ${field}`;
    params(variable).name.value = field;
    delete variable.fingerprint;
    version.variable.push(variable);
  }
  const triggerSeed = version.trigger[0];
  assert.equal(triggerSeed.type, 'CUSTOM_EVENT');
  assert.equal(triggerSeed.customEventFilter[0].type, 'EQUALS');
  assert.equal(triggerSeed.customEventFilter[0].parameter[1].value, 'affiliate_click');
  version.tag = [google, clarity];
  version.trigger = [];
  for (const [event, fields] of Object.entries(ANALYTICS_EVENT_FIELDS)) {
    const trigger = structuredClone(triggerSeed);
    trigger.triggerId = event === 'affiliate_click' ? '9' : String(nextId++);
    trigger.name = `FH - event - ${event}`;
    trigger.customEventFilter[0].parameter[1].value = event;
    delete trigger.fingerprint;
    const tag = structuredClone(eventSeed);
    tag.tagId = event === 'affiliate_click' ? '10' : String(nextId++);
    tag.name = `FH - GA4 - ${event}`;
    tag.firingTriggerId = [trigger.triggerId];
    params(tag).eventName.value = event;
    const eventFields = [...new Set([...shared, ...fields])];
    assert.ok(eventFields.length + 1 <= 25, 'GA4 event parameter budget exceeded');
    params(tag).eventSettingsTable.list = [
      ...eventFields.map(field => row(ga4FieldName(field), variableReference(field))),
      row('page_title', 'FlowHome'),
    ];
    delete tag.fingerprint;
    version.trigger.push(trigger);
    version.tag.push(tag);
  }
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [inputPath, outputPath] = process.argv.slice(2);
  assert.ok(inputPath && outputPath, 'Usage: node scripts/analytics/gtm-draft.mjs <reviewed-export.json> <new-draft.json>');
  const bytes = await readFile(inputPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), REVIEWED_SEED_SHA256, 'Export differs from the reviewed six-change workspace snapshot');
  const draft = createGtmDraft(JSON.parse(bytes));
  await writeFile(outputPath, JSON.stringify(draft, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ output: resolve(outputPath), tags: draft.containerVersion.tag.length, triggers: draft.containerVersion.trigger.length, variables: draft.containerVersion.variable.length, published: false }));
}
