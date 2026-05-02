'use client';

// React/Next.js
import { useMemo } from 'react';

// External libraries
import { format, parseISO } from 'date-fns';

// Icons
import { Dumbbell, Flame, Trophy } from 'lucide-react';

// Types/Interfaces
import type { WorkoutEntry } from '@/types/workout';

interface HeaderHighlightsProps {
  workouts: WorkoutEntry[];
}

interface DayAggregate {
  date: string;
  reps: number;
  kcal: number;
}

function aggregateByDay(workouts: WorkoutEntry[]): DayAggregate[] {
  const byDate: Record<string, WorkoutEntry[]> = {};
  for (const workout of workouts) {
    if (!byDate[workout.date]) byDate[workout.date] = [];
    byDate[workout.date].push(workout);
  }

  return Object.entries(byDate).map(([date, dayWorkouts]) => {
    const reps = dayWorkouts.reduce((sum, w) => sum + w.reps, 0);
    const sorted = [...dayWorkouts].sort((a, b) => b.timestamp - a.timestamp);
    const latestTotal = sorted.find((w) => w.totalKcal > 0)?.totalKcal ?? 0;
    const latestActive = sorted.find((w) => w.activeKcal > 0)?.activeKcal ?? 0;
    const kcal = latestTotal || latestActive;
    return { date, reps, kcal };
  });
}

interface PrLineProps {
  icon: React.ReactNode;
  value: number;
  unit: string;
  date: string;
}

function PrLine({ icon, value, unit, date }: PrLineProps) {
  return (
    <div className="flex items-center gap-1.5 text-xs sm:text-base leading-tight">
      {icon}
      <span className="text-white font-semibold">
        {value.toLocaleString()}
      </span>
      <span className="text-text-secondary">{unit}</span>
      <span className="text-text-secondary/80">
        · {format(parseISO(date), 'MMM d')}
      </span>
    </div>
  );
}

export function HeaderHighlights({ workouts }: HeaderHighlightsProps) {
  const { prReps, prKcal } = useMemo(() => {
    const days = aggregateByDay(workouts);
    const topReps = days
      .filter((d) => d.reps > 0)
      .sort((a, b) => b.reps - a.reps)[0];
    const topKcal = days
      .filter((d) => d.kcal > 0)
      .sort((a, b) => b.kcal - a.kcal)[0];
    return { prReps: topReps, prKcal: topKcal };
  }, [workouts]);

  if (!prReps && !prKcal) {
    return (
      <div className="flex items-center gap-3 sm:gap-4">
        <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400 flex-shrink-0" />
        <div className="flex flex-col leading-tight">
          <p className="text-sm sm:text-lg font-medium text-white">
            No records yet
          </p>
          <p className="text-xs sm:text-sm text-text-secondary">
            Log your first session to start.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
      <Trophy className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400 flex-shrink-0" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-xs sm:text-base uppercase tracking-wider text-text-secondary font-medium">
          Personal Best
        </span>
        {prKcal && (
          <PrLine
            icon={
              <Flame
                className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0"
                fill="currentColor"
              />
            }
            value={prKcal.kcal}
            unit="kcal"
            date={prKcal.date}
          />
        )}
        {prReps && (
          <PrLine
            icon={
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            }
            value={prReps.reps}
            unit="reps"
            date={prReps.date}
          />
        )}
      </div>
    </div>
  );
}
