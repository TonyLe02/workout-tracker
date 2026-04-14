'use client';

// Icons
import { Flame, Trophy } from 'lucide-react';

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  const isOnFire = currentStreak >= 3;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        {/* Current Streak */}
        <div className="flex items-center gap-3">
          <div
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${isOnFire 
                ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                : 'bg-surface-hover'
              }
            `}
          >
            <Flame
              className={`
                w-7 h-7
                ${isOnFire ? 'text-yellow-300 animate-streak-fire' : 'text-muted'}
              `}
              fill={isOnFire ? 'currentColor' : 'none'}
            />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Current Streak</div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-primary">
                {currentStreak}
              </span>
              <span className="text-text-secondary">days</span>
            </div>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="text-right">
          <div className="flex items-center gap-1 text-text-secondary text-sm justify-end">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Best
          </div>
          <div className="text-2xl font-bold text-yellow-500">
            {longestStreak}
          </div>
        </div>
      </div>

      {/* Streak Multiplier Info */}
      {currentStreak > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Streak XP Bonus</span>
            <span className="text-success font-semibold">
              +{Math.min(currentStreak * 10, 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
