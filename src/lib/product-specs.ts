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

interface FeatureRow {
  label: string;
  sourceField: string;
  truthyLabel?: string;
  falsyLabel?: string;
  formatter?: (value: any, product: any) => string;
}

const SECURITY_CAMERA_FEATURES: FeatureRow[] = [
  { label: 'Resolution', sourceField: 'resolution' },
  { label: 'Field of view', sourceField: 'fieldOfView', formatter: (v) => (v ? `${v}\u00b0` : '') },
  { label: 'Night vision', sourceField: 'nightVision', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Two-way audio', sourceField: 'twoWayAudio', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Local storage', sourceField: 'storage' },
  { label: 'Subscription required', sourceField: 'subscriptionRequired', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const VIDEO_DOORBELL_FEATURES: FeatureRow[] = [
  { label: 'Resolution', sourceField: 'resolution' },
  { label: 'Field of view', sourceField: 'fieldOfView', formatter: (v) => (v ? `${v}\u00b0` : '') },
  { label: 'Night vision', sourceField: 'nightVision', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Two-way audio', sourceField: 'twoWayAudio', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Local storage', sourceField: 'storage' },
  { label: 'Subscription required', sourceField: 'subscriptionRequired', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_LOCK_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Bluetooth', sourceField: 'bluetooth', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Battery included', sourceField: 'batteryIncluded', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Battery life', sourceField: 'batteryLife' },
];

const SMART_SPEAKER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Bluetooth', sourceField: 'bluetooth', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_DISPLAY_FEATURES: FeatureRow[] = [
  { label: 'Screen size', sourceField: 'screenSize' },
  { label: 'Screen resolution', sourceField: 'screenResolution' },
  { label: 'Speakers', sourceField: 'speakers' },
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_LIGHTING_FEATURES: FeatureRow[] = [
  { label: 'Lumens', sourceField: 'lumens' },
  { label: 'Color temperature', sourceField: 'colorTemp' },
  { label: 'RGB color', sourceField: 'rgb', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Dimmable', sourceField: 'dimmable', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_PLUG_FEATURES: FeatureRow[] = [
  { label: 'Amperage', sourceField: 'amperage' },
  { label: 'Energy monitoring', sourceField: 'energyMonitoring', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Surge protection', sourceField: 'surgeProtection', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'USB ports', sourceField: 'usbPorts' },
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_THERMOSTAT_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Energy monitoring', sourceField: 'energyMonitoring', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Power (W)', sourceField: 'powerWatts' },
];

const ROBOT_VACUUM_FEATURES: FeatureRow[] = [
  { label: 'Suction power', sourceField: 'suctionPower' },
  { label: 'Battery runtime', sourceField: 'batteryRuntime', formatter: (v) => (v ? `${v} min` : '') },
  { label: 'Dust capacity', sourceField: 'dustCapacity' },
  { label: 'Mopping support', sourceField: 'hasMop', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'LiDAR mapping', sourceField: 'lidarMapping', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Obstacle detection', sourceField: 'obstacleDetection', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Noise level', sourceField: 'noiseLevel', formatter: (v) => (v ? `${v} dB` : '') },
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_HUB_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Bluetooth', sourceField: 'bluetooth', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Zigbee', sourceField: 'zigbee', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const MOTION_SENSOR_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Zigbee', sourceField: 'zigbee', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Battery life', sourceField: 'batteryLife' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const AIR_PURIFIER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Power (W)', sourceField: 'powerWatts' },
];

const GARAGE_DOOR_OPENER_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
];

const SMART_BLINDS_FEATURES: FeatureRow[] = [
  { label: 'Wi-Fi', sourceField: 'wifi', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Bluetooth', sourceField: 'bluetooth', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Matter ready', sourceField: 'matter', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Alexa compatible', sourceField: 'alexaCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Google Home compatible', sourceField: 'googleHomeCompatible', truthyLabel: 'Yes', falsyLabel: 'No' },
  { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit', truthyLabel: 'Yes', falsyLabel: 'No' },
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
}

export function getProductFeatures(product: any): ProductFeature[] {
  const rows = CATEGORY_FEATURE_MATRIX[(product.category as SpecCategory) ?? ''] ?? [];
  return rows
    .map((row) => {
      const raw = product[row.sourceField];
      let value = '';
      if (typeof raw === 'boolean') {
        value = raw ? (row.truthyLabel ?? 'Yes') : (row.falsyLabel ?? 'No');
      } else if (raw != null && raw !== '') {
        value = row.formatter ? row.formatter(raw, product) : String(raw);
      } else if (raw != null && row.formatter) {
        value = row.formatter(raw, product);
      }
      if (!value) return null;
      return { label: row.label, value };
    })
    .filter((item): item is ProductFeature => Boolean(item && item.value));
}

export function getEcosystemFeatures(product: any): ProductFeature[] {
  const rows = [
    { label: 'Wi-Fi', sourceField: 'wifi' },
    { label: 'Bluetooth', sourceField: 'bluetooth' },
    { label: 'Zigbee', sourceField: 'zigbee' },
    { label: 'Matter ready', sourceField: 'matter' },
    { label: 'Alexa compatible', sourceField: 'alexaCompatible' },
    { label: 'Google Home compatible', sourceField: 'googleHomeCompatible' },
    { label: 'Apple HomeKit compatible', sourceField: 'appleHomeKit' },
  ];
  return rows
    .map((row) => {
      const raw = product[row.sourceField];
      if (typeof raw === 'boolean') {
        return { label: row.label, value: raw ? 'Yes' : 'No' };
      }
      if (raw != null && raw !== '') return { label: row.label, value: String(raw) };
      return null;
    })
    .filter((item): item is ProductFeature => Boolean(item));
}

export function getHighlights(product: any): string[] {
  const features = getProductFeatures(product);
  return features.slice(0, 6).map((f) => f.value);
}
