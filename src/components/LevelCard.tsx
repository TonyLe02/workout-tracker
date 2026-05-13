'use client';

// Components
import { CountUp } from './CountUp';

// Utils/Helpers
import { getLevelTier, hexWithAlpha } from '@/lib/tiers';

// Types/Interfaces
import { getLevelTitle, getXPForNextLevel, getCurrentLevelXP } from '@/types/workout';

// Icons
import { BicepsFlexed, Sparkles, Star } from 'lucide-react';

interface LevelCardProps {
  level: number;
  totalXP: number;
  isLevelUp?: boolean;
  todayXP?: number;
}

export function LevelCard({ level, totalXP, isLevelUp = false, todayXP = 0 }: LevelCardProps) {

  const title = getLevelTitle(level);
  const xpForNext = getXPForNextLevel(level);
  const currentXP = getCurrentLevelXP(totalXP, level);
  const progress = (currentXP / xpForNext) * 100;
  const tier = getLevelTier(level);
  const tierGradient = `linear-gradient(to right, ${tier.fromHex}, ${tier.toHex})`;
  const tierBorder = hexWithAlpha(tier.toHex, 0.4);

  return (
    <div
      className={`
        glass rounded-2xl p-6
        ${isLevelUp ? 'animate-level-up' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center"
              style={{ border: `1px solid ${tierBorder}` }}
            >
              <span className="text-2xl font-bold text-white">{level}</span>
            </div>
            {isLevelUp && (
              <div className="absolute -top-1 -right-1">
                <Star className="w-6 h-6 text-yellow-400 animate-float" fill="currentColor" />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm text-text-secondary">Level</div>
            <div className="text-xl font-bold text-text-primary">{title}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-secondary text-sm justify-end">
            <BicepsFlexed className="w-4 h-4" />
            Total XP
          </div>
          <div
            className="text-2xl font-bold text-transparent bg-clip-text font-mono"
            style={{ backgroundImage: tierGradient }}
          >
            <CountUp value={totalXP} />
          </div>
          {todayXP > 0 && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-yellow-500/10 ring-1 ring-yellow-500/20 text-[11px] text-yellow-400 font-medium">
              <Sparkles className="w-3 h-3" />
              +{todayXP.toLocaleString()} today
            </div>
          )}
        </div>
      </div>

      {/* XP Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-2">
          <span>Progress to Level {level + 1}</span>
          <span>{currentXP.toLocaleString()} / {xpForNext.toLocaleString()} XP</span>
        </div>
        <div className="h-3 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
