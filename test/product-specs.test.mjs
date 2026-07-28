import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductFeatures, getEcosystemFeatures, getHighlights, CATEGORY_FEATURE_MATRIX } from '../src/lib/product-specs.ts';

const camera = { category: 'security-camera', resolution: '1080p', fieldOfView: 130, nightVision: true, twoWayAudio: false, storage: 'MicroSD', subscriptionRequired: false };
const vacuum = { category: 'robot-vacuum', suctionPower: 2500, batteryRuntime: 180, hasMop: true, lidarMapping: true, obstacleDetection: true, noiseLevel: 65, wifi: true };
const speaker = { category: 'smart-speaker', wifi: true, bluetooth: true, alexaCompatible: true, googleHomeCompatible: false, appleHomeKit: false, matter: false };

test('security camera exposes resolution, night vision and storage but hides empty fields', () => {
  const features = getProductFeatures(camera);
  const labels = features.map((f) => f.label);
  assert.ok(labels.includes('Resolution'));
  assert.ok(labels.includes('Field of view'));
  assert.ok(labels.includes('Night vision'));
  assert.ok(labels.includes('Local storage'));
  assert.ok(!labels.includes('Field of view extras'));
  const fov = features.find((f) => f.label === 'Field of view');
  assert.equal(fov?.value, '130\u00b0');
  const sub = features.find((f) => f.label === 'Subscription required');
  assert.equal(sub?.value, 'No');
  assert.ok(labels.includes('Two-way audio'));
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
  assert.equal(runtime?.value, '180 min');
});

test('smart speaker never exposes nightVision, hasMop, or resolution', () => {
  const features = getProductFeatures(speaker);
  const labels = features.map((f) => f.label);
  assert.ok(!labels.includes('Night vision'));
  assert.ok(!labels.includes('Mopping support'));
  assert.ok(!labels.includes('Resolution'));
  assert.ok(labels.includes('Wi-Fi'));
  assert.ok(labels.includes('Bluetooth'));
  assert.ok(labels.includes('Alexa compatible'));
});

test('unknown category returns empty feature list', () => {
  assert.deepEqual(getProductFeatures({ category: 'nope' }), []);
  assert.deepEqual(getProductFeatures({}), []);
});

test('null/empty values never produce a feature entry', () => {
  const minimal = { category: 'security-camera', resolution: '', nightVision: false };
  const features = getProductFeatures(minimal);
  const labels = features.map((f) => f.label);
  assert.ok(!labels.includes('Resolution'));
  assert.ok(labels.includes('Night vision'));
  assert.equal(features.find((f) => f.label === 'Night vision')?.value, 'No');
});

test('getEcosystemFeatures shows Yes/No for booleans not absent rows', () => {
  const eco = getEcosystemFeatures(speaker);
  const alexa = eco.find((f) => f.label === 'Alexa compatible');
  assert.equal(alexa?.value, 'Yes');
  const google = eco.find((f) => f.label === 'Google Home compatible');
  assert.equal(google?.value, 'No');
});

test('getHighlights returns up to 6 values for a feature-rich product', () => {
  const highlights = getHighlights(vacuum);
  assert.ok(highlights.length <= 6);
  assert.ok(highlights.includes('180 min'));
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

