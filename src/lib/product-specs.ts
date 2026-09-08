export type SpecCategory =
  | 'security-camera'
  | 'video-doorbell'
  | 'smart-lock'
  | 'smart-speaker'
  | 'smart-display'
  | 'smart-lighting'
  | 'smart-plug'
  | 'smart-thermostat'
  | 'robot-vacuum'
  | 'smart-hub'
  | 'motion-sensor'
  | 'air-purifier'
  | 'garage-door-opener'
  | 'smart-blinds';

import { getFeatureEvidenceLabel } from './product-feature-evidence.ts';

interface FeatureRow {
  label: string;
  sourceField: string;
  boolean?: true;
  formatter?: (value: any, product: any) => string;
}

const SECURITY_CAMERA_FEATURES: FeatureRow[] = [
  { label: 'Resolution', sourceField: 'resolution' },
  { label: 'Field of view', sourceField: 'fieldOfView', formatter: (v) => (v ? `${v}\u00b0` : '') },
  { label: 'Night vision', sourceField: 'nightVision', boolean: true },
  { label: 'Two-way audio', sourceField: 'twoWayAudio', boolean: true },
  { label: 'Local storage', sourceField: 'storage' },
];

const VIDEO_DOORBELL_FEATURES: FeatureRow[] = [
  { label: 'Resolution', sourceField: 'resolution' },
  { label: 'Field of view', sourceField: 'fieldOfView', formatter: (v) => (v ? `${v}\u00b0` : '') },
  { label: 'Night vision', sourceField: 'nightVision', boolean: true },
  { label: 'Two-way audio', sourceField: 'twoWayAudio', boolean: true },
  { label: 'Local storage', sourceField: 'storage' },
];

const SMART_LOCK_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Bluetooth', sourceField: 'bluetooth', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
  { label: 'Battery included', sourceField: 'batteryIncluded', boolean: true },
  { label: 'Battery life', sourceField: 'batteryLife' },
];

const SMART_SPEAKER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Bluetooth', sourceField: 'bluetooth', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
];

const SMART_DISPLAY_FEATURES: FeatureRow[] = [
  { label: 'Screen size', sourceField: 'screenSize' },
  { label: 'Screen resolution', sourceField: 'screenResolution' },
  { label: 'Speakers', sourceField: 'speakers' },
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
];

const SMART_LIGHTING_FEATURES: FeatureRow[] = [
  { label: 'Lumens', sourceField: 'lumens' },
  { label: 'Color temperature', sourceField: 'colorTemp' },
  { label: 'RGB color', sourceField: 'rgb', boolean: true },
  { label: 'Dimmable', sourceField: 'dimmable', boolean: true },
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
];

const SMART_PLUG_FEATURES: FeatureRow[] = [
  { label: 'Amperage', sourceField: 'amperage' },
  { label: 'Energy monitoring', sourceField: 'energyMonitoring', boolean: true },
  { label: 'Surge protection', sourceField: 'surgeProtection', boolean: true },
  { label: 'USB ports', sourceField: 'usbPorts' },
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
];

const SMART_THERMOSTAT_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
  { label: 'Energy monitoring', sourceField: 'energyMonitoring', boolean: true },
  { label: 'Power (W)', sourceField: 'powerWatts' },
];

const ROBOT_VACUUM_FEATURES: FeatureRow[] = [
  { label: 'Suction power', sourceField: 'suctionPower' },
  { label: 'Battery runtime', sourceField: 'batteryRuntime', formatter: (v) => (v ? `${v} min` : '') },
  { label: 'Dust capacity', sourceField: 'dustCapacity' },
  { label: 'Mopping support', sourceField: 'hasMop', boolean: true },
  { label: 'LiDAR mapping', sourceField: 'lidarMapping', boolean: true },
  { label: 'Obstacle detection', sourceField: 'obstacleDetection', boolean: true },
  { label: 'Noise level', sourceField: 'noiseLevel', formatter: (v) => (v ? `${v} dB` : '') },
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
];

const SMART_HUB_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Bluetooth', sourceField: 'bluetooth', boolean: true },
  { label: 'Zigbee', sourceField: 'zigbee', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
];

const MOTION_SENSOR_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Zigbee', sourceField: 'zigbee', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Battery life', sourceField: 'batteryLife' },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
];

const AIR_PURIFIER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
  { label: 'Power (W)', sourceField: 'powerWatts' },
];

const GARAGE_DOOR_OPENER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
];

const SMART_BLINDS_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', boolean: true },
  { label: 'Bluetooth', sourceField: 'bluetooth', boolean: true },
  { label: 'Matter', sourceField: 'matter', boolean: true },
  { label: 'Alexa', sourceField: 'alexaCompatible', boolean: true },
  { label: 'Google Home', sourceField: 'googleHomeCompatible', boolean: true },
  { label: 'Apple HomeKit', sourceField: 'appleHomeKit', boolean: true },
  { label: 'Battery life', sourceField: 'batteryLife' },
];

export const CATEGORY_FEATURE_MATRIX: Record<SpecCategory, FeatureRow[]> = {
  'security-camera': SECURITY_CAMERA_FEATURES,
  'video-doorbell': VIDEO_DOORBELL_FEATURES,
  'smart-lock': SMART_LOCK_FEATURES,
  'smart-speaker': SMART_SPEAKER_FEATURES,
  'smart-display': SMART_DISPLAY_FEATURES,
  'smart-lighting': SMART_LIGHTING_FEATURES,
  'smart-plug': SMART_PLUG_FEATURES,
  'smart-thermostat': SMART_THERMOSTAT_FEATURES,
  'robot-vacuum': ROBOT_VACUUM_FEATURES,
  'smart-hub': SMART_HUB_FEATURES,
  'motion-sensor': MOTION_SENSOR_FEATURES,
  'air-purifier': AIR_PURIFIER_FEATURES,
  'garage-door-opener': GARAGE_DOOR_OPENER_FEATURES,
  'smart-blinds': SMART_BLINDS_FEATURES,
};

export interface ProductFeature {
  label: string;
  value: string;
  sourceField: string;
}

export function getProductFeatures(product: any): ProductFeature[] {
  const rows = CATEGORY_FEATURE_MATRIX[(product.category as SpecCategory) ?? ''] ?? [];
  return rows
    .map((row) => {
      const raw = product[row.sourceField];
      let value = '';
      if (row.boolean) {
        value = getFeatureEvidenceLabel(product, row.sourceField);
      } else if ((typeof raw === 'string' && raw.trim() !== '') || (typeof raw === 'number' && Number.isFinite(raw))) {
        const formatted = row.formatter ? row.formatter(raw, product) : String(raw);
        // General product sources do not establish field-specific verification.
        value = formatted ? `Catalog: ${formatted} (unverified)` : '';
      }
      if (!value) return null;
      return { label: row.label, value, sourceField: row.sourceField };
    })
    .filter((item): item is ProductFeature => Boolean(item && item.value));
}

export function getEcosystemFeatures(product: any): ProductFeature[] {
  const rows = [
    { label: 'Wi-Fi', sourceField: 'wifi' },
    { label: 'Bluetooth', sourceField: 'bluetooth' },
    { label: 'Zigbee', sourceField: 'zigbee' },
    { label: 'Matter', sourceField: 'matter' },
    { label: 'Alexa', sourceField: 'alexaCompatible' },
    { label: 'Google Home', sourceField: 'googleHomeCompatible' },
    { label: 'Apple HomeKit', sourceField: 'appleHomeKit' },
    { label: 'Thread role / integration', sourceField: 'thread' },
    { label: 'SmartThings role / integration', sourceField: 'smartthingsIntegration' },
  ];
  return rows.map((row) => ({ label: row.label, sourceField: row.sourceField, value: getFeatureEvidenceLabel(product, row.sourceField) }));
}

export function getHighlights(product: any): string[] {
  const features = getProductFeatures(product);
  return features.slice(0, 6).map((f) => f.value);
}
