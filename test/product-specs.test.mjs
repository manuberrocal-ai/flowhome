import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductFeatures, getEcosystemFeatures, getHighlights, CATEGORY_FEATURE_MATRIX } from '../src/lib/product-specs.ts';

const camera = { category: 'security-camera', resolution: '1080p', fieldOfView: 130, nightVision: true, twoWayAudio: false, storage: 'MicroSD', subscriptionRequired: false };
const vacuum = { category: 'robot-vacuum', suctionPower: 2500, batteryRuntime: 180, hasMop: true, lidarMapping: true, obstacleDetection: true, noiseLevel: 65, wifi: true };
const speaker = { category: 'smart-speaker', wifi: true, bluetooth: true, alexaCompatible: true, googleHomeCompatible: false, appleHomeKit: false, matter: false };

test('display rows preserve canonical source fields independently of visible labels', () => {
  for (const category of Object.keys(CATEGORY_FEATURE_MATRIX)) {
    for (const feature of getProductFeatures({ category })) {
      assert.ok(CATEGORY_FEATURE_MATRIX[category].some(row => row.sourceField === feature.sourceField && row.label === feature.label));
    }
  }
  assert.deepEqual(getEcosystemFeatures({}).map(row => row.sourceField), ['wifi', 'bluetooth', 'zigbee', 'matter', 'alexaCompatible', 'googleHomeCompatible', 'appleHomeKit', 'thread', 'smartthingsIntegration']);
});

test('security camera exposes resolution, night vision and storage but hides empty fields', () => {
  const features = getProductFeatures(camera);
  const labels = features.map((f) => f.label);
  assert.ok(labels.includes('Resolution'));
  assert.ok(labels.includes('Field of view'));
  assert.ok(labels.includes('Night vision'));
  assert.ok(labels.includes('Local storage'));
  assert.ok(!labels.includes('Field of view extras'));
  const fov = features.find((f) => f.label === 'Field of view');
  assert.equal(fov?.value, 'Catalog: 130\u00b0 (unverified)');
  const sub = features.find((f) => f.label === 'Subscription required');
  assert.equal(sub, undefined, 'A catalog boolean cannot establish feature-specific subscription requirements');
  assert.ok(labels.includes('Two-way audio'));
});

test('subscription flags never become blanket service claims or highlights', () => {
  for (const category of ['security-camera', 'video-doorbell']) {
    for (const subscriptionRequired of [true, false, undefined, null, 'No', 'free', 0, {}]) {
      const product = { category, subscriptionRequired };
      assert.deepEqual(getProductFeatures(product), getProductFeatures({ category }), `${category}: ${String(subscriptionRequired)}`);
      assert.deepEqual(getHighlights(product), getHighlights({ category }));
    }
  }
});

test('robot vacuum exposes suction, runtime, mopping, LiDAR, noise but never nightVision', () => {
  const features = getProductFeatures(vacuum);
  const labels = features.map((f) => f.label);
  assert.ok(labels.includes('Suction power'));
  assert.ok(labels.includes('Battery runtime'));
  assert.ok(labels.includes('Mopping support'));
  assert.ok(labels.includes('LiDAR mapping'));
  assert.ok(labels.includes('Noise level'));
  assert.ok(labels.includes('Wi-Fi'));
  assert.ok(!labels.includes('Night vision'), 'nightVision must not leak into robots');
  const runtime = features.find((f) => f.label === 'Battery runtime');
  assert.equal(runtime?.value, 'Catalog: 180 min (unverified)');
});

test('smart speaker never exposes nightVision, hasMop, or resolution', () => {
  const features = getProductFeatures(speaker);
  const labels = features.map((f) => f.label);
  assert.ok(!labels.includes('Night vision'));
  assert.ok(!labels.includes('Mopping support'));
  assert.ok(!labels.includes('Resolution'));
  assert.ok(labels.includes('Wi-Fi'));
  assert.ok(labels.includes('Bluetooth'));
  assert.ok(labels.includes('Alexa'));
});

test('unknown category returns empty feature list', () => {
  assert.deepEqual(getProductFeatures({ category: 'nope' }), []);
  assert.deepEqual(getProductFeatures({}), []);
});

test('empty scalar values are omitted while boolean uncertainty remains explicit', () => {
  const minimal = { category: 'security-camera', resolution: '', nightVision: false };
  const features = getProductFeatures(minimal);
  const labels = features.map((f) => f.label);
  assert.ok(!labels.includes('Resolution'));
  assert.ok(labels.includes('Night vision'));
  assert.equal(features.find((f) => f.label === 'Night vision')?.value, 'Catalog: No (unverified)');
});

test('getEcosystemFeatures qualifies catalog booleans', () => {
  const eco = getEcosystemFeatures(speaker);
  const alexa = eco.find((f) => f.label === 'Alexa');
  assert.equal(alexa?.value, 'Catalog: Yes (unverified)');
  const google = eco.find((f) => f.label === 'Google Home');
  assert.equal(google?.value, 'Catalog: No (unverified)');
});

test('getHighlights returns up to 6 values for a feature-rich product', () => {
  const highlights = getHighlights(vacuum);
  assert.ok(highlights.length <= 6);
  assert.ok(highlights.includes('Catalog: 180 min (unverified)'));
});

test('CATEGORY_FEATURE_MATRIX covers every canonical category', () => {
  const categories = Object.keys(CATEGORY_FEATURE_MATRIX);
  const expected = [
    'security-camera', 'video-doorbell', 'smart-lock', 'smart-speaker', 'smart-display',
    'smart-lighting', 'smart-plug', 'smart-thermostat', 'robot-vacuum', 'smart-hub',
    'motion-sensor', 'air-purifier', 'garage-door-opener', 'smart-blinds',
  ];
  assert.deepEqual([...categories].sort(), [...expected].sort());
});

