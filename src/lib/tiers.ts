export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TierInfo {
  tier: Tier;
  fromHex: string;
  toHex: string;
}

// Bronze keeps the original yellow→orange flame look so low-level users
// don't get a muddy copper/brown gradient.
const BRONZE: TierInfo = { tier: 'bronze', fromHex: '#eab308', toHex: '#f97316' };
const SILVER: TierInfo = { tier: 'silver', fromHex: '#e5e7eb', toHex: '#9ca3af' };
const GOLD: TierInfo = { tier: 'gold', fromHex: '#fde047', toHex: '#ca8a04' };
const PLATINUM: TierInfo = { tier: 'platinum', fromHex: '#a5f3fc', toHex: '#0891b2' };
const DIAMOND: TierInfo = { tier: 'diamond', fromHex: '#c4b5fd', toHex: '#6366f1' };

export function getLevelTier(level: number): TierInfo {
  if (level >= 100) return DIAMOND;
  if (level >= 50) return PLATINUM;
  if (level >= 25) return GOLD;
  if (level >= 10) return SILVER;
  return BRONZE;
}

/**
 * Progress-bar colors for achievement tiers. TIER_COLORS in the achievement data
 * is tuned for dark badge gradients; a thin bar needs the brighter end of each
 * hue to stay readable at 6px.
 */
export const ACHIEVEMENT_TIER_BAR: Record<
  'bronze' | 'silver' | 'gold' | 'diamond',
  [string, string]
> = {
  bronze: ['#f59e0b', '#d97706'],
  silver: ['#e2e8f0', '#94a3b8'],
  gold: ['#fde047', '#eab308'],
  diamond: ['#67e8f9', '#22d3ee'],
};

export function hexWithAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}
