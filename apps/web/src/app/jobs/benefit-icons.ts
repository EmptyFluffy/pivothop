// House glyphs for the job-benefit pills.
//
// Drawn in the language of apps/scraper/scripts/skill-glyphs.mjs: 24x24, one
// optical grid, content inside roughly 3..21, STROKED not filled , rendered at
// stroke-width 1.75 with round caps and joins in currentColor, no fill and no
// fill-rule. These are ours, not a licensed icon set; brand marks elsewhere in
// the app are filled silhouettes and that contrast is deliberate.
//
// Eight of them (chart, coin, cup, medcross, plane, pulse, shield, trend) are
// the skill-glyph paths, reused or retuned, so that a benefit pill and a skill
// chip in the same viewport read as one hand.
export type BenefitMark = { d: string };
export const BENEFIT_ICON_PATHS: Record<string, BenefitMark> = {
  // certification rosette: sealed disc over two ribbon tails
  badge:      { d: 'M12 15a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z M8.6 13.8 7.5 20.5 12 18.3 16.5 20.5 15.4 13.8 M9.7 9.5 11.3 11.1 14.3 8' },
  // paid sick leave: bed, side elevation, pillow at the head
  bed:        { d: 'M3.5 19.5V9 M3.5 13.5h13a3.5 3.5 0 0 1 3.5 3.5v2.5 M3.5 16.5h16.5 M6.5 13.5v-1.8h4.5v1.8' },
  // learning budget: open book
  book:       { d: 'M12 7.6c-1.8-1.5-4.1-2.3-6.6-2.3H3.5v12.2H6c2.3 0 4.4.7 6 1.9c1.6-1.2 3.7-1.9 6-1.9h2.5V5.3h-1.9c-2.5 0-4.8.8-6.6 2.3z M12 7.6v11.8' },
  // central office: two towers on a ground line
  building:   { d: 'M3.5 20.5h17 M5.5 20.5V4h8.5v16.5 M14 9.5h4.5v11 M8 8h4 M8 12.5h4 M8 17h4' },
  // birthday off: tiered cake, one candle
  cake:       { d: 'M4 20.5h16 M5 20.5v-6.3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6.3 M5 16.2h14 M12 12.2V8.4 M12 8.4c-1-.7-1-1.9 0-2.9c1 1 1 2.2 0 2.9z' },
  // paid time off: calendar, a day approved
  calendar:   { d: 'M4 5.5h16v15H4z M4 10.5h16 M8.5 3.2v4.6 M15.5 3.2v4.6 M8.5 15.2 10.9 17.6 15.5 13' },
  // tuition: mortarboard over the crown
  cap:        { d: 'M3 9.5 12 5.7l9 3.8-9 3.8z M7 11.6v4.4c0 1.5 2.2 2.6 5 2.6c2.8 0 5-1.1 5-2.6v-4.4 M19.6 10.6v4.6' },
  // equity: bars climbing off an axis
  chart:      { d: 'M4 20V4 M4 20h16 M8 20v-4 M12.5 20v-8.5 M17 20v-13' },
  // flexible hours: clock at ten past
  clock:      { d: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M12 7.2V12l3.4 2' },
  // bonus: struck currency mark on a coin
  coin:       { d: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M14.4 9.3h-3.2a1.9 1.9 0 0 0 0 3.8h1.6a1.9 1.9 0 0 1 0 3.8H9.6 M12 7.6v1.7 M12 16.9v1.7' },
  // mentorship: compass rose, needle bearing
  compass:    { d: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z M15.5 8.5 13.6 13.6 8.5 15.5l1.9-5.1z' },
  // drinks and meals: mug on the pass
  cup:        { d: 'M5.5 7.5h11v5.5a5.5 5.5 0 0 1-11 0z M16.5 9h1.8a2.4 2.4 0 0 1 0 4.8h-1.8 M4 20.5h14' },
  // home-office budget: monitor on a desk
  desk:       { d: 'M6 4.5h12v7.5H6z M12 12v2.5 M9 14.5h6 M3.5 17.5h17 M5.5 17.5v3 M18.5 17.5v3' },
  // vision cover: eye and iris
  eye:        { d: 'M3 12c2.2-3.6 5.2-6 9-6c3.8 0 6.8 2.4 9 6c-2.2 3.6-5.2 6-9 6c-3.8 0-6.8-2.4-9-6z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  // childcare: adult and child
  family:     { d: 'M8.5 9.6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3.5 20.5v-2.4a5 5 0 0 1 10 0v2.4 M17.8 14.2a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2z M14.6 20.5v-2.3a3.2 3.2 0 0 1 6.4 0v2.3' },
  // four-day week: four blocks, the fourth one open
  fourday:    { d: 'M3.5 4.5h7v7h-7z M13.5 4.5h7v7h-7z M3.5 13h7v7h-7z M13.5 13h2.5 M18 13h2.5 M20.5 15.5v2 M13.5 15.5v2 M13.5 20h2.5 M18 20h2.5' },
  // signing bonus: boxed gift, bow above the lid
  gift:       { d: 'M3.5 9.5h17v4h-17z M5 13.5h14v7H5z M12 9.5v11 M12 7.3a2.2 2.2 0 1 0-2.2 2.2H12z M12 7.3a2.2 2.2 0 1 1 2.2 2.2H12z' },
  // part-time: half the circle drawn, half dashed
  halfcircle: { d: 'M12 3.5a8.5 8.5 0 0 0 0 17 M12 3.5v17 M13.5 3.6a8.5 8.5 0 0 1 4.5 2.4 M19 7.1a8.5 8.5 0 0 1 1.2 7.1 M18 18a8.5 8.5 0 0 1-4.5 2.4' },
  // volunteer and carer leave: heart held in an open hand
  hands:      { d: 'M4.3 13.6a1.9 1.9 0 0 1 2.7-2.7l2.2 2.2 M4.3 13.6c0 3.9 3.4 7 7.7 7c4.3 0 7.7-3.1 7.7-7v-1.4a1.9 1.9 0 0 0-3.8 0 M12 10.2 9.2 7.4a1.9 1.9 0 0 1 2.8-2.1 1.9 1.9 0 0 1 2.8 2.1z' },
  // wellness: heart
  heart:      { d: 'M12 20.3 4.9 13.4a4.4 4.4 0 0 1 7.1-5 4.4 4.4 0 0 1 7.1 5z' },
  // sabbatical: hourglass, sand through the waist
  hourglass:  { d: 'M6.5 3.5h11 M6.5 20.5h11 M7.5 3.5v3.8L12 12l-4.5 4.7v3.8 M16.5 3.5v3.8L12 12l4.5 4.7v3.8' },
  // unlimited time off: lemniscate
  infinity:   { d: 'M12 12 8 8a4 4 0 1 0 0 8L12 12l4-4a4 4 0 1 1 0 8z' },
  // career framework: ladder, rungs evenly spaced
  ladder:     { d: 'M7.5 3.5v17 M16.5 3.5v17 M7.5 8h9 M7.5 12h9 M7.5 16h9' },
  // equipment choice: laptop, lid open
  laptop:     { d: 'M5.5 5.5h13v10h-13z M3 19h18l-1.5-3.5h-15z' },
  // referral bonus: two links of chain
  link:       { d: 'M10.2 12.9a4.4 4.4 0 0 0 6.6.5l2.6-2.6a4.4 4.4 0 0 0-6.2-6.2l-1.5 1.5 M13.8 11.1a4.4 4.4 0 0 0-6.6-.5l-2.6 2.6a4.4 4.4 0 0 0 6.2 6.2l1.5-1.5' },
  // health insurance: cross
  medcross:   { d: 'M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z' },
  // mental health: head in profile, heart inside it
  mind:       { d: 'M16.7 16a6.5 6.5 0 1 0-10.1-2.3l-1.4 1.9 2 1v3.9h9.5z M12.3 14 9.1 10.9a2.2 2.2 0 0 1 3.2-2.3 2.2 2.2 0 0 1 3.2 2.3z' },
  // visa sponsorship: passport, spine and emblem
  passport:   { d: 'M5.5 3.5h13v17h-13z M8 3.5v17 M14 14.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M11.5 17.5h5' },
  // pet friendly: four toes and a pad
  paw:        { d: 'M6.6 11.5a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8z M17.4 11.5a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8z M10 9.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8z M14 9.3a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8z M12 12.6c2.6 0 4.6 2 4.6 4.4c0 2.1-1.6 3.5-4.6 3.5c-3 0-4.6-1.4-4.6-3.5c0-2.4 2-4.4 4.6-4.4z' },
  // retirement match: piggy bank, slot on the back
  piggy:      { d: 'M4.5 13.7a7.5 5.8 0 1 0 15 0 7.5 5.8 0 1 0-15 0z M9.8 10.4h4.4 M8.8 8.6 10 5.8l2.8 1.5 M8.5 19.4v1.5 M15.5 19.4v1.5 M6.3 13.2h1.7' },
  // work from abroad: plane
  plane:      { d: 'M2.5 13.5 21 5l-4.5 9.5-2 6-2.5-4.5-5-1z M12 16l4.5-7.5' },
  // health checks: trace
  pulse:      { d: 'M3 12h4l2.5-6 4 12 2.5-6H21' },
  // fertility: seedling, two leaves off one stem
  seed:       { d: 'M12 20.5V13 M12 13.2c0-3.4 2.8-6.2 6.2-6.2c0 3.4-2.8 6.2-6.2 6.2z M12 16c-3 0-5.4-2.4-5.4-5.4c3 0 5.4 2.4 5.4 5.4z' },
  // life insurance: shield, cleared
  shield:     { d: 'M12 3.2l8 3v6.3c0 4.9-3.6 7.6-8 8.8-4.4-1.2-8-3.9-8-8.8V6.2z M9 12l2.2 2.2L15.5 10' },
  // parental leave: pram, hood up
  stroller:   { d: 'M12 3.5a8 8 0 0 1 8 8H12z M4 11.5h16v.6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M8 20.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z M16 20.6a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2z' },
  // disability cover: a figure held in an open hand
  support:    { d: 'M12 7.7a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z M7.6 13.8a4.4 4.4 0 0 1 8.8 0 M3.4 15.2c.6 3.1 4.2 5.4 8.6 5.4c4.4 0 8-2.3 8.6-5.4 M3.4 15.2 5.8 12.8' },
  // employee discount: price tag, punched
  tag:        { d: 'M9 4.5h10.5v15H9L3.5 12z M10.8 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  // team retreats: tent, guyed base and open flap
  tent:       { d: 'M12 4.6 4 19.2c2.4 1.1 5.2 1.7 8 1.7c2.8 0 5.6-.6 8-1.7z M12 4.6V3 M10.4 20.7 12 14.4 13.6 20.7' },
  // conference budget: ticket, torn at the stub
  ticket:     { d: 'M4 7.5h16v3a1.5 1.5 0 0 0 0 3v3H4v-3a1.5 1.5 0 0 0 0-3z M15 7.5v2.2 M15 11.4v1.2 M15 14.3v2.2' },
  // dental: molar
  tooth:      { d: 'M12 6.4C10.6 5 9 4.3 7.4 4.3C5.2 4.3 3.8 6 3.8 8.4C3.8 10.8 4.8 12.3 5.6 14.5C6.2 16.2 6.2 19.7 7.9 19.7C9.8 19.7 9.4 14.3 12 14.3C14.6 14.3 14.2 19.7 16.1 19.7C17.8 19.7 17.8 16.2 18.4 14.5C19.2 12.3 20.2 10.8 20.2 8.4C20.2 6 18.8 4.3 16.6 4.3C15 4.3 13.4 5 12 6.4z' },
  // commuter: railcar head-on, doors and rails
  transit:    { d: 'M6 3.5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2z M7.5 7h9v4.5h-9z M8.5 14.5h2 M13.5 14.5h2 M7.5 20.5 9 17.5 M16.5 20.5 15 17.5' },
  // commission: trend line
  trend:      { d: 'M4 16.5 9.5 11l3.5 3 6.5-7.5 M20 6.5v5.5h-5.5' },
  // relocation: moving van
  truck:      { d: 'M3 6.5h10.5v10H3z M13.5 9.5h3.4l3.6 4v3h-7z M7 20.4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M16.5 20.4a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  // extra insurance: umbrella, hooked handle
  umbrella:   { d: 'M3 12.5a9 9 0 0 1 18 0z M12 12.5v5.7a2.2 2.2 0 0 1-4.4 0' },
};
