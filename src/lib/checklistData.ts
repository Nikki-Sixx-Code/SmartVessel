export type Tier = {
  level: number;
  title: string;
  subtitle: string;
  accent: string; // tailwind color name
  items: { key: string; label: string }[];
};

export const TIERS: Tier[] = [
  {
    level: 1,
    title: 'Security & High-Risk Zones',
    subtitle: 'Piracy / BMP5 Protocols',
    accent: 'red',
    items: [
      { key: 'sec-1', label: 'BMP5 Anti-Piracy Plan reviewed & signed' },
      { key: 'sec-2', label: 'Citadel prepared & accessible' },
      { key: 'sec-3', label: 'Bridge watch anti-piracy scan complete' },
      { key: 'sec-4', label: 'Water spray / fire monitors tested' },
    ],
  },
  {
    level: 2,
    title: 'MARPOL Special Area Checklists',
    subtitle: 'Mediterranean Sea — Annex I, V, VI',
    accent: 'green',
    items: [
      { key: 'marpol-1', label: 'Bilge water 0 ppm discharge verified' },
      { key: 'marpol-2', label: 'Food waste no-discharge within 12 NM confirmed' },
      { key: 'marpol-3', label: 'Fuel sulphur content ≤ 0.10% logged' },
      { key: 'marpol-4', label: 'Garbage Record Book Part I updated' },
    ],
  },
  {
    level: 3,
    title: 'Port Specific — US Coast Guard',
    subtitle: 'Pre-Arrival Requirements (33 CFR 160)',
    accent: 'purple',
    items: [
      { key: 'port-1', label: 'NOA submitted 96h prior arrival' },
      { key: 'port-2', label: 'ISPS Code security level declared' },
      { key: 'port-3', label: 'Crew list & passports verified' },
      { key: 'port-4', label: 'Ballast water management report filed' },
    ],
  },
  {
    level: 4,
    title: 'Routine SMS Operations',
    subtitle: 'Daily Engine Check, Bridge Inspection',
    accent: 'blue',
    items: [
      { key: 'sms-1', label: 'Daily engine room round completed' },
      { key: 'sms-2', label: 'Bridge navigation equipment tested' },
      { key: 'sms-3', label: 'Lifeboat weekly inspection logged' },
      { key: 'sms-4', label: 'Fire detection system daily check' },
    ],
  },
];

export const ENGINE_ROOM_ITEMS = [
  {
    key: 'ows-valve',
    question: 'Oily Water Separator (OWS) overboard valve sealed & locked?',
  },
  {
    key: 'bilge-level',
    question: 'Main Engine Bilge level normal?',
  },
  {
    key: 'gen-fuel-pressure',
    question: 'Auxiliary Generator #1 fuel pressure within limits?',
  },
  {
    key: 'fire-pump',
    question: 'Emergency Fire Pump tested and operational?',
  },
];

export type OfficialChecklist = {
  id: string;
  title: string;
  authority: string;
  reference: string;
  accent: string;
  items: { key: string; question: string }[];
};

export const OFFICIAL_CHECKLISTS: OfficialChecklist[] = [
  {
    id: 'uscg-pre-arrival',
    title: 'USCG Foreign Vessel Pre-Arrival',
    authority: 'US Coast Guard',
    reference: '33 CFR 160 — Port State Control',
    accent: 'blue',
    items: [
      { key: 'uscg-1', question: 'Oily Water Separator (OWS) 15ppm alarm and automatic stopping device tested and operational?' },
      { key: 'uscg-2', question: 'Ballast Water Management Record Book updated and USCG Report submitted?' },
      { key: 'uscg-3', question: 'ECDIS primary and back-up systems updated with latest Notice to Mariners?' },
      { key: 'uscg-4', question: 'Quick Closing Valves for Engine Room fuel tanks tested and free in operation?' },
      { key: 'uscg-5', question: 'Fixed Fire Fighting System (CO2 / Local Water Mist) inspected and ready?' },
    ],
  },
  {
    id: 'paris-mou-psc',
    title: 'Paris MOU Port State Control',
    authority: 'Paris MOU',
    reference: 'PSC Initial Inspection Standard',
    accent: 'amber',
    items: [
      { key: 'pmou-1', question: 'Emergency Generator tested on load and automatic start operational?' },
      { key: 'pmou-2', question: 'Lifeboat engine started, forward/astern propulsion and steering verified?' },
      { key: 'pmou-3', question: 'Emergency Fire Pump tested and delivering required pressure to hydrants?' },
      { key: 'pmou-4', question: 'Garbage Record Book updated and Annex V discharge limits verified?' },
      { key: 'pmou-5', question: 'Fire dampers and engine room skylights operational and sealing tightly?' },
    ],
  },
  {
    id: 'ics-bridge-arrival',
    title: 'ICS Bridge Procedures — Arrival in Port',
    authority: 'International Chamber of Shipping',
    reference: 'Standard Navigation Procedures',
    accent: 'emerald',
    items: [
      { key: 'ics-1', question: 'Passage Plan for port approach completed, checked, and approved by Master?' },
      { key: 'ics-2', question: 'Main Engine tested astern and ahead prior to entering pilotage waters?' },
      { key: 'ics-3', question: 'Steering Gear tested (primary & emergency) and dual pumps operational?' },
      { key: 'ics-4', question: 'VHF channels set to Port Operations / VTS and Pilot station contacted?' },
      { key: 'ics-5', question: 'Anchors cleared and ready for letting go if required?' },
    ],
  },
];
