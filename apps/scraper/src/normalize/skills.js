import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// Skill extraction: match description text against the dictionary with hard word
// boundaries. Custom lookarounds so "c#", "c++", ".net", "r" don't false-positive.
//
// Two precision layers on top of the gazetteer (the dental-hygienist lesson —
// "EMS AirFlow" the polishing device is not Apache Airflow, and a clinic being
// in a "LEED 2 certified building" is not a skill requirement):
//   - unless_near: a per-skill veto regex checked in a ±window around the match.
//   - zoneText:    heading-aware zoning that drops benefits / about-us / EEO /
//                  how-to-apply blocks before extraction, so company-blurb
//                  vocabulary never reads as a requirement.

let compiled = null;

function escapeAlias(a) {
  return a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function getSkills() {
  if (compiled) return compiled;
  const { skills } = readJson(path.join(TAXONOMY_DIR, 'skills.json'));
  compiled = skills.map((s) => ({
    id: s.id,
    name: s.name,
    re: new RegExp(
      s.aliases.map((a) => `(?<![a-z0-9+#.])${escapeAlias(a.toLowerCase())}(?![a-z0-9+#])`).join('|'),
      'i'
    ),
    unless: s.unless_near ? new RegExp(s.unless_near, 'i') : null,
  }));
  return compiled;
}

/** @returns {string[]} sorted unique skill ids found in the text */
export function extractSkills(text) {
  if (!text) return [];
  const hay = text.toLowerCase();
  const found = [];
  for (const s of getSkills()) {
    const i = hay.search(s.re);
    if (i === -1) continue;
    if (s.unless) {
      // Veto on collision context in a window around the first mention.
      const w = hay.slice(Math.max(0, i - 90), i + 110);
      if (s.unless.test(w)) continue;
    }
    found.push(s.id);
  }
  return found.sort();
}

// Section headings whose blocks are noise for skill extraction: perks, employer
// self-description, legal boilerplate, application logistics. A "heading" is a
// short line (≤60 chars, no terminal period); an unrecognized heading re-opens
// extraction, so unheaded or unstructured postings pass through untouched.
const SKIP_HEAD = /^(benefits|perks|what we offer|why (join|work)\b|compensation\b|pay (and|&) benefits|about (us|the (company|firm|practice|team|clinic|studio|agency))|company overview|who we are|our (story|culture|mission|values|team|benefits|perks|office)|life at\b|equal (employment )?opportunity|eeo\b|diversity, equity|dei\b|how to apply|application process|interview process)/i;

/** Drops skip-listed sections from a posting body; returns the text to extract from. */
export function zoneText(text) {
  if (!text) return '';
  const lines = String(text).split('\n');
  const out = [];
  let skipping = false;
  for (const raw of lines) {
    const t = raw.trim();
    const heady = t.length > 0 && t.length <= 60 && !/[.!?]$/.test(t);
    if (heady) {
      skipping = SKIP_HEAD.test(t);
      if (!skipping) out.push(raw);
      continue;
    }
    if (!skipping) out.push(raw);
  }
  return out.join('\n');
}

export function skillName(id) {
  const s = getSkills().find((x) => x.id === id);
  return s ? s.name : id;
}
