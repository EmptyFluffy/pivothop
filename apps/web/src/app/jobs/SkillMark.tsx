import { SKILL_ICON_PATHS } from './skill-icons';

// One skill's mark. Brand logos are filled silhouettes; house glyphs (s:1) are
// stroked, so they need the opposite paint. Server-rendered inline: no client
// JS, and the mark inherits the chip's color through currentColor.
export function SkillMarkSvg({ id, className }: { id: string; className?: string }) {
  const m = SKILL_ICON_PATHS[id];
  if (!m) return null;
  return m.s ? (
    <svg className={className} viewBox={m.v} aria-hidden="true" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={m.d} /></svg>
  ) : (
    <svg className={className} viewBox={m.v} aria-hidden="true"><path d={m.d} fill="currentColor" /></svg>
  );
}
