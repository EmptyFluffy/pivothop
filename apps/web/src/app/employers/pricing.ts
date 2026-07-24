/* One source of truth for the two tiers, imported by the page (display) and the
   checkout action (the charge). The server reads the amount from here by tier,
   never from anything the client sends. */
export const PRICING = {
  std: { name: 'Standard', full: 99, launch: 49 },
  feat: { name: 'Featured', full: 199, launch: 99 },
};

export function centsFor(tier: string): number {
  return (tier === 'featured' ? PRICING.feat.launch : PRICING.std.launch) * 100;
}
