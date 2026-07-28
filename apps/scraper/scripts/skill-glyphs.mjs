// House glyphs for skills no brand mark can serve.
//
// Roughly two thirds of the lexicon is concepts, not products: "wound care",
// "stakeholder management", "seismic design". No icon library carries those,
// and a chip strip where half the entries have a mark and half do not reads as
// broken. So every skill without a brand gets a glyph for its family of work.
//
// Drawn in the existing house language (24x24, stroke, round caps, no fill) —
// the same vocabulary as the #i-* and #m-* symbols in lib/shell.js. Brand marks
// are filled silhouettes; these are stroked. That contrast is deliberate: a
// logo reads as "this exact product", a glyph reads as "this kind of work".
export const GLYPHS = {
  cube3d:    'M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6z M4 7.6 12 12l8-4.4 M12 12v8.8',
  blueprint: 'M4 4.5h16v15H4z M4 9.5h16 M9 9.5v10 M12.5 13h4.5 M12.5 16.5h4.5',
  structure: 'M3 18.5h18 M3 18.5 7 9l4 9.5 4-9.5 4 9.5 M7 9h8',
  interior:  'M6 11V7.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2V11 M4.5 11h15v5.5h-15z M6.5 16.5V19 M17.5 16.5V19',
  leaf:      'M20 4.5c0 8.5-5.5 12.5-11.5 12.5C8.5 10.5 13.5 5.5 20 4.5z M8.5 17c-1.5.8-2.8 2-3.5 3.5',
  mapzone:   'M4 7 9.5 4.5 15 7l5-2.5v12.5L15 19.5 9.5 17 4 19.5z M9.5 4.5V17 M15 7v12.5',
  pennib:    'M4.5 19.5 10 14 M20 4 10.5 7.2 7 10.7l6.3 6.3 3.5-3.5z M12 12.5l1.5 1.5',
  artboard:  'M7.5 4v16 M16.5 4v16 M4 7.5h16 M4 16.5h16',
  motion:    'M4.5 5.5h15v13h-15z M4.5 9.5h15 M8.5 5.5v4 M15.5 5.5v4 M10.5 12.5l4.5 2.5-4.5 2.5z',
  camera:    'M4 7.5h3.5L9 5.5h6l1.5 2H20v12H4z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  audio:     'M4 12v3 M8 8.5v10 M12 5v14 M16 9.5v8 M20 12.5v2',
  chart:     'M4 20V4 M4 20h16 M8 20v-6 M12.5 20v-9.5 M17 20v-4.5',
  database:  'M12 8.5c3.9 0 7-1.2 7-2.7S15.9 3 12 3 5 4.2 5 5.8s3.1 2.7 7 2.7z M5 5.8v12.4c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V5.8 M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8',
  cloud:     'M7.5 18.5h9.5a4 4 0 0 0 .6-8 6 6 0 0 0-11.4 1.6 3.4 3.4 0 0 0 1.3 6.4z',
  ai:        'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z M12 4v5.5 M12 14.5V20 M4.5 12H9.5 M14.5 12H19.5 M6.7 6.7l3 3 M14.3 14.3l3 3 M17.3 6.7l-3 3 M9.7 14.3l-3 3',
  code:      'M9 7.5 4 12l5 4.5 M15 7.5 20 12l-5 4.5 M13.5 5 10.5 19',
  coin:      'M12 3.5v17 M15.8 7.2H10a2.6 2.6 0 0 0 0 5.2h4a2.6 2.6 0 0 1 0 5.2H8',
  doc:       'M6.5 3.5h7L18 8v12.5H6.5z M13.5 3.5V8H18 M9.5 12.5h5 M9.5 16h5',
  scales:    'M12 4.5v15 M7 19.5h10 M5 8h14 M5 8 2.5 13.5h5z M19 8l-2.5 5.5h5z',
  people:    'M9 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8z M2.5 20.5a6.5 6.5 0 0 1 13 0 M16.5 8.2a2.9 2.9 0 0 1 0 5.8 M18 20.5a6.3 6.3 0 0 0-2.6-5',
  speech:    'M4 5h16v10.5H9.5L4 20z M8 8.5h8 M8 12h5',
  trend:     'M4 16.5 9.5 11l3.5 3 6.5-7.5 M20 6.5v5.5h-5.5',
  flow:      'M4 4.5h5.5v6H4z M14.5 4.5H20v6h-5.5z M4 13.5h5.5v6H4z M14.5 13.5H20v6h-5.5z M9.5 7.5h5 M6.75 10.5v3 M17.25 10.5v3',
  medcross:  'M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z',
  pulse:     'M3 12h4l2.5-6 4 12 2.5-6H21',
  wrench:    'M15.5 3.5a5 5 0 0 0-4.3 7.5L4 18.2l2.3 2.3 7.2-7.2a5 5 0 0 0 6.4-6.6L17 9.6l-2.6-2.6z',
  shield:    'M12 3.2l8 3v6.3c0 4.9-3.6 7.6-8 8.8-4.4-1.2-8-3.9-8-8.8V6.2z M9 12l2.2 2.2L15.5 10',
  cup:       'M5.5 7.5h11v5.5a5.5 5.5 0 0 1-11 0z M16.5 9h1.8a2.4 2.4 0 0 1 0 4.8h-1.8 M4 20.5h14',
  book:      'M5 4.5A1.8 1.8 0 0 1 6.8 3H19v15.5H6.8A1.8 1.8 0 0 0 5 20.3z M19 18.5H6.8',
  grid:      'M4 5h16v14H4z M4 10h16 M4 15h16 M10.5 5v14',
  search:    'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M16 16l4.5 4.5',
  globe:     'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M3.5 12h17 M12 3.5c2.2 2.3 3.4 5.3 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.2 8.6 12S9.8 5.8 12 3.5z',
  lock:      'M6 10.5h12v10H6z M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7 M12 14.5v2.5',
  plane:     'M2.5 13.5 21 5l-4.5 9.5-2 6-2.5-4.5-5-1z M12 16l4.5-7.5',
};

// Skill id -> glyph. Everything the brand tiers cannot reach lands here, so the
// strip is uniform. Grouped by family; a skill appears exactly once.
const BY_GLYPH = {
  cube3d: ['3d-modeling', 'rendering', 'vray', 'enscape', 'lumion', 'keyshot', 'zbrush', 'substance',
           'marvelous-designer', 'parametric-design', 'grasshopper', 'point-cloud', 'digital-twin'],
  blueprint: ['construction-documents', 'detailing', 'building-codes', 'spec-writing', 'iso-19650',
              'clash-detection', 'solibri', 'bluebeam', 'procore', 'chief-architect', 'blueprint-reading',
              'primavera', 'construction-administration', 'cost-estimating', 'cad-drafting'],
  structure: ['structural-analysis', 'steel-design', 'concrete-design', 'seismic-design', 'timber-design',
              'bridge-design', 'etabs', 'tekla', 'fea'],
  interior: ['ffe', 'space-planning', 'materials'],
  leaf: ['leed', 'sustainability', 'energy-modeling'],
  mapzone: ['gis', 'zoning', 'urban-design', 'transportation-planning', 'community-engagement', 'policy-analysis'],
  pennib: ['photoshop', 'illustrator-app', 'indesign', 'visual-design', 'illustration', 'typography', 'branding'],
  artboard: ['adobe-xd', 'prototyping', 'wireframing', 'design-systems', 'interaction-design', 'accessibility',
             'service-design', 'design-thinking', 'user-research', 'usability-testing'],
  motion: ['after-effects', 'premiere', 'motion-design', 'video-editing', 'touchdesigner'],
  camera: ['photography'],
  audio: ['ableton'],
  chart: ['data-visualization', 'statistics', 'ab-testing', 'data-modeling', 'data-analysis', 'tableau',
          'power-bi', 'forecasting'],
  search: ['research', 'market-research'],
  globe: ['translation'],
  lock: ['compliance', 'hipaa'],
  database: ['data-engineering', 'data-governance', 'dbt'],
  cloud: ['site-reliability', 'system-design', 'full-stack'],
  ai: ['llm', 'rag', 'fine-tuning', 'model-evaluation', 'prompt-engineering', 'nlp'],
  code: ['matlab', 'vba', 'cad-mechanical'],
  coin: ['budgeting', 'financial-modeling', 'accounting', 'tax', 'audit', 'bloomberg', 'factset', 'risk-management'],
  doc: ['contracts', 'clinical-documentation', 'technical-writing'],
  scales: ['westlaw', 'clio'],
  people: ['stakeholder-management', 'people-management', 'recruiting', 'hr-operations', 'training',
           'teaching', 'classroom-management', 'case-management', 'health-education', 'mental-health'],
  speech: ['presentation', 'negotiation', 'copywriting', 'content-marketing', 'writing', 'journalism'],
  trend: ['sales', 'account-management', 'business-development', 'go-to-market', 'demand-generation',
          'revenue-operations', 'product-marketing', 'saas', 'b2b', 'sales-enablement', 'seo'],
  flow: ['agile', 'project-management', 'program-management', 'change-management', 'operations',
         'lean-six-sigma', 'quality-control', 'scheduling', 'supply-chain', 'procurement', 'event-planning',
         'product-management'],
  medcross: ['patient-care', 'clinical', 'ehr', 'epic-ehr', 'medical-coding', 'clinical-research', 'triage',
             'telehealth', 'treatment-planning', 'medication-administration'],
  pulse: ['vital-signs', 'cpr-bls', 'infection-control', 'radiography', 'periodontal-care', 'local-anesthesia',
          'phlebotomy', 'iv-therapy', 'wound-care'],
  wrench: ['welding-fabrication', 'hand-power-tools', 'preventive-maintenance', 'hvac-systems',
           'electrical-systems', 'plc', 'gd-t', 'mastercam', 'mep'],
  shield: ['safety', 'public-safety', 'emergency-response', 'law-enforcement', 'criminal-investigation', 'firearms'],
  plane: ['aviation-ops'],
  cup: ['food-service', 'opera-pms', 'toast-pos'],
  book: ['curriculum', 'assessment', 'grant-writing'],
  grid: ['excel'],
};

export const SKILL_GLYPH = {};
for (const [glyph, ids] of Object.entries(BY_GLYPH)) {
  for (const id of ids) SKILL_GLYPH[id] = glyph;
}
