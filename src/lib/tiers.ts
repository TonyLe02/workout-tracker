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

export function hexWithAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const byte = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${byte}`;
}
