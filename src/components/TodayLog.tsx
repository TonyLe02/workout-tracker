'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';

import { Clock, Dumbbell, Flame, Heart, Trash2, Zap } from 'lucide-react';

import type { WorkoutEntry } from '@/types/workout';

interface TodayLogProps {
  workouts: WorkoutEntry[];
  onDelete: (id: string) => void;
}

function describeEntry(entry: WorkoutEntry) {
  const parts: Array<{ label: string; icon: typeof Dumbbell; color: string }> = [];

  if (entry.reps > 0) {
    parts.push({
      label: `${entry.reps.toLocaleString()} reps`,
      icon: Dumbbell,
      color: 'text-green-500',
    });
  }
  if (entry.activeKcal > 0) {
    parts.push({
      label: `${entry.activeKcal.toLocaleString()} active kcal`,
      icon: Zap,
      color: 'text-yellow-500',
    });
  }
  if (entry.totalKcal > 0) {
    parts.push({
      label: `${entry.totalKcal.toLocaleString()} total kcal`,
      icon: Flame,
      color: 'text-orange-500',
    });
  }

  return parts;
}

export function TodayLog({ workouts, onDelete }: TodayLogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const todaysEntries = useMemo(
    () =>
      workouts
        .filter((workout) => workout.date === today)
        .sort((leftEntry, rightEntry) => rightEntry.timestamp - leftEntry.timestamp),
    [workouts, today]
  );

  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    if (confirmingId === id) {
      onDelete(id);
      setConfirmingId(null);
      return;
    }
    setConfirmingId(id);
    window.setTimeout(() => {
      setConfirmingId((current) => (current === id ? null : current));
    }, 2500);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <span className="text-xs text-text-secondary uppercase tracking-wider">
            Today&apos;s Log
          </span>
        </div>
        {todaysEntries.length > 0 && (
          <span className="text-[11px] uppercase tracking-wider text-text-secondary/70">
            {todaysEntries.length} {todaysEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {todaysEntries.length === 0 ? (
        <div className="py-8 text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-text-secondary/30" />
          <p className="text-sm text-text-secondary/70">
            Nothing logged yet today.
          </p>
          <p className="text-xs text-text-secondary/50 mt-1">
            Add reps or calories above to get started.
          </p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide -mx-1 px-1">
          {todaysEntries.map((entry) => {
            const parts = describeEntry(entry);
            if (parts.length === 0) return null;

            const isConfirming = confirmingId === entry.id;
            const time = format(new Date(entry.timestamp), 'HH:mm');

            return (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl bg-surface-hover/40 hover:bg-surface-hover/60 transition-colors px-3 py-2.5"
              >
                <div className="text-[11px] font-mono text-text-secondary/70 w-10 flex-shrink-0">
                  {time}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 flex-1">
                  {parts.map((part) => {
                    const Icon = part.icon;
                    return (
                      <div
                        key={part.label}
                        className="flex items-center gap-1.5 text-sm text-text-primary"
                      >
                        <Icon className={`w-3.5 h-3.5 ${part.color}`} />
                        <span>{part.label}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => handleClick(entry.id)}
                  aria-label={isConfirming ? 'Confirm delete' : 'Delete entry'}
                  className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                    isConfirming
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
                      : 'text-text-secondary/60 hover:text-red-400 hover:bg-red-500/10'
                  }`}
                  title={isConfirming ? 'Click again to confirm' : 'Delete entry'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
