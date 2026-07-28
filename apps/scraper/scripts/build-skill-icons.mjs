#!/usr/bin/env node
// Skill marks for the job-detail skill strip, the graph's skill sheet, and the
// glossary. Every skill in the lexicon gets a mark — no bare chips.
//
// Three tiers, strongest first:
//   1. simple-icons (CC0)          — the product's own mark, where one exists
//   2. Font Awesome Free brands    — fills gaps simple-icons no longer carries
//      (CC BY 4.0)                   (AWS, Java, Salesforce, Microsoft…)
//   3. house glyphs                — scripts/skill-glyphs.mjs, for the ~180
//                                    concepts no logo exists for, plus brands
//                                    absent from both libraries (Adobe, Tableau,
//                                    MATLAB, and most of the AEC tool family)
//
// Brand marks are filled silhouettes; house glyphs are stroked. Emits
// apps/web/src/app/jobs/skill-icons.ts as {d, v, s} — path, viewBox, and a
// stroke flag — inlined server-side so the marks cost zero client JS and take
// their color from currentColor. Regenerate after lexicon changes:
//   node apps/scraper/scripts/build-skill-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as si from 'simple-icons';
import * as fa from '@fortawesome/free-brands-svg-icons';
import { GLYPHS, SKILL_GLYPH } from './skill-glyphs.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const SKILLS = path.join(REPO, 'packages/data/taxonomy/skills.json');
const OUT = path.join(REPO, 'apps/web/src/app/jobs/skill-icons.ts');
// Same map as JSON, for the client instrument's skill sheet (vanilla JS, no
// bundler import) and for build-skill-glossary.py to fold into its entries.
const OUT_JSON = path.join(REPO, 'apps/web/public/data/skill-marks.json');

// Tier 1. simple-icons key per skill, where the product has its own mark.
// null is never used here: a skill with no brand falls through to the glyph
// tier, which is what keeps the strip uniform.
const SI = {
  'rhino': 'siRhinoceros', 'revit': 'siAutodeskrevit', 'autocad': 'siAutocad', 'sketchup': 'siSketchup',
  'archicad': 'siArchicad', 'bim': 'siBim', 'twinmotion': 'siTwinmotion', 'arcgis': 'siArcgis',
  'vectorworks': 'siVectorworks', 'microstation': 'siMicrostation', 'plangrid': 'siPlangrid',
  'figma': 'siFigma', 'sketch-app': 'siSketch', 'blender': 'siBlender', 'cinema-4d': 'siCinema4d',
  'maya': 'siAutodeskmaya', 'houdini': 'siHoudini', 'nuke': 'siNuke', 'pro-tools': 'siProtools',
  'unity': 'siUnity', 'unreal': 'siUnrealengine', 'creative-coding': 'siP5dotjs',
  'python': 'siPython', 'javascript': 'siJavascript', 'typescript': 'siTypescript', 'react': 'siReact',
  'vue': 'siVuedotjs', 'angular': 'siAngular', 'nodejs': 'siNodedotjs', 'html-css': 'siHtml5',
  'cpp': 'siCplusplus', 'csharp': 'siSharp', 'go': 'siGo', 'rust': 'siRust', 'ruby': 'siRuby',
  'php': 'siPhp', 'swift': 'siSwift', 'scala': 'siScala', 'r-lang': 'siR',
  'sql': 'siPostgresql', 'nosql': 'siMongodb', 'spark': 'siApachespark', 'airflow': 'siApacheairflow',
  'pandas': 'siPandas', 'looker': 'siLooker', 'machine-learning': 'siScikitlearn',
  'deep-learning': 'siTensorflow', 'computer-vision': 'siOpencv', 'mlops': 'siMlflow',
  'langchain': 'siLangchain', 'huggingface': 'siHuggingface',
  'git': 'siGit', 'docker': 'siDocker', 'kubernetes': 'siKubernetes', 'terraform': 'siTerraform',
  'linux': 'siLinux', 'cicd': 'siGithubactions', 'gcp': 'siGooglecloud', 'rest-apis': 'siOpenapiinitiative',
  'microservices': 'siRabbitmq', 'observability': 'siDatadog', 'networking': 'siCisco',
  'cybersecurity': 'siOwasp', 'qa-testing': 'siSelenium', 'etl': 'siSnowflake',
  'sap': 'siSap', 'crm': 'siHubspot', 'jira': 'siJira', 'quickbooks': 'siQuickbooks', 'sage': 'siSage',
  'sem': 'siGoogleads', 'google-analytics': 'siGoogleanalytics', 'email-marketing': 'siMailchimp',
  'social-media': 'siInstagram', 'customer-service': 'siZendesk', 'semrush': 'siSemrush',
  'instructional-design': 'siMoodle', 'wordpress': 'siWordpress',
  // Autodesk/Siemens products with no mark of their own carry the vendor's.
  // Revit, AutoCAD, and Maya are above because they do have distinct marks.
  '3ds-max': 'siAutodesk', 'inventor': 'siAutodesk', 'civil-3d': 'siAutodesk',
  'navisworks': 'siAutodesk', 'dynamo': 'siAutodesk', 'siemens-nx': 'siSiemens',
};

// Tier 2. Brands simple-icons dropped at the owner's request. Products of a
// parent that has no mark of its own carry the parent's (Azure → Microsoft):
// it identifies the vendor honestly, which beats a bare chip.
const FA = {
  'aws': 'faAws', 'sagemaker': 'faAws', 'java': 'faJava', 'salesforce': 'faSalesforce',
  'azure': 'faMicrosoft',
};

const { skills } = JSON.parse(fs.readFileSync(SKILLS, 'utf8'));
const out = {};
const tally = { si: 0, fa: 0, glyph: 0 };
const bad = [];

for (const s of skills) {
  const siKey = SI[s.id];
  const faKey = FA[s.id];
  const glyph = SKILL_GLYPH[s.id];
  if (siKey && si[siKey]?.path) {
    out[s.id] = { d: si[siKey].path, v: '0 0 24 24' };
    tally.si++;
  } else if (faKey && fa[faKey]?.icon) {
    const [w, h, , , p] = fa[faKey].icon;
    out[s.id] = { d: Array.isArray(p) ? p.join(' ') : p, v: `0 0 ${w} ${h}` };
    tally.fa++;
  } else if (glyph && GLYPHS[glyph]) {
    out[s.id] = { d: GLYPHS[glyph], v: '0 0 24 24', s: 1 };
    tally.glyph++;
  } else {
    bad.push(s.id + (siKey ? ` (SI ${siKey} missing)` : faKey ? ` (FA ${faKey} missing)` : ' (no mapping)'));
  }
}

const ts = `// GENERATED by apps/scraper/scripts/build-skill-icons.mjs — do not edit.
// Brand marks: Simple Icons (CC0) and Font Awesome Free (CC BY 4.0); each mark
// remains its owner's trademark, used nominatively for identification. House
// glyphs (s:1, stroked) are ours, from scripts/skill-glyphs.mjs.
// d = path, v = viewBox, s = render stroked rather than filled.
export type SkillMark = { d: string; v: string; s?: number };
export const SKILL_ICON_PATHS: Record<string, SkillMark> = ${JSON.stringify(out)};
`;
fs.writeFileSync(OUT, ts);
fs.writeFileSync(OUT_JSON, JSON.stringify(out));

const covered = tally.si + tally.fa + tally.glyph;
console.log(`skill-icons: ${covered}/${skills.length} covered — ${tally.si} simple-icons, ${tally.fa} Font Awesome, ${tally.glyph} house glyphs`);
if (bad.length) {
  console.log(`UNCOVERED (${bad.length}) — these render as bare chips:`);
  bad.forEach((b) => console.log('  ' + b));
}
