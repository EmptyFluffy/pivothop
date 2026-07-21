import { mapTitle } from './titles.js';

// Degree/background disciplines -> the occupation slug that best represents that origin.
// Shared by the demand-adjacency and Reddit-testimony miners: free text like "architecture",
// "product design", "mechanical engineering" names a field/discipline, not a job title, so
// mapTitle (which knows titles) misses it. This bridges disciplines to occupations.
export const DISCIPLINE = {
  'architecture': 'architect', 'architectural': 'architect', 'landscape architecture': 'landscape-architect',
  'interior design': 'interior-designer', 'graphic design': 'graphic-designer', 'industrial design': 'industrial-designer',
  'product design': 'product-designer', 'user experience': 'ux-designer', 'ux': 'ux-designer', 'ux design': 'ux-designer',
  'ui design': 'ux-designer', 'visual design': 'graphic-designer', 'fine art': 'illustrator', 'fine arts': 'illustrator', 'art': 'illustrator',
  'photography': 'photographer', 'film': 'video-editor', 'film production': 'video-editor', 'animation': 'motion-designer',
  'computer science': 'software-engineer', 'software engineering': 'software-engineer', 'computer engineering': 'software-engineer',
  'web development': 'frontend-developer', 'information technology': 'it-support', 'information systems': 'business-analyst', 'data science': 'data-scientist',
  'cybersecurity': 'security-engineer', 'statistics': 'statistician', 'mathematics': 'statistician', 'applied mathematics': 'statistician',
  'economics': 'economist', 'finance': 'financial-analyst', 'accounting': 'accountant', 'business': 'operations-manager',
  'business administration': 'operations-manager', 'marketing': 'marketing-manager', 'communications': 'content-strategist',
  'public relations': 'content-strategist', 'journalism': 'journalist', 'english': 'copywriter', 'creative writing': 'copywriter',
  'writing': 'copywriter', 'psychology': 'psychologist', 'sociology': 'social-worker', 'social work': 'social-worker',
  'anthropology': 'ux-researcher', 'education': 'teacher', 'teaching': 'teacher', 'nursing': 'registered-nurse', 'public health': 'health-education',
  'biology': 'research-scientist', 'chemistry': 'research-scientist', 'physics': 'research-scientist', 'neuroscience': 'research-scientist',
  'mechanical engineering': 'mechanical-engineer', 'electrical engineering': 'electrical-engineer', 'civil engineering': 'civil-engineer',
  'structural engineering': 'structural-engineer', 'chemical engineering': 'chemical-engineer', 'industrial engineering': 'industrial-engineer',
  'environmental engineering': 'environmental-engineer', 'aerospace engineering': 'aerospace-engineer', 'biomedical engineering': 'biomedical-engineer',
  'construction': 'construction-manager', 'construction management': 'construction-manager', 'urban planning': 'urban-planner',
  'city planning': 'urban-planner', 'law': 'lawyer', 'political science': 'economist', 'public policy': 'economist',
  'supply chain': 'supply-chain-analyst', 'logistics': 'supply-chain-analyst', 'human resources': 'hr-manager',
  'project management': 'project-manager', 'product management': 'product-manager', 'hospitality': 'hotel-manager', 'culinary': 'chef',
  'geography': 'gis-analyst', 'gis': 'gis-analyst', 'geospatial': 'gis-analyst', 'sales': 'sales-representative', 'consulting': 'management-consultant',
};
const DISC_KEYS = Object.keys(DISCIPLINE).sort((a, b) => b.length - a.length);

/** Map a clean discipline phrase to an occupation slug (exact/contained), else null. */
export function disciplineToSlug(phrase) {
  const p = ` ${phrase.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  for (const k of DISC_KEYS) if (p.includes(` ${k} `)) return DISCIPLINE[k];
  return null;
}

/**
 * Find the occupation named inside a free-text fragment, tolerating trailing words
 * ("product design and never looked back" -> product-designer). Tries the discipline
 * dictionary (longest phrase wins) then the occupation-title matcher.
 */
export function matchOccupationInText(text) {
  const clean = text.toLowerCase().replace(/[^a-z /-]/g, ' ').replace(/\s+/g, ' ').trim();
  const padded = ` ${clean} `;
  for (const k of DISC_KEYS) if (padded.includes(` ${k} `)) return DISCIPLINE[k];
  return mapTitle(clean)?.slug ?? null;
}
