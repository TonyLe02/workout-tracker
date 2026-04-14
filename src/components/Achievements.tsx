'use client';

// Icons
import { Award, Lock } from 'lucide-react';

// Types/Interfaces
import type { Achievement } from '@/types/workout';

import { ACHIEVEMENTS, TIER_COLORS } from '@/data/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  isNew?: boolean;
}

function AchievementBadge({ achievement, unlocked, isNew = false }: AchievementBadgeProps) {
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      className={`
        relative p-4 rounded-xl transition-all duration-300
        ${unlocked
          ? `bg-gradient-to-br ${tierColor.bg} ${tierColor.border} border`
          : 'bg-surface-hover/30 border border-border/30 opacity-50'
        }
        ${isNew ? 'animate-badge-unlock' : ''}
      `}
    >
      {/* Badge Icon */}
      <div className="text-center mb-2">
        <span className="text-3xl">{unlocked ? achievement.icon : '🔒'}</span>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <div className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-muted'}`}>
          {achievement.name}
        </div>
        <div className={`text-xs mt-1 ${unlocked ? 'text-white/70' : 'text-muted'}`}>
          {achievement.description}
        </div>
      </div>

      {/* XP Reward */}
      {unlocked && (
        <div className="absolute -top-2 -right-2 bg-background/90 px-2 py-0.5 rounded-full text-xs font-semibold text-success border border-success/30">
          +{achievement.xpReward} XP
        </div>
      )}

      {/* New badge indicator */}
      {isNew && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full animate-ping" />
      )}
    </div>
  );
}

interface AchievementsGridProps {
  unlockedIds: string[];
  newAchievementIds?: string[];
}

export function AchievementsGrid({ unlockedIds, newAchievementIds = [] }: AchievementsGridProps) {
  // Sort achievements: unlocked first, then by tier (diamond, gold, silver, bronze)
  const tierOrder = { diamond: 0, gold: 1, silver: 2, bronze: 3 };
  const sortedAchievements = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = unlockedIds.includes(a.id);
    const bUnlocked = unlockedIds.includes(b.id);
    
    if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
    return tierOrder[a.tier] - tierOrder[b.tier];
  });

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-text-secondary uppercase tracking-wider">
            Achievements
          </span>
        </div>
        <div className="text-sm text-text-secondary">
          <span className="text-white font-semibold">{unlockedCount}</span>
          <span> / {totalCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sortedAchievements.map((achievement) => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            unlocked={unlockedIds.includes(achievement.id)}
            isNew={newAchievementIds.includes(achievement.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Popup for new achievements
interface AchievementPopupProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`
          p-8 rounded-2xl text-center animate-badge-unlock
          bg-gradient-to-br ${tierColor.bg} ${tierColor.border} border-2
          max-w-sm mx-4
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">{achievement.icon}</div>
        <div className="text-sm text-white/70 uppercase tracking-wider mb-2">
          Achievement Unlocked!
        </div>
        <div className="text-2xl font-bold text-white mb-2">
          {achievement.name}
        </div>
        <div className="text-white/70 mb-4">
          {achievement.description}
        </div>
        <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full">
          <span className="text-success font-bold">+{achievement.xpReward} XP</span>
        </div>
        <button
          onClick={onClose}
          className="block w-full mt-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
}
