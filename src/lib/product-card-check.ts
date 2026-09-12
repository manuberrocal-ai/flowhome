import { getInstallationEvidence, getInstallationSummary } from './product-installation.ts';

interface CardCheckProduct {
  slug?: unknown;
  model?: unknown;
  installation?: unknown;
}

interface ReviewedCheck {
  model: string;
  text: string;
  requirements: readonly string[];
}

/**
 * Reviewed against all 28 catalog models on 2026-09-12. These exceptions keep
 * consequential conditions that the first requirement/summary alone omits.
 * Text is an explicitly reviewed editorial paraphrase for a buying decision,
 * not an installation guide. Whole existing requirements guard its validity;
 * no character truncation or category-based safety estimate is used.
 * Effort never determines warning visibility.
 * A content change invalidates the selection and uses the current full fallback.
 */
const reviewedChecks: Record<string, ReviewedCheck> = {
  'aeotec-smartthings-hub': {
    model: 'GP-AEOHUBV3US',
    text: 'Confirm US model GP-AEOHUBV3US: regional Z-Wave radios differ. Initial setup needs power, broadband internet, SmartThings and a Samsung account; Ethernet is recommended. Setup does not verify every accessory or establish cloud-free operation.',
    requirements: [
      'For initial hub setup, use the supplied power adapter and a broadband internet connection. Aeotec recommends Ethernet for initial setup; wireless connection uses 2.4 GHz Wi-Fi with WPA2. Place the hub centrally, away from large metal objects, and check the connection at its final location.',
      'Use the SmartThings app and a Samsung account to register the hub with its QR code or serial number. Allow registration and firmware updates to finish. This assessment covers powering and registering the hub, not migrating an existing home or pairing and validating every accessory and routine.',
      'Confirm the US model GP-AEOHUBV3US before buying; regional Z-Wave radios differ. These requirements do not cover Smart Home Hub 2. The unit, firmware and individual device integrations have not been physically verified, and successful setup does not establish cloud-free operation.',
    ],
  },
  'aqara-motion-sensor-p1': {
    model: 'MS-S02',
    text: 'Requires an Aqara Zigbee 3.0 hub. Keep its CR2450 button batteries away from children; stop using it if the battery compartment will not close securely. This documentary assessment is not a security-system test or pairing guarantee.',
    requirements: [
      'Have an Aqara Zigbee 3.0 hub and Aqara Home app ready. Remove the battery insulating tab, add Motion Sensor P1 in the app and confirm communication with the hub before fixing the sensor in position.',
      'Follow the MS-S02 manual for its two CR2450 button batteries; keep new and used batteries away from children and stop using a compartment that will not close securely. This is a documentary setup assessment, not a tested security system or a guarantee of ecosystem pairing.',
    ],
  },
  'blink-outdoor-4': {
    model: 'Blink Outdoor 4',
    text: "Needs a Sync Module; check the bundle. Standard battery power uses non-rechargeable AA lithium batteries. Keep the port cover closed unless using Blink's weather-resistant USB-C adapter; an ordinary exposed connection is not equivalent.",
    requirements: [
      'Requires a Blink Sync Module, home Wi-Fi and setup in the Blink app. Check whether the exact camera bundle includes the module or whether you need one separately.',
      "The standard battery option uses two AA 1.5 V non-rechargeable lithium batteries. Choose a mounting position and follow Blink's installation instructions.",
      "Keep the port cover closed for weather resistance unless using Blink's weather-resistant USB-C power adapter; an ordinary uncovered connection is not equivalent.",
    ],
  },
  'ecobee-smart-thermostat-premium': {
    model: 'ecobee Smart Thermostat Premium',
    text: 'Check compatible 24 VAC HVAC wiring before buying. Power needs a C-wire or compatible Power Extender Kit installation; confirm the wiring and installation needs with ecobee or an HVAC professional.',
    requirements: [
      "Requires compatible 24 VAC HVAC wiring; check your system with ecobee's compatibility checker before purchase.",
      'Power uses a C-wire or a compatible Power Extender Kit installation. Check wiring and installation needs with the manufacturer or an HVAC professional.',
    ],
  },
  'govee-rgbic-led-strip-lights': {
    model: 'H617C',
    text: 'H617C is a fixed 10 m strip: do not cut or splice it. Use its matching 24 V adapter/controller. Control is Bluetooth through Govee Home, not direct Wi-Fi or Alexa; confirm the exact package.',
    requirements: [
      "Plan space for the full 10 m (32.8 ft) H617C strip before mounting. Govee's model matrix marks this strip as not cuttable. Do not apply generic strip-cutting or splicing instructions to this model.",
      'Use the matching supplied power adapter and controller; Govee specifies 24 V / 0.75 A for H617C. Its documented control path is Bluetooth with the Govee Home app, not direct Wi-Fi or Alexa. Confirm the exact H617C1D1 package and power hardware before buying.',
    ],
  },
  'levoit-core-300s-air-purifier': {
    model: 'Levoit Core 300S Smart Air Purifier',
    text: 'Plan an indoor location with 15 inches of clearance on every side, away from water and heat. The US unit uses 120 V, 60 Hz. Remove filter packaging before use and unplug for filter servicing.',
    requirements: [
      "Before first use, remove the filter's plastic packaging, refit the filter handle-up and lock the cover. Keep the unit unplugged when servicing the filter; follow the Core 300S manual.",
      'Use indoors on a flat, stable surface with at least 15 inches / 38 cm of clearance on all sides and unobstructed airflow. The documented US unit uses 120 V, 60 Hz; keep it away from water and heat.',
    ],
  },
  'meross-smart-garage-door-opener': {
    model: 'MSG100',
    text: "Check your motor's exact model and required accessories; MSG100 is an add-on, not a replacement motor. Do not bridge unidentified terminals: consult Meross or a qualified installer. Wired sensor installation is required, and this assessment does not establish safe unattended operation.",
    requirements: [
      "This is an add-on controller for an existing garage-door motor, not a replacement motor. Check the motor's exact brand and model in Meross's compatibility checker before buying; some installations require an additional accessory. Do not assume every motor from a listed brand is compatible.",
      "Installation includes control-terminal connections and mounting a wired door-position sensor. If you cannot identify the wall-button terminals confidently, do not attempt a terminal-bridging test; consult Meross support or a qualified installer. Check the motor's own safety instructions before installation.",
      "Plan power and sensor-cable routing and check 2.4 GHz Wi-Fi coverage at the motor. The listing identifies MSG100 and advertises HomeKit, but FlowHome has not inspected the hardware suffix or supplied accessories. Confirm the exact regional kit and app instructions; this assessment does not establish safe unattended operation.",
    ],
  },
  'ring-video-doorbell-wired': {
    model: 'Ring Video Doorbell Wired',
    text: 'Original Wired: verify the specified 10–24 VAC transformer or compatible Ring adapter, not arbitrary DC power. Hardwiring requires breaker isolation and disables the existing chime. Use a licensed electrician if inexperienced or unsure, and follow local requirements.',
    requirements: [
      "Original Video Doorbell Wired: check the transformer and exact regional manual before buying. Ring's US hardwiring guidance specifies 10-24 VAC, 50/60 Hz, 8-40 VA. A compatible Ring Plug-In Adapter is an alternative sold separately; do not assume an arbitrary DC supply is suitable.",
      'For hardwiring, disconnect power at the breaker before touching wires. Use a licensed electrician if inexperienced or unsure; local requirements may also require professional installation. With an existing in-home chime, the required jumper bypasses and disables that chime.',
    ],
  },
  'roborock-q5-plus': {
    model: 'Roborock Q5+ Robot Vacuum',
    text: 'Allow room for the original Q5+ dock and assemble its base before connecting power. Supervise the first cleaning route; raised areas require a secure physical barrier. Mapping does not replace that barrier.',
    requirements: [
      'Original Q5+ dock: attach the base with the six supplied screws before connecting power. Use a hard, level floor with at least 1.6 ft / 0.5 m clear on each side, 4.9 ft / 1.5 m in front and 3.3 ft / 1 m above.',
      'Clear loose cables and fragile or unstable items, supervise the entire first cleaning route, and use a secure physical barrier in raised areas. Mapping is not a substitute for that barrier.',
    ],
  },
  'tapo-c120-security-camera': {
    model: 'Tapo C120',
    text: 'This is not a battery camera: plan cable routing and use the supplied power hardware. The US guide requires the adapter to stay indoors even when the camera is outdoors. Setup uses Tapo and 2.4 GHz Wi-Fi.',
    requirements: [
      'Set up with the Tapo app and 2.4 GHz Wi-Fi, using the manufacturer-supplied power adapter and cable. This camera is not battery-powered.',
      'Plan the camera position and power-cable route. A table or shelf needs no wall mounting; magnetic, adhesive and screw mounting are other options. Follow the manual for your hardware version.',
      'The linked US setup guide specifies indoor use for the power adapter, even when the camera is outdoors. Check the exact installation instructions before choosing its location.',
    ],
  },
  'tp-link-kasa-smart-dimmer-hs220': {
    model: 'HS220',
    text: 'An in-wall dimmer, not a plug-in device: installation requires electrical wiring and a neutral wire. Check the bulb dimming type and manufacturer load limits before buying.',
    requirements: [
      'This in-wall dimmer requires electrical wiring and a neutral wire; it is not a plug-in device.',
      "Check the bulb's dimming type and the manufacturer's load limits before installation.",
    ],
  },
  'tp-link-kasa-smart-light-switch-hs200': {
    model: 'HS200',
    text: 'An in-wall switch, not a plug-in device: installation requires electrical wiring and a neutral wire. Check manufacturer wiring and load requirements with a qualified installer if needed.',
    requirements: [
      'This in-wall switch requires electrical wiring and a neutral wire; it is not a plug-in device.',
      "Check the manufacturer's wiring and load requirements with a qualified installer if needed.",
    ],
  },
  'tp-link-kasa-smart-plug-mini': {
    model: 'EP10 (EP10P2 two-pack)',
    text: 'EP10 US needs an indoor 100–120 V AC outlet, away from water, humidity and heat; do not stack adapters. Check appliance-specific load limits: the 15 A / 1800 W general/resistive rating is not a universal appliance limit.',
    requirements: [
      "For the documented EP10 US, use an accessible indoor outlet, away from water, humidity and heat. Do not stack plug adapters. Check the hardware label against the regional manual; the retail bundle's revision and firmware are not verified.",
      "The EP10 US datasheet specifies 100-120 V AC, up to 15 A and 1800 W for general/resistive loads. Those are not universal appliance limits: check the manual's load-specific restrictions and the appliance instructions before connecting it.",
    ],
  },
  'wyze-bulb-color': {
    model: 'Wyze Bulb Color',
    text: 'Needs an E26 fixture and 120 V, 60 Hz supply; turn power off before fitting. Do not use external dimmers, enclosed or poorly ventilated fixtures, emergency lighting or direct water exposure. App dimming does not make a wall dimmer compatible.',
    requirements: [
      'The documented WLPA19C uses an E26 base and 120 V, 60 Hz supply. Turn power off before fitting or removing the bulb and follow the instructions for your fixture.',
      'Do not use an external dimmer, a fully enclosed or poorly ventilated fixture, emergency lighting, or a location exposed directly to water. App dimming does not establish compatibility with a wall or lamp dimmer.',
    ],
  },
  'yale-assure-lock-2-wifi': {
    model: 'YRD420-WF1-619',
    text: 'Requires a compatible prepared door and replaces the deadbolt. Flush DoorSense mounting needs drilling. Use the correct Wi-Fi module and remove batteries before changing it; verify door fit and the exact keyed YRD420 kit.',
    requirements: [
      'This keyed YRD420 replaces the deadbolt, rather than retaining the existing exterior lock. Yale specifies 1-3/8 to 2-1/4 inch door thickness, 2-3/8 or 2-3/4 inch backset, and a 2-1/8 or 1-1/2 inch face bore. Verify the door and required adapter before buying.',
      'The guided-setup assessment assumes a prepared, compatible door and surface-mounted DoorSense. Flush mounting the sensor requires drilling; door or frame alterations need a separate assessment. Confirm smooth bolt movement and follow the manual\'s mounting checks.',
      'Use four AA batteries and the correct Wi-Fi module; remove batteries before inserting or removing a Yale Smart Module. Follow the Yale app setup, calibrate DoorSense and check open/closed readings. This is the standard keyed Assure Lock 2, not Touch, Plus or a key-free variant; the seller\'s hardware has not been inspected.',
    ],
  },
  'echo-show-8-3rd-gen': {
    model: 'Echo Show 8 3rd Gen',
    text: 'Check third-generation model R85SD6 and its included adapter. Choose a heat-resistant surface away from sinks, steam and heat. Setup requires an Amazon account and internet-connected Wi-Fi; review household camera and microphone settings. The shutter does not establish cloud-free operation.',
    requirements: [
      "Use the included power adapter in an accessible outlet and place the display on a heat-resistant surface away from sinks, steam and heat sources. Amazon's US safety guide identifies third-generation model R85SD6; confirm the unit and included adapter before buying.",
      'Have an Amazon account and your internet-connected Wi-Fi network name and password ready. Complete language, network and account setup on the display. This assessment covers initial display setup, not mounting accessories or configuring every connected smart-home device.',
      'Review the microphone/camera controls, built-in camera shutter and voice-history settings with the household. The shutter does not establish cloud-free operation. Check any optional service and subscription terms separately; hardware, firmware and individual device pairings have not been physically verified.',
    ],
  },
  'irobot-roomba-j7-plus': {
    model: 'iRobot Roomba j7+',
    text: 'Allow clearance around the original j7+ Clean Base and keep it at least 4 ft from stairs. Remove floor clutter even with obstacle avoidance. Confirm the original j7+ bundle, not a Combo model.',
    requirements: [
      'For the original j7+ Clean Base, allow 1.5 ft / 0.5 m on both sides, 4 ft / 1.2 m in front and 1 ft / 0.3 m above. Keep the base at least 4 ft / 1.2 m from stairs, out of direct sunlight and within good Wi-Fi coverage.',
      'Place the robot on the powered base to activate its battery. iRobot recommends a 3-hour charge before the first cleaning job; remove excess floor clutter even with obstacle avoidance.',
      'Follow the iRobot Home app for Wi-Fi setup, maps and schedules. These instructions cover the original j7+ with Clean Base, not a Roomba Combo model; confirm the exact bundle before buying.',
    ],
  },
  'schlage-encode-smart-wifi-deadbolt': {
    model: 'BE489WB CEN 622',
    text: 'Encode BE489 replaces the deadbolt rather than retaining it. Check door dimensions and bolt alignment; this assessment assumes a prepared, compatible door. Alterations need a separate assessment. Ask a locksmith if unsure, and confirm any thick-door kit.',
    requirements: [
      'Encode BE489 replaces the deadbolt; it does not retain the existing exterior lock like a retrofit accessory. Standard fit is a 1-3/8 to 1-3/4 inch thick door with a 2-3/8 or 2-3/4 inch backset (door edge to hole center). Measure before buying.',
      "This guided-setup assessment assumes a compatible, already-prepared door. Check the manufacturer's door-preparation guide and bolt alignment; door or frame alterations need a separate assessment. Ask a locksmith if unsure, and confirm any thick-door kit with Schlage rather than assuming it is included.",
    ],
  },
  'switchbot-blind-tilt': {
    model: 'SwitchBot Blind Tilt',
    text: 'Check horizontal blinds and the supported wand diameter; vertical blinds and roller shades are not supported. Remote control and linked assistants need a separate compatible hub. Solar charging depends on placement; confirm the exact accessories.',
    requirements: [
      "Check the existing blind before fitting the device: support specifies horizontal blinds with a wand diameter of 6.2-10.2 mm or 12 mm, not vertical blinds or roller shades. Follow the manufacturer's fitting and calibration guides for your hardware.",
      'The unit has a rechargeable battery and USB-C power rated at 5 V, 1 A. Solar charging depends on the installation conditions; verify the exact seller package and accessories rather than assuming a bundle.',
      'Use the SwitchBot app for nearby control. Remote control and linked assistants require a separate compatible hub; this is not a direct Wi-Fi device. See the compatibility notes for Matter bridge and controller conditions.',
    ],
  },
};

/** One visible check, not a full installation guide or a compatibility guarantee. */
export function getProductCardCheck(product: CardCheckProduct, now = new Date()): string | null {
  const evidence = getInstallationEvidence(product, now);
  if (!evidence) return null;
  const fallback = getInstallationSummary(evidence);
  if (typeof product.slug !== 'string' || !Object.hasOwn(reviewedChecks, product.slug)) return fallback;
  const selection = reviewedChecks[product.slug];
  if (selection.model !== product.model || !selection.requirements.every(check => evidence.requirements.includes(check))) return fallback;
  return selection.text;
}
