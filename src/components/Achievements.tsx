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

// Utils/Helpers
import { haptic } from '@/lib/haptics';
import { getMilestoneProgress, type MilestoneProgress } from '@/lib/milestones';
import { ACHIEVEMENT_TIER_BAR } from '@/lib/tiers';

// Types/Interfaces
import type { Achievement, UserStats } from '@/types/workout';

import { ACHIEVEMENTS, TIER_COLORS } from '@/data/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  isNew?: boolean;
  progress?: MilestoneProgress | null;
}

function AchievementBadge({
  achievement,
  unlocked,
  isNew = false,
  progress = null,
}: AchievementBadgeProps) {
  const tierColor = TIER_COLORS[achievement.tier];
  const started = !unlocked && progress !== null && progress.ratio > 0;
  const [barFrom, barTo] = ACHIEVEMENT_TIER_BAR[achievement.tier];

  return (
    <div
      className={`
        relative p-4 rounded-xl border border-white/10
        h-[150px] flex flex-col
        ${unlocked || started ? '' : 'opacity-20'}
        ${isNew ? 'animate-badge-unlock' : ''}
      `}
    >
      {/* Badge Icon */}
      <div className="text-center mb-2">
        <span className={`text-3xl ${started ? 'opacity-60' : ''}`}>
          {unlocked ? achievement.icon : '🔒'}
        </span>
      </div>

      {/* Badge Info */}
      <div className="text-center flex-1 flex flex-col justify-center min-h-0 overflow-hidden">
        <div
          className={`text-sm font-semibold line-clamp-1 ${
            unlocked ? tierColor.text : started ? 'text-text-secondary' : 'text-muted'
          }`}
        >
          {achievement.name}
        </div>
        <div
          className={`text-xs mt-1 ${started ? 'line-clamp-1' : 'line-clamp-3'} ${
            unlocked
              ? 'text-text-secondary'
              : started
              ? 'text-text-secondary/80'
              : 'text-muted'
          }`}
        >
          {achievement.description}
        </div>
      </div>

      {/* Progress toward an unlock you have already started */}
      {started && progress && (
        <div className="mt-auto pt-2">
          <div
            className="h-1 rounded-full bg-background/70 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress.ratio * 100)}
            aria-label={`${achievement.name}: ${progress.countLabel}`}
          >
            <div
              className="h-full rounded-full"
              style={{
                // Locked means locked: keep a visible remainder so a 99% bar
                // never reads as a filled one.
                width: `${Math.min(94, Math.max(3, Math.round(progress.ratio * 100)))}%`,
                backgroundImage: `linear-gradient(90deg, ${barFrom}, ${barTo})`,
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-text-secondary text-center mt-1 truncate">
            {progress.countLabel}
          </div>
        </div>
      )}

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
  stats: UserStats;
}

const PAGE_SIZE = 12;
const TIER_ORDER: Record<string, number> = { diamond: 0, gold: 1, silver: 2, bronze: 3 };

type TierFilter = 'all' | 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_FILTERS: { value: TierFilter; label: string; chip: string }[] = [
  { value: 'all', label: 'All', chip: 'bg-white/10 text-text-primary ring-white/20' },
  { value: 'bronze', label: 'Bronze', chip: 'bg-amber-700/15 text-amber-500 ring-amber-700/30' },
  { value: 'silver', label: 'Silver', chip: 'bg-slate-400/15 text-slate-300 ring-slate-400/30' },
  { value: 'gold', label: 'Gold', chip: 'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30' },
  { value: 'diamond', label: 'Diamond', chip: 'bg-cyan-400/15 text-cyan-300 ring-cyan-400/30' },
];

export function AchievementsGrid({
  unlockedIds,
  newAchievementIds = [],
  stats,
}: AchievementsGridProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const progressById = useMemo(() => {
    const map = new Map<string, MilestoneProgress | null>();
    for (const achievement of ACHIEVEMENTS) {
      map.set(achievement.id, getMilestoneProgress(achievement, stats));
    }
    return map;
  }, [stats]);

  const sortedAchievements = useMemo(() => {
    const ratioOf = (id: string) => progressById.get(id)?.ratio ?? 0;

    const sorted = [...ACHIEVEMENTS].sort((a, b) => {
      const aUnlocked = unlockedIds.includes(a.id);
      const bUnlocked = unlockedIds.includes(b.id);

      if (aUnlocked !== bUnlocked) return bUnlocked ? 1 : -1;

      // Locked badges lead with the ones you are closest to earning.
      if (!aUnlocked) {
        const ratioDelta = ratioOf(b.id) - ratioOf(a.id);
        if (ratioDelta !== 0) return ratioDelta;
      }

      return TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    });

    const query = search.trim().toLowerCase();
    return sorted.filter((achievement) => {
      if (tierFilter !== 'all' && achievement.tier !== tierFilter) return false;
      if (!query) return true;
      return (
        achievement.name.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query) ||
        achievement.tier.toLowerCase().includes(query)
      );
    });
  }, [progressById, search, tierFilter, unlockedIds]);

  useEffect(() => {
    setCurrentPage(0);
  }, [search, tierFilter]);

  const unlockedCount = unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const filteredCount = sortedAchievements.length;
  const isSearching = search.trim().length > 0;
  const isFiltering = isSearching || tierFilter !== 'all';

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
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {TIER_FILTERS.map((option) => {
              const active = tierFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTierFilter(option.value)}
                  className={`text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full ring-1 transition-colors ${
                    active
                      ? option.chip
                      : 'bg-surface-hover/40 text-text-secondary ring-border hover:text-text-primary'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {isFiltering && (
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
                progress={progressById.get(achievement.id) ?? null}
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

  useEffect(() => {
    haptic('success');
  }, []);

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
