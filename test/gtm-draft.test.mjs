import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYTICS_EVENT_FIELDS } from '../src/lib/analytics-fields.js';
import { createGtmDraft, ga4FieldName } from '../scripts/analytics/gtm-draft.mjs';

const parameter = (key, value) => ({ type: 'TEMPLATE', key, value });
const tableRow = (name, value) => ({ type: 'MAP', map: [parameter('parameter', name), parameter('parameterValue', value)] });
const params = item => Object.fromEntries(item.parameter.map(row => [row.key, row]));
function seed() {
  return { exportFormatVersion: 2, containerVersion: {
    accountId: '6363209009', containerId: '256769965', container: { publicId: 'GTM-KX37WSZQ' },
    tag: [
      { tagId: '3', type: 'googtag', parameter: [parameter('tagId', 'G-PK1NYLMFCD'), { key: 'configSettingsTable', type: 'LIST', list: Object.entries({ send_page_view: 'false', allow_google_signals: 'false', allow_ad_personalization_signals: 'false', page_location: '{{FH - page_location}}', page_referrer: '{{FH - page_referrer}}', page_title: 'FlowHome' }).map(([name, value]) => tableRow(name, value)) }] },
      { tagId: '5', name: 'Microsoft Clarity - Official', paused: true },
      { tagId: '10', type: 'gaawe', parameter: [parameter('measurementIdOverride', 'G-PK1NYLMFCD'), { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' }, parameter('eventName', 'affiliate_click'), { type: 'LIST', key: 'eventSettingsTable', list: [tableRow('page_location', '{{FH - page_location}}')] }] },
    ],
    variable: ['page_location', 'page_referrer'].map((field, index) => ({ variableId: String(7 + index), type: 'v', name: `FH - ${field}`, parameter: [{ type: 'INTEGER', key: 'dataLayerVersion', value: '2' }, { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' }, parameter('name', field)] })),
    trigger: [{ triggerId: '9', type: 'CUSTOM_EVENT', customEventFilter: [{ type: 'EQUALS', parameter: [parameter('arg0', '{{_event}}'), parameter('arg1', 'affiliate_click')] }] }],
    customTemplate: [{ templateId: 'retained-template-fixture' }],
  } };
}

test('draft maps the shared nine-event allowlist exactly and leaves the original export untouched', () => {
  const input = seed();
  const before = structuredClone(input);
  const draft = createGtmDraft(input).containerVersion;
  assert.deepEqual(input, before);
  assert.equal(draft.tag.length, 11);
  assert.equal(draft.trigger.length, 9);
  assert.equal(draft.variable.length, 33);
  assert.deepEqual(draft.customTemplate, input.containerVersion.customTemplate);
  assert.deepEqual(draft.tag.find(tag => tag.tagId === '5'), input.containerVersion.tag[1]);
  const allIds = [...draft.tag.map(tag => tag.tagId), ...draft.trigger.map(trigger => trigger.triggerId), ...draft.variable.map(variable => variable.variableId)];
  assert.equal(new Set(allIds).size, allIds.length);
  for (const [event, fields] of Object.entries(ANALYTICS_EVENT_FIELDS)) {
    const tag = draft.tag.find(tag => tag.name === `FH - GA4 - ${event}`);
    const trigger = draft.trigger.find(trigger => trigger.triggerId === tag.firingTriggerId[0]);
    assert.equal(params(tag).eventName.value, event);
    assert.equal(params(tag).measurementIdOverride.value, 'G-PK1NYLMFCD');
    assert.equal(params(tag).sendEcommerceData.value, 'false');
    assert.deepEqual(trigger.customEventFilter, [{ type: 'EQUALS', parameter: [parameter('arg0', '{{_event}}'), parameter('arg1', event)] }]);
    const eventParams = Object.fromEntries(params(tag).eventSettingsTable.list.map(row => row.map.map(entry => entry.value)));
    assert.ok(Object.keys(eventParams).length <= 25);
    assert.equal(eventParams.page_location, '{{FH - page_location}}');
    assert.equal(eventParams.page_referrer, '{{FH - page_referrer}}');
    assert.equal(eventParams.page_title, 'FlowHome');
    assert.equal(eventParams.flowhome_session_id, '{{FH - session_id}}');
    assert.equal(eventParams.flowhome_campaign, '{{FH - campaign}}');
    for (const forbidden of ['session_id', 'client_id', 'user_id', 'debug_mode', 'campaign', 'link_url', 'page_url']) assert.equal(forbidden in eventParams, false);
    for (const field of fields) assert.equal(eventParams[ga4FieldName(field)], `{{FH - ${field}}}`);
    for (const field of Object.values(ANALYTICS_EVENT_FIELDS).flat()) {
      if (!fields.includes(field)) assert.equal(field in eventParams, false, `${event} must not map another event's ${field}`);
    }
    for (const value of Object.values(eventParams).filter(value => value.startsWith('{{'))) assert.ok(draft.variable.some(variable => `{{${variable.name}}}` === value));
  }
});

test('campaign attribution uses only sanitized UTM variables without overriding native client or session IDs', () => {
  const draft = createGtmDraft(seed()).containerVersion;
  const config = Object.fromEntries(params(draft.tag[0]).configSettingsTable.list.map(row => row.map.map(entry => entry.value)));
  assert.equal(config.campaign_source, '{{FH - utm_source}}');
  assert.equal(config.campaign_name, '{{FH - utm_campaign}}');
  assert.equal(config.send_page_view, 'false');
  assert.equal(config.allow_google_signals, 'false');
  assert.equal(config.allow_ad_personalization_signals, 'false');
  for (const field of ['client_id', 'session_id', 'user_id', 'debug_mode']) assert.equal(field in config, false);
  assert.ok(draft.variable.every(variable => params(variable).setDefaultValue.value === 'false'));
});

test('draft preparation refuses a different account, unreviewed tag set, enabled Clarity or unsafe base configuration', () => {
  for (const mutate of [
    version => { version.accountId = 'other'; },
    version => { version.containerId = 'other'; },
    version => { version.container.publicId = 'GTM-OTHER'; },
    version => { version.tag.push({ tagId: 'unknown' }); },
    version => { version.tag[1].paused = false; },
    version => { params(version.tag[0]).tagId.value = 'G-OTHER12345'; },
    version => { params(version.tag[0]).configSettingsTable.list.push(tableRow('debug_mode', 'true')); },
    version => { version.trigger[0].customEventFilter[0].type = 'MATCH_REGEX'; },
    version => { params(version.tag[2]).sendEcommerceData.value = 'true'; },
  ]) {
    const input = seed();
    mutate(input.containerVersion);
    assert.throws(() => createGtmDraft(input));
  }
});
