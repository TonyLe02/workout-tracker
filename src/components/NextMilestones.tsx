'use client';

// React/Next.js
import { useMemo } from 'react';

// Utils/Helpers
import { getNextMilestones } from '@/lib/milestones';
import { ACHIEVEMENT_TIER_BAR } from '@/lib/tiers';

// Types/Interfaces
import { ACHIEVEMENTS } from '@/data/achievements';
import type { UserStats } from '@/types/workout';

// Icons
import { Target, Trophy } from 'lucide-react';

interface NextMilestonesProps {
  stats: UserStats;
  unlockedIds: string[];
}

export function NextMilestones({ stats, unlockedIds }: NextMilestonesProps) {
  const milestones = useMemo(
    () => getNextMilestones(ACHIEVEMENTS, stats, unlockedIds, 3),
    [stats, unlockedIds]
  );

  const lockedCount = ACHIEVEMENTS.length - unlockedIds.length;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
          <span className="text-xs text-text-secondary uppercase tracking-wider truncate">
            Next Up
          </span>
        </div>
        {lockedCount > 0 && (
          <span className="text-[11px] uppercase tracking-wider text-text-secondary/70 flex-shrink-0">
            {lockedCount.toLocaleString()} still locked
          </span>
        )}
      </div>

      {milestones.length === 0 ? (
        <div className="py-6 text-center">
          <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500/40" />
          <p className="text-sm text-text-primary">Every badge unlocked.</p>
          <p className="text-xs text-text-secondary/70 mt-1">
            All {ACHIEVEMENTS.length} of them. Nothing left to chase.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {milestones.map(({ achievement, progress }) => {
            const [barFrom, barTo] = ACHIEVEMENT_TIER_BAR[achievement.tier];
            const percent = Math.round(progress.ratio * 100);

            return (
              <li
                key={achievement.id}
                className="flex items-center gap-2.5 rounded-xl bg-surface-hover/40 px-3 py-2.5"
              >
                <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">
                  {achievement.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-text-primary truncate">
                      {achievement.name}
                    </span>
                    <span className="text-[11px] font-semibold text-success/90 flex-shrink-0">
                      +{achievement.xpReward.toLocaleString()} XP
                    </span>
                  </div>

                  <div
                    className="h-1.5 bg-background/60 rounded-full overflow-hidden mt-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-label={`${achievement.name}: ${progress.countLabel}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        // Still locked, so the bar always leaves a remainder
                        // rather than reading as earned at 99%.
                        width: `${Math.min(94, Math.max(3, percent))}%`,
                        backgroundImage: `linear-gradient(90deg, ${barFrom}, ${barTo})`,
                      }}
                    />
                  </div>

                  <div className="flex items-baseline justify-between gap-2 mt-1.5">
                    <span className="text-[11px] text-text-secondary truncate">
                      {progress.remainingLabel}
                    </span>
                    <span className="text-[11px] font-mono text-text-secondary/80 flex-shrink-0">
                      {percent}%
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
