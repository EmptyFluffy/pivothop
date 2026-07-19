import path from 'node:path';
import { readJson } from '../lib/store.js';
import { TAXONOMY_DIR } from '../lib/paths.js';

// Skill extraction: match description text against the dictionary with hard word
// boundaries. Custom lookarounds so "c#", "c++", ".net", "r" don't false-positive.

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
  }));
  return compiled;
}

/** @returns {string[]} sorted unique skill ids found in the text */
export function extractSkills(text) {
  if (!text) return [];
  const hay = text.toLowerCase();
  const found = [];
  for (const s of getSkills()) {
    if (s.re.test(hay)) found.push(s.id);
  }
  return found.sort();
}

export function skillName(id) {
  const s = getSkills().find((x) => x.id === id);
  return s ? s.name : id;
}
