'use client';

// React/Next.js
import { useEffect, useMemo, useState } from 'react';

// Icons
import {
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  X,
} from 'lucide-react';

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
        relative p-4 rounded-xl border border-white/10
        h-[150px] flex flex-col
        ${unlocked ? '' : 'opacity-20'}
        ${isNew ? 'animate-badge-unlock' : ''}
      `}
    >
      {/* Badge Icon */}
      <div className="text-center mb-2">
        <span className="text-3xl">{unlocked ? achievement.icon : '🔒'}</span>
      </div>

      {/* Badge Info */}
      <div className="text-center flex-1 flex flex-col justify-center min-h-0">
        <div className={`text-sm font-semibold line-clamp-1 ${unlocked ? tierColor.text : 'text-muted'}`}>
          {achievement.name}
        </div>
        <div className={`text-xs mt-1 line-clamp-3 ${unlocked ? 'text-text-secondary' : 'text-muted'}`}>
          {achievement.description}
        </div>
      </div>

      {/* XP Reward */}
      {unlocked && (
        <div className="absolute -top-2 -right-2 bg-background/80 backdrop-blur-md px-2 py-0.5 rounded-full text-xs font-semibold text-success/90 border border-success/20">
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

const PAGE_SIZE = 12;
const TIER_ORDER: Record<string, number> = { diamond: 0, gold: 1, silver: 2, bronze: 3 };

export function AchievementsGrid({ unlockedIds, newAchievementIds = [] }: AchievementsGridProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');

  const sortedAchievements = useMemo(() => {
    const sorted = [...ACHIEVEMENTS].sort((a, b) => {
      const aUnlocked = unlockedIds.includes(a.id);
      const bUnlocked = unlockedIds.includes(b.id);

      if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;
      return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    });

    const query = search.trim().toLowerCase();
    if (!query) return sorted;

    return sorted.filter((achievement) => {
      return (
        achievement.name.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query) ||
        achievement.tier.toLowerCase().includes(query)
      );
    });
  }, [search, unlockedIds]);

  useEffect(() => {
    setCurrentPage(0);
  }, [search]);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const filteredCount = sortedAchievements.length;
  const isSearching = search.trim().length > 0;

  const totalPages = Math.max(1, Math.ceil(sortedAchievements.length / PAGE_SIZE));
  const visibleAchievements = sortedAchievements.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  return (
    <div className="glass rounded-2xl p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Achievements
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            <span className="text-white font-semibold">{unlockedCount}</span>
            <span> / {totalCount}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-secondary" />
          )}
        </div>
      </button>

      {/* Progress Bar */}
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Achievement Grid */}
      {isExpanded && (
        <>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search achievements…"
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-surface-hover/40 border border-border/60 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-border-hover"
            />
            {isSearching && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-secondary/60 hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isSearching && (
            <div className="text-xs text-text-secondary mt-2">
              {filteredCount === 0
                ? 'No matches'
                : `${filteredCount} ${filteredCount === 1 ? 'match' : 'matches'}`}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {visibleAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked={unlockedIds.includes(achievement.id)}
                isNew={newAchievementIds.includes(achievement.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </button>
              <span className="text-xs text-text-secondary font-mono">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage === totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          )}
        </>
      )}
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
